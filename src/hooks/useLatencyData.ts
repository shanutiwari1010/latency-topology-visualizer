
// src/hooks/useLatencyData.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LatencyData, HistoricalLatencyData, MetricsData } from '@/types';
import { generateMockLatencyData, generateHistoricalData, generateMockMetrics, mockApiCall } from '@/lib/mockApi';

interface UseLatencyDataReturn {
  latencyData: LatencyData[];
  historicalData: HistoricalLatencyData[];
  metrics: MetricsData;
  isLoading: boolean;
  error: string | null;
  refreshData: () => void;
  lastUpdated: number;
}

export const useLatencyData = (refreshInterval: number = 10000): UseLatencyDataReturn => {
  const [latencyData, setLatencyData] = useState<LatencyData[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalLatencyData[]>([]);
  const [metrics, setMetrics] = useState<MetricsData>({
    totalExchanges: 0,
    activeConnections: 0,
    averageLatency: 0,
    uptime: 0,
    lastUpdated: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);
  
 const intervalRef = useRef<NodeJS.Timeout | null>(null);


  const fetchLatencyData = useCallback(async () => {
    try {
      setError(null);
      
      // Simulate API calls
      const [latency, historical, metricsData] = await Promise.all([
        mockApiCall(generateMockLatencyData(), 300),
        mockApiCall(generateHistoricalData(30), 500),
        mockApiCall(generateMockMetrics(), 200)
      ]);
      
      setLatencyData(latency);
      setHistoricalData(historical);
      setMetrics(metricsData);
      setLastUpdated(Date.now());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching latency data:', err);
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
  }, [fetchLatencyData]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        // Only refresh real-time data, not historical
        const refreshRealTimeData = async () => {
          try {
            const [latency, metricsData] = await Promise.all([
              mockApiCall(generateMockLatencyData(), 200),
              mockApiCall(generateMockMetrics(), 100)
            ]);
            
            setLatencyData(latency);
            setMetrics(metricsData);
            setLastUpdated(Date.now());
          } catch (err) {
            console.error('Error refreshing real-time data:', err);
          }
        };
        
        refreshRealTimeData();
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval]);

  return {
    latencyData,
    historicalData,
    metrics,
    isLoading,
    error,
    refreshData,
    lastUpdated
  };
};