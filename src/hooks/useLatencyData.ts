// src/hooks/useLatencyData.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ExchangeLocation,
  LatencyData,
  HistoricalLatencyData,
  MetricsData,
} from "@/types";
import { createLatencyConnections } from "@/lib/exchangeData";
import { EXCHANGE_LOCATIONS } from "@/constants/exchangeLocations";

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
  // Defensive checks for the new response structure
  if (
    !json.success ||
    !json.data ||
    !json.data.result ||
    !json.data.result.summary_0
  )
    throw new Error("Malformed Radar API response");
  return json.data.result.summary_0;
}

// Helper: Fetch and aggregate latency data for all locations
async function fetchAllRadarLatencyData(): Promise<LatencyData[]> {
  const now = Date.now();
  const results = await Promise.all(
    LOCATIONS.map(async (loc) => {
      if (loc.code === "Cloudflare") return null;
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
  // Defensive checks for the new response structure
  if (
    !json.success ||
    !json.data ||
    !json.data.result ||
    !json.data.result.serie_0
  )
    throw new Error("Malformed Radar historical API response");
  const serie = json.data.result.serie_0;
  // Handle both array and object (Cloudflare may return either)
  if (Array.isArray(serie)) {
    // Old format (should not happen now, but fallback)
    return (serie as Array<{ timestamp: string; median: number }>).map(
      (item) => ({
        timestamp: new Date(item.timestamp).getTime(),
        latency: item.median || 0,
        source: locationCode,
        target: "Cloudflare",
      })
    );
  } else if (
    typeof serie === "object" &&
    Array.isArray(serie.timestamps) &&
    Array.isArray(serie.p50)
  ) {
    // New format: timestamps and p50 (median) arrays
    const { timestamps, p50 } = serie;
    const result: HistoricalLatencyData[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];
      const median = p50[i];
      if (ts && median !== undefined && median !== null) {
        result.push({
          timestamp: new Date(ts).getTime(),
          latency: parseFloat(median),
          source: locationCode,
          target: "Cloudflare",
        });
      }
    }
    return result;
  } else {
    throw new Error(
      "Malformed Radar historical API response: unexpected format"
    );
  }
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

// Helper: Fetch region metadata from the local API proxy
async function fetchRegionMetadata(regionCode: string): Promise<{
  code: string;
  name: string;
  latitude: number;
  longitude: number;
}> {
  try {
    if (regionCode === "Cloudflare") {
      return {
        code: "Cloudflare",
        name: "Cloudflare",
        latitude: 37.7749,
        longitude: -122.4194,
      };
    }

    const res = await fetch(`/api/radar/location?code=${regionCode}`);
    if (!res.ok)
      throw new Error(`Failed to fetch region metadata for ${regionCode}`);
    const json = await res.json();
    if (
      !json.success ||
      !json.data ||
      !json.data.result ||
      !json.data.result.location
    ) {
      throw new Error("Malformed location API response");
    }
    const loc = json.data.result.location;
    return {
      code: loc.code,
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
    };
  } catch (e) {
    // Fallback to static coordinates if API fails
    const fallbackCoords: Record<
      string,
      { latitude: number; longitude: number; name: string }
    > = {
      US: { latitude: 39.8283, longitude: -98.5795, name: "United States" },
      DE: { latitude: 51.1657, longitude: 10.4515, name: "Germany" },
      GB: { latitude: 55.3781, longitude: -3.436, name: "United Kingdom" },
      SG: { latitude: 1.3521, longitude: 103.8198, name: "Singapore" },
      JP: { latitude: 36.2048, longitude: 138.2529, name: "Japan" },
      IN: { latitude: 20.5937, longitude: 78.9629, name: "India" },
    };
    if (regionCode in fallbackCoords) {
      const { latitude, longitude, name } = fallbackCoords[regionCode];
      return { code: regionCode, name, latitude, longitude };
    }
    throw e;
  }
}

// Helper: Map region code to cloud provider
const REGION_PROVIDER_MAP: Record<string, "AWS" | "GCP" | "Azure"> = {
  US: "AWS",
  DE: "GCP",
  GB: "Azure",
  SG: "AWS",
  JP: "GCP",
  IN: "Azure",
  // Add more as needed
};

// Helper: Synthesize ExchangeLocation objects for all region codes in latencyData
async function synthesizeRegionExchanges(
  latencyData: LatencyData[]
): Promise<ExchangeLocation[]> {
  const regionCodes = Array.from(
    new Set(latencyData.flatMap((d) => [d.source, d.target]))
  );
  const exchanges: ExchangeLocation[] = [];
  for (const code of regionCodes) {
    // Avoid duplicates with real exchanges
    if (EXCHANGE_LOCATIONS.some((e) => e.id === code)) continue;
    try {
      const meta = await fetchRegionMetadata(code);
      const provider = REGION_PROVIDER_MAP[code];
      exchanges.push({
        id: code,
        name: code,
        displayName: `Region: ${meta.name}`,
        coordinates: {
          latitude: meta.latitude,
          longitude: meta.longitude,
          altitude: 0,
        },
        cloudProvider: provider,
        provider: provider, // custom field for UI distinction
        region: meta.name,
        regionCode: code,
        serverCount: 1,
        status: "online",
      } as ExchangeLocation & { provider?: string });
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(
          `Failed to synthesize region exchange for ${code}:`,
          e.message
        );
      } else {
        console.error(`Failed to synthesize region exchange for ${code}:`, e);
      }
      // If metadata fails, skip this region
      // Optionally, log or notify
    }
  }
  return exchanges;
}

// Helper: Synthesize LatencyData for all region pairs if only region-to-Cloudflare is provided
function synthesizeRegionConnections(
  latencyData: LatencyData[]
): LatencyData[] {
  // If the data is only region-to-Cloudflare (e.g., source: 'US', target: 'Cloudflare'),
  // synthesize connections between all regions for a more meaningful topology.
  const regionNodes = Array.from(new Set(latencyData.map((d) => d.source)));
  const regionPairs: LatencyData[] = [];
  for (let i = 0; i < regionNodes.length; i++) {
    for (let j = i + 1; j < regionNodes.length; j++) {
      // Find latency for each region to Cloudflare and average them
      const latencyA = latencyData.find((d) => d.source === regionNodes[i]);
      const latencyB = latencyData.find((d) => d.source === regionNodes[j]);
      if (latencyA && latencyB) {
        regionPairs.push({
          id: `cf-latency-${regionNodes[i]}-${regionNodes[j]}`,
          source: regionNodes[i],
          target: regionNodes[j],
          latency: (latencyA.latency + latencyB.latency) / 2,
          timestamp: Math.max(latencyA.timestamp, latencyB.timestamp),
          quality: latencyA.quality, // or recalculate based on average
          packetLoss:
            ((latencyA.packetLoss || 0) + (latencyB.packetLoss || 0)) / 2,
          jitter: ((latencyA.jitter || 0) + (latencyB.jitter || 0)) / 2,
        });
      }
    }
  }
  // Optionally, keep the original region-to-Cloudflare connections for star topology
  return [...latencyData, ...regionPairs];
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
  refreshInterval: number = 5 * 60 * 1000
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
      // Fetch historical data (empty for now)
      const historical = await fetchRadarHistoricalData();
      // Use the synthesized connections for a more meaningful topology
      const synthesizedLatencyData = synthesizeRegionConnections(latency);
      // Synthesize region exchanges for uptime calculation
      const regionExchanges = await synthesizeRegionExchanges(
        synthesizedLatencyData
      );
      const allExchanges = [...EXCHANGE_LOCATIONS, ...regionExchanges];
      // Calculate uptime as percent of online exchanges
      const onlineCount = allExchanges.filter(
        (e) => e.status === "online"
      ).length;
      const uptime =
        allExchanges.length > 0 ? (onlineCount / allExchanges.length) * 100 : 0;
      // Metrics: Calculate from latency data
      const avgLatency = synthesizedLatencyData.length
        ? synthesizedLatencyData.reduce(
            (sum: number, d: LatencyData) => sum + d.latency,
            0
          ) / synthesizedLatencyData.length
        : 0;
      setLatencyData(synthesizedLatencyData);
      setHistoricalData(historical);
      setMetrics({
        totalExchanges: synthesizedLatencyData.length,
        activeConnections: synthesizedLatencyData.length,
        averageLatency: avgLatency,
        uptime,
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

  // Initial data fetch (only on mount)
  useEffect(() => {
    fetchLatencyData();
    // Set up auto-refresh interval
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

export { synthesizeRegionExchanges };
