"use client";

import { useState, useMemo, useEffect } from "react";
import { ExchangeLocation, LatencyConnection, FilterOptions } from "@/types";
import { EXCHANGE_LOCATIONS } from "@/constants/exchangeLocations";
import {
  createLatencyConnections,
  filterExchangesByProvider,
  filterExchangesByName,
} from "@/lib/exchangeData";
import { useLatencyData, synthesizeRegionExchanges } from "./useLatencyData";

interface UseExchangeDataReturn {
  exchanges: ExchangeLocation[];
  connections: LatencyConnection[];
  filteredExchanges: ExchangeLocation[];
  filteredConnections: LatencyConnection[];
  selectedExchange: ExchangeLocation | null;
  setSelectedExchange: (exchange: ExchangeLocation | null) => void;
  hoveredExchange: ExchangeLocation | null;
  setHoveredExchange: (exchange: ExchangeLocation | null) => void;
}

export const useExchangeData = (
  filters: FilterOptions
): UseExchangeDataReturn => {
  const { latencyData } = useLatencyData(10000);
  const [selectedExchange, setSelectedExchange] =
    useState<ExchangeLocation | null>(null);
  const [hoveredExchange, setHoveredExchange] =
    useState<ExchangeLocation | null>(null);
  const [regionExchanges, setRegionExchanges] = useState<ExchangeLocation[]>(
    []
  );

  // Fetch region exchanges when latencyData changes
  useEffect(() => {
    let cancelled = false;
    async function fetchRegions() {
      try {
        const regions = await synthesizeRegionExchanges(latencyData);
        if (!cancelled) setRegionExchanges(regions);
      } catch (e) {
        if (!cancelled) setRegionExchanges([]);
      }
    }
    if (latencyData.length > 0) fetchRegions();
    else setRegionExchanges([]);
    return () => {
      cancelled = true;
    };
  }, [latencyData]);

  // All available exchanges (real + region)
  const exchanges = useMemo(
    () => [...EXCHANGE_LOCATIONS, ...regionExchanges],
    [regionExchanges]
  );

  // Create connections from latency data
  const connections = useMemo(() => {
    if (latencyData.length === 0) return [];
    try {
      return createLatencyConnections(exchanges, latencyData);
    } catch (error) {
      console.error("Error creating connections:", error);
      return [];
    }
  }, [exchanges, latencyData]);

  // Apply filters to exchanges
  const filteredExchanges = useMemo(() => {
    let filtered = exchanges;
    if (filters.cloudProviders.length > 0) {
      filtered = filterExchangesByProvider(filtered, filters.cloudProviders);
    }
    // Filter by exchange names
    if (filters.exchanges.length > 0) {
      filtered = filterExchangesByName(filtered, filters.exchanges);
    }
    return filtered;
  }, [exchanges, filters.cloudProviders, filters.exchanges]);

  // Apply filters to connections
  const filteredConnections = useMemo(() => {
    return connections
      .filter(
        (
          connection
        ): connection is LatencyConnection & {
          source: ExchangeLocation;
          target: ExchangeLocation;
        } => !!connection && !!connection.source && !!connection.target
      )
      .filter((connection) => {
        // Check if both source and target exchanges are in filtered list
        const sourceIncluded = filteredExchanges.some(
          (ex) => ex.id === connection.source.id
        );
        const targetIncluded = filteredExchanges.some(
          (ex) => ex.id === connection.target.id
        );
        if (!sourceIncluded || !targetIncluded) return false;
        // Check latency range
        const { min, max } = filters.latencyRange;
        if (connection.latency < min || connection.latency > max) return false;
        return true;
      });
  }, [connections, filteredExchanges, filters.latencyRange]);

  return {
    exchanges,
    connections,
    filteredExchanges,
    filteredConnections,
    selectedExchange,
    setSelectedExchange,
    hoveredExchange,
    setHoveredExchange,
  };
};
