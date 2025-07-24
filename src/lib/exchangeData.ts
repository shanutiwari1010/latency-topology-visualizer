import { ExchangeLocation, LatencyConnection, LatencyData } from "@/types";
import { EXCHANGE_LOCATIONS } from "@/constants/exchangeLocations";

export const createLatencyConnections = (
  exchanges: ExchangeLocation[],
  latencyData: LatencyData[]
): LatencyConnection[] => {
  return latencyData
    .map((data) => {
      const source = exchanges.find((e) => e.id === data.source);
      const target = exchanges.find((e) => e.id === data.target);
      if (!source || !target) return undefined;
      return {
        id: data.id,
        source,
        target,
        latency: data.latency,
        quality: data.quality,
        isActive: Math.random() > 0.1, // 90% of connections are active
        animationProgress: Math.random(), // Random starting animation position
      };
    })
    .filter((conn): conn is LatencyConnection => !!conn);
};

export const filterExchangesByProvider = (
  exchanges: ExchangeLocation[],
  providers: string[]
): ExchangeLocation[] => {
  if (providers.length === 0) return exchanges;
  return exchanges.filter((exchange) =>
    providers.includes(exchange.cloudProvider)
  );
};

export const filterExchangesByName = (
  exchanges: ExchangeLocation[],
  names: string[]
): ExchangeLocation[] => {
  if (names.length === 0) return exchanges;
  return exchanges.filter((exchange) => names.includes(exchange.name));
};

export const getExchangeById = (id: string): ExchangeLocation | undefined => {
  return EXCHANGE_LOCATIONS.find((exchange) => exchange.id === id);
};

export const getExchangesByProvider = (
  provider: string
): ExchangeLocation[] => {
  return EXCHANGE_LOCATIONS.filter(
    (exchange) => exchange.cloudProvider === provider
  );
};

export const calculateAverageLatency = (
  connections: LatencyConnection[]
): number => {
  if (connections.length === 0) return 0;
  const total = connections.reduce((sum, conn) => sum + conn.latency, 0);
  return total / connections.length;
};
