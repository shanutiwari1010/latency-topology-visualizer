export interface ExchangeLocation {
  id: string;
  name: string;
  displayName: string;
  coordinates: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  cloudProvider: 'AWS' | 'GCP' | 'Azure';
  region: string;
  regionCode: string;
  serverCount: number;
  status: 'online' | 'offline' | 'maintenance';
  description?: string;
}

export interface LatencyData {
  id: string;
  source: string;
  target: string;
  latency: number;
  timestamp: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  packetLoss?: number;
  jitter?: number;
}

export interface HistoricalLatencyData {
  timestamp: number;
  latency: number;
  source: string;
  target: string;
}

export interface CloudRegion {
  id: string;
  provider: 'AWS' | 'GCP' | 'Azure';
  name: string;
  code: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  exchangeCount: number;
  averageLatency: number;
}

export interface LatencyConnection {
  id: string;
  source: ExchangeLocation;
  target: ExchangeLocation;
  latency: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  isActive: boolean;
  animationProgress: number;
}

export interface FilterOptions {
  exchanges: string[];
  cloudProviders: ('AWS' | 'GCP' | 'Azure')[];
  latencyRange: {
    min: number;
    max: number;
  };
  showRealTime: boolean;
  showHistorical: boolean;
  showRegions: boolean;
}

export interface MetricsData {
  totalExchanges: number;
  activeConnections: number;
  averageLatency: number;
  uptime: number;
  lastUpdated: number;
}

export interface ThemeSettings {
  mode: 'dark' | 'light';
  mapStyle: 'realistic' | 'minimal' | 'neon';
}

export interface CameraPosition {
  position: [number, number, number];
  target: [number, number, number];
}

export interface VisualizationSettings {
  showLatencyHeatmap: boolean;
  showNetworkTopology: boolean;
  showDataFlow: boolean;
  animationSpeed: number;
  particleCount: number;
}

export type TimeRange = '1h' | '24h' | '7d' | '30d';

export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label: string;
}