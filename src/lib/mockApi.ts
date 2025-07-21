import {
  LatencyData,
  HistoricalLatencyData,
  MetricsData,
  ExchangeLocation,
} from "@/types";
import {
  EXCHANGE_LOCATIONS,
  LATENCY_THRESHOLDS,
} from "@/constants/exchangeLocations";

// Generate realistic latency values based on geographic distance
const calculateBaseLatency = (
  source: ExchangeLocation,
  target: ExchangeLocation
): number => {
  const distance = getDistance(
    source.coordinates.latitude,
    source.coordinates.longitude,
    target.coordinates.latitude,
    target.coordinates.longitude
  );

  // Base latency calculation: ~0.1ms per 100km + random variation
  const baseLatency = (distance / 100) * 0.1;
  const providerPenalty = source.cloudProvider !== target.cloudProvider ? 5 : 0;
  const randomVariation = Math.random() * 10 - 5; // ±5ms variation

  return Math.max(1, baseLatency + providerPenalty + randomVariation);
};

// Calculate distance between two coordinates using Haversine formula
function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate mock latency data
export const generateMockLatencyData = (): LatencyData[] => {
  const data: LatencyData[] = [];
  const exchanges = EXCHANGE_LOCATIONS;

  // Generate connections between exchanges
  for (let i = 0; i < exchanges.length; i++) {
    for (let j = i + 1; j < exchanges.length; j++) {
      const source = exchanges[i];
      const target = exchanges[j];

      // Don't create connections between same exchange in different regions too frequently
      if (source.name === target.name && Math.random() > 0.3) continue;

      const baseLatency = calculateBaseLatency(source, target);

      // Add some real-time variation
      const variation = (Math.random() - 0.5) * 10; // ±5ms variation
      const currentLatency = Math.max(1, baseLatency + variation);

      // Determine quality
      let quality: "excellent" | "good" | "fair" | "poor" = "poor";
      if (currentLatency <= LATENCY_THRESHOLDS.excellent) quality = "excellent";
      else if (currentLatency <= LATENCY_THRESHOLDS.good) quality = "good";
      else if (currentLatency <= LATENCY_THRESHOLDS.fair) quality = "fair";

      data.push({
        id: `${source.id}-${target.id}`,
        source: source.id,
        target: target.id,
        latency: currentLatency,
        timestamp: Date.now(),
        quality,
        packetLoss: Math.random() * 0.1, // 0-0.1% packet loss
        jitter: Math.random() * 2, // 0-2ms jitter
      });
    }
  }

  return data;
};

// Generate historical latency data
export const generateHistoricalData = (
  days: number = 30
): HistoricalLatencyData[] => {
  const data: HistoricalLatencyData[] = [];
  const exchanges = EXCHANGE_LOCATIONS;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Generate data for selected pairs
  const pairs = [
    { source: "binance-us-east", target: "binance-eu-west" },
    { source: "okx-us", target: "okx-europe" },
    { source: "bybit-us", target: "bybit-eu" },
    { source: "binance-asia", target: "okx-asia" },
  ];

  pairs.forEach(({ source, target }) => {
    const sourceExchange = exchanges.find((e) => e.id === source);
    const targetExchange = exchanges.find((e) => e.id === target);

    if (!sourceExchange || !targetExchange) return;

    const baseLatency = calculateBaseLatency(sourceExchange, targetExchange);

    // Generate hourly data points
    for (let day = 0; day < days; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = now - (days - day) * dayMs + hour * 60 * 60 * 1000;

        // Add daily and hourly patterns
        const dailyPattern = Math.sin((day / 7) * 2 * Math.PI) * 3; // Weekly pattern
        const hourlyPattern = Math.sin((hour / 24) * 2 * Math.PI) * 5; // Daily pattern
        const randomNoise = (Math.random() - 0.5) * 8; // Random variation

        const latency = Math.max(
          1,
          baseLatency + dailyPattern + hourlyPattern + randomNoise
        );

        data.push({
          timestamp,
          latency,
          source,
          target,
        });
      }
    }
  });

  return data.sort((a, b) => a.timestamp - b.timestamp);
};

// Generate mock metrics
export const generateMockMetrics = (): MetricsData => {
  return {
    totalExchanges: EXCHANGE_LOCATIONS.length,
    activeConnections: Math.floor(Math.random() * 50) + 20,
    averageLatency: Math.random() * 30 + 15, // 15-45ms
    uptime: 99.5 + Math.random() * 0.5, // 99.5-100%
    lastUpdated: Date.now(),
  };
};

// API simulation with delays
export const mockApiCall = <T>(data: T, delay: number = 500): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};
