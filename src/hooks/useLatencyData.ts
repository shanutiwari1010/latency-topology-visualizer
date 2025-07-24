// src/hooks/useLatencyData.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LatencyData, HistoricalLatencyData, MetricsData } from "@/types";

// List of locations to fetch (can be expanded as needed)
const LOCATIONS = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "SG", name: "Singapore" },
  { code: "JP", name: "Japan" },
  { code: "IN", name: "India" },
  // Add more as needed
];

// Helper: Fetch Cloudflare Radar latency/quality data for a location (via local API proxy)
async function fetchRadarQualityForLocation(locationCode: string) {
  const url = `/api/radar/latency?type=realtime&location=${locationCode}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Radar API error for ${locationCode}`);
  const json = await res.json();
  if (!json.success || !json.data.result || !json.data.result.summary_0)
    throw new Error("Malformed Radar API response");
  return json.data.result.summary_0;
}

// Helper: Fetch and aggregate latency data for all locations
async function fetchAllRadarLatencyData(): Promise<LatencyData[]> {
  const now = Date.now();
  const results = await Promise.all(
    LOCATIONS.map(async (loc) => {
      try {
        const data = await fetchRadarQualityForLocation(loc.code);
        return {
          id: `cf-latency-${loc.code}`,
          source: loc.code,
          target: "Cloudflare",
          latency: parseFloat(data.latencyIdle) || 0,
          timestamp: now,
          quality:
            parseFloat(data.latencyIdle) < 50
              ? "excellent"
              : parseFloat(data.latencyIdle) < 100
              ? "good"
              : parseFloat(data.latencyIdle) < 200
              ? "fair"
              : "poor",
          packetLoss: parseFloat(data.packetLoss) || 0,
          jitter: parseFloat(data.jitterIdle) || 0,
        } as LatencyData;
      } catch (e) {
        // If one location fails, skip it
        return null;
      }
    })
  );
  return results.filter(Boolean) as LatencyData[];
}

// Helper: Fetch historical latency time series for a location (via local API proxy)
async function fetchRadarHistoricalForLocation(
  locationCode: string
): Promise<HistoricalLatencyData[]> {
  const url = `/api/radar/latency?type=historical&location=${locationCode}`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Radar historical API error for ${locationCode}`);
  const json = await res.json();
  if (!json.success || !json.data.result || !Array.isArray(json.data.result.serie_0))
    throw new Error("Malformed Radar historical API response");
  return (
    json.data.result.serie_0 as Array<{ timestamp: string; median: number }>
  ).map((item) => ({
    timestamp: new Date(item.timestamp).getTime(),
    latency: item.median || 0,
    source: locationCode,
    target: "Cloudflare",
  }));
}

// Helper: Fetch and aggregate historical latency data for all locations
async function fetchRadarHistoricalData(): Promise<HistoricalLatencyData[]> {
  const results = await Promise.all(
    LOCATIONS.map(async (loc) => {
      try {
        return await fetchRadarHistoricalForLocation(loc.code);
      } catch (e) {
        // If one location fails, skip it
        return [];
      }
    })
  );
  // Flatten the array of arrays
  return results.flat();
}

interface UseLatencyDataReturn {
  latencyData: LatencyData[];
  historicalData: HistoricalLatencyData[];
  metrics: MetricsData;
  isLoading: boolean;
  error: string | null;
  refreshData: () => void;
  lastUpdated: number;
}

export const useLatencyData = (
  refreshInterval: number = 10000
): UseLatencyDataReturn => {
  const [latencyData, setLatencyData] = useState<LatencyData[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalLatencyData[]>(
    []
  );
  const [metrics, setMetrics] = useState<MetricsData>({
    totalExchanges: 0,
    activeConnections: 0,
    averageLatency: 0,
    uptime: 0,
    lastUpdated: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLatencyData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch real-time latency data for all locations
      const latency = await fetchAllRadarLatencyData();
      console.log(latency, "latency");
      // Fetch historical data (empty for now)
      const historical = await fetchRadarHistoricalData();
      // Metrics: Calculate from latency data
      const avgLatency = latency.length
        ? latency.reduce((sum: number, d: LatencyData) => sum + d.latency, 0) /
          latency.length
        : 0;
      setLatencyData(latency);
      setHistoricalData(historical);
      setMetrics({
        totalExchanges: latency.length,
        activeConnections: latency.length,
        averageLatency: avgLatency,
        uptime: 99.9,
        lastUpdated: Date.now(),
      });
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setLatencyData([]);
      setHistoricalData([]);
      setMetrics({
        totalExchanges: 0,
        activeConnections: 0,
        averageLatency: 0,
        uptime: 0,
        lastUpdated: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    setIsLoading(true);
    fetchLatencyData();
  }, [fetchLatencyData]);

  // Initial data fetch
  useEffect(() => {
    fetchLatencyData();
  }, []);

  // Set up auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchLatencyData();
      }, refreshInterval);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval, fetchLatencyData]);

  return {
    latencyData,
    historicalData,
    metrics,
    isLoading,
    error,
    refreshData,
    lastUpdated,
  };
};
