"use client";

import React, { useState, useCallback, useEffect } from "react";
import { MapPin, BarChart3, RefreshCw, X } from "lucide-react";
import Map3D from "../components/Map3D";
import ControlPanel from "@/components/ControlPanel";
import LatencyChart from "@/components/LatencyChart";
import Legend from "@/components/Legend";
import LoadingSpinner from "@/components/LoadingSpinner";
import MetricsDashboard from "@/components/MetricsDashboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLatencyData } from "@/hooks/useLatencyData";
import { useExchangeData } from "@/hooks/useExchangeData";
import {
  FilterOptions,
  VisualizationSettings,
  ThemeSettings,
  TimeRange,
  ExchangeLocation,
} from "@/types";
import { createLatencyConnections } from "@/lib/exchangeData";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { MobileNavigation } from "@/components/MobileNavigation";
import { synthesizeRegionExchanges } from "@/hooks/useLatencyData";
import useIsMobile from "@/hooks/useIsMobile";
import { Tooltip } from "@/components/ui/tooltip";

export default function CryptoLatencyVisualizer() {
  const [theme, setTheme] = useState<ThemeSettings>({
    mode: "dark",
    mapStyle: "realistic",
  });

  const [filters, setFilters] = useState<FilterOptions>({
    exchanges: [],
    cloudProviders: [],
    latencyRange: { min: 0, max: 500 },
    showRealTime: true,
    showHistorical: false,
    showRegions: true,
  });

  const [visualizationSettings, setVisualizationSettings] =
    useState<VisualizationSettings>({
      showLatencyHeatmap: false,
      showNetworkTopology: true,
      showDataFlow: true,
      animationSpeed: 1.0,
      particleCount: 50,
    });

  // Chart state
  const [selectedPair, setSelectedPair] = useState<
    { source: string; target: string } | undefined
  >();
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [showChart, setShowChart] = useState(false);

  // State for region exchanges
  const [regionExchanges, setRegionExchanges] = useState<ExchangeLocation[]>(
    []
  );
  const [regionExError, setRegionExError] = useState<string | null>(null);
  const [regionExLoading, setRegionExLoading] = useState(false);

  // Data hooks
  const {
    latencyData,
    historicalData,
    metrics,
    isLoading,
    error,
    refreshData,
    lastUpdated,
  } = useLatencyData(5 * 60 * 1000); // Refresh every 5 minutes (passed as prop)

  const {
    exchanges,
    // connections,
    filteredExchanges,
    filteredConnections,
    selectedExchange,
    setSelectedExchange,
    hoveredExchange,
    setHoveredExchange,
  } = useExchangeData(filters);

  console.log(JSON.stringify(latencyData, null, 2));

  // Fetch region exchanges when latencyData changes
  useEffect(() => {
    let cancelled = false;
    async function fetchRegions() {
      setRegionExLoading(true);
      setRegionExError(null);
      try {
        const regions = await synthesizeRegionExchanges(latencyData);
        if (!cancelled) setRegionExchanges(regions);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        if (!cancelled) setRegionExError(errorMessage);
      } finally {
        if (!cancelled) setRegionExLoading(false);
      }
    }
    if (latencyData.length > 0) fetchRegions();
    else setRegionExchanges([]);
    return () => {
      cancelled = true;
    };
  }, [latencyData]);

  // Merge real and region exchanges for the map and connections
  const allExchanges = React.useMemo(
    () => [...exchanges, ...regionExchanges],
    [exchanges, regionExchanges]
  );
  const allFilteredExchanges = React.useMemo(
    () => [...filteredExchanges, ...regionExchanges],
    [filteredExchanges, regionExchanges]
  );

  // Calculate uptime as percent of online exchanges in allFilteredExchanges
  const onlineCount = allFilteredExchanges.filter(
    (e) => e.status === "online"
  ).length;
  const uptime =
    allFilteredExchanges.length > 0
      ? (onlineCount / allFilteredExchanges.length) * 100
      : 0;

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme.mode === "dark");
  }, [theme.mode]);

  // Handle exchange click
  const handleExchangeClick = useCallback(
    (exchange: ExchangeLocation) => {
      setSelectedExchange(exchange);

      // Find a connection involving this exchange for the chart
      const connection = filteredConnections.find(
        (conn) =>
          conn.source.id === exchange.id || conn.target.id === exchange.id
      );

      if (connection) {
        setSelectedPair({
          source: connection.source.id,
          target: connection.target.id,
        });
        setShowChart(true);
      }
    },
    [filteredConnections, setSelectedExchange]
  );

  // Handle exchange hover
  const handleExchangeHover = useCallback(
    (exchange: ExchangeLocation | null) => {
      setHoveredExchange(exchange);
    },
    [setHoveredExchange]
  );

  // Responsive navigation state for mobile/tablet
  const [activeView, setActiveView] = useState<
    "map" | "chart" | "settings" | "info"
  >("map");
  // Floating panel state for desktop
  const [openPopup, setOpenPopup] = useState<
    "control" | "metrics" | "chart" | null
  >("metrics");

  const isTabletOrMobile = useIsMobile(1024);

  // Hide floating panels on tablet/mobile
  useEffect(() => {
    if (isTabletOrMobile && openPopup !== null) {
      setOpenPopup(null);
    }
  }, [isTabletOrMobile]);

  // Error state
  if (error || regionExError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <MapPin className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Unable to Load Data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || regionExError}
          </p>
          <Button onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }
  if (isLoading || regionExLoading) {
    return (
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="p-8">
          <LoadingSpinner size="lg" message="Loading exchange data..." />
        </Card>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        theme.mode === "dark"
          ? "bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-blue-50"
      }`}
    >
      {/* Header */}
      <header className="relative z-40 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Crypto Exchange Latency Monitor
              </h1>
              <p className="max-sm:hidden text-sm text-gray-600 dark:text-gray-400">
                Real-time visualization of global trading infrastructure
              </p>
            </div>
          </div>

          {/* Desktop: chart/refresh buttons */}
          {!isTabletOrMobile && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenPopup(openPopup === "chart" ? null : "chart")}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {openPopup === "chart" ? "Hide" : "Show"} Chart
              </Button>
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          )}

          {/* Mobile: refresh icon with tooltip */}
          {isTabletOrMobile && (
            <Tooltip content="Refresh Data">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Refresh Data"
                onClick={refreshData}
                className="ml-2"
              >
                <RefreshCw className={`w-6 h-6 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </Tooltip>
          )}
        </div>
      </header>

      <MobileNavigation activeView={activeView} onViewChange={setActiveView} />

      {/* Main content */}
      <div className="relative">
        {/* Responsive: mobile/tablet = one panel, desktop = floating panels */}
        {isTabletOrMobile ? (
          <>
            {activeView === "map" && (
              <div className="h-screen w-full">
                <Map3D
                  exchanges={allFilteredExchanges}
                  connections={createLatencyConnections(
                    allExchanges,
                    latencyData
                  )}
                  filters={filters}
                  visualizationSettings={visualizationSettings}
                  theme={theme.mode}
                  mapStyle={theme.mapStyle}
                  onExchangeClick={handleExchangeClick}
                  onExchangeHover={handleExchangeHover}
                  isMobile={true}
                />
              </div>
            )}
            {activeView === "chart" && (
              <div className="mb-28 z-30 bg-white dark:bg-gray-900">
                <LatencyChart
                  data={historicalData}
                  selectedPair={selectedPair}
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                  theme={theme.mode}
                  className="h-full"
                />
              </div>
            )}
            {activeView === "settings" && (
              <ControlPanel
                filters={filters}
                visualizationSettings={visualizationSettings}
                theme={theme}
                onFiltersChange={setFilters}
                onVisualizationChange={setVisualizationSettings}
                onThemeChange={setTheme}
                isOpen={true}
                onClose={() => setActiveView("map")}
                // className removed for mobile overlay
              />
            )}
            {activeView === "info" && (
              <div className="my-10 mb-28 z-40 bg-white dark:bg-gray-900 overflow-y-auto flex flex-col items-center justify-center">
                {/* Info tab redesign will be implemented next */}
                <Legend className="w-full max-w-md mx-auto mb-4" />
                <MetricsDashboard
                  metrics={{
                    totalExchanges: allFilteredExchanges.length,
                    activeConnections: filteredConnections.length,
                    averageLatency:
                      filteredConnections.length > 0
                        ? filteredConnections.reduce(
                            (sum, c) => sum + c.latency,
                            0
                          ) / filteredConnections.length
                        : 0,
                    uptime,
                    lastUpdated: lastUpdated,
                  }}
                  isLoading={isLoading}
                  className="w-full max-w-md mx-auto"
                  isOpen={true}
                  onClose={() => setActiveView("map")}
                />
              </div>
            )}
          </>
        ) : (
          <div className="h-screen relative">
            <Map3D
              exchanges={allFilteredExchanges}
              connections={createLatencyConnections(allExchanges, latencyData)}
              filters={filters}
              visualizationSettings={visualizationSettings}
              theme={theme.mode}
              mapStyle={theme.mapStyle}
              onExchangeClick={handleExchangeClick}
              onExchangeHover={handleExchangeHover}
            />

            {/* Control Panel as popup */}
            <ControlPanel
              filters={filters}
              visualizationSettings={visualizationSettings}
              theme={theme}
              onFiltersChange={setFilters}
              onVisualizationChange={setVisualizationSettings}
              onThemeChange={setTheme}
              isOpen={openPopup === "control"}
              onOpen={() => setOpenPopup("control")}
              onClose={() => setOpenPopup(null)}
            />

            {/* Legend */}
            <Legend className="fixed bottom-10 left-2 z-30 w-60 max-w-sm" />

            {/* Metrics Dashboard as popup */}
            <MetricsDashboard
              metrics={{
                totalExchanges: allFilteredExchanges.length,
                activeConnections: filteredConnections.length,
                averageLatency:
                  filteredConnections.length > 0
                    ? filteredConnections.reduce(
                        (sum, c) => sum + c.latency,
                        0
                      ) / filteredConnections.length
                    : 0,
                uptime,
                lastUpdated: lastUpdated,
              }}
              isLoading={isLoading}
              className="fixed bottom-10 right-2 z-30 w-96"
              isOpen={openPopup === "metrics"}
              onOpen={() => setOpenPopup("metrics")}
              onClose={() => setOpenPopup(null)}
            />

            <PerformanceMonitor className="fixed top-22 left-2 z-30 w-60 max-w-sm" />

            {/* Selected Exchange Info */}
            {selectedExchange && (
              <Card className="fixed top-22 left-2 z-30 p-4 pt-3 w-60 max-w-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">
                    {selectedExchange.displayName}
                  </h4>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSelectedExchange(null)}
                    className="text-gray-400 hover:text-gray-600 rounded-full"
                  >
                    <X />
                  </Button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span className="font-medium">
                      {selectedExchange.cloudProvider}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Region:</span>
                    <span className="font-medium">
                      {selectedExchange.region}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Servers:</span>
                    <span className="font-medium">
                      {selectedExchange.serverCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`font-medium capitalize ${
                        selectedExchange.status === "online"
                          ? "text-green-600"
                          : selectedExchange.status === "maintenance"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedExchange.status}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Hovered Exchange Tooltip */}
            {hoveredExchange && (
              <Card className="fixed top-22 left-2 z-40 p-3 w-60 max-w-sm pointer-events-none">
                <p className="font-medium text-sm">
                  {hoveredExchange.displayName}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {hoveredExchange.cloudProvider} • {hoveredExchange.region}
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Latency Chart Panel as popup (desktop only) */}
        {!isTabletOrMobile && openPopup === "chart" && (
          <div className="fixed inset-x-2 bottom-9 z-30 h-96">
            <LatencyChart
              data={historicalData}
              selectedPair={selectedPair}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              theme={theme.mode}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-black/50 backdrop-blur-sm text-white text-xs p-2">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center space-x-4">
            <span>
              Exchanges: {filteredExchanges.length}/{exchanges.length}
            </span>
            <span>Connections: {filteredConnections.length}</span>
            <span>Avg Latency: {metrics.averageLatency.toFixed(1)}ms</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span suppressHydrationWarning>
              Live • Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
