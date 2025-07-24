"use client";

import React, { useState } from "react";
import { Settings, Search, Filter, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { FilterOptions, VisualizationSettings, ThemeSettings } from "@/types";
import {
  EXCHANGE_LOCATIONS,
  PROVIDER_COLORS,
} from "@/constants/exchangeLocations";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

interface ControlPanelProps {
  filters: FilterOptions;
  visualizationSettings: VisualizationSettings;
  theme: ThemeSettings;
  onFiltersChange: (filters: FilterOptions) => void;
  onVisualizationChange: (settings: VisualizationSettings) => void;
  onThemeChange: (theme: ThemeSettings) => void;
}

type FiltersOptions = "filters" | "visualization" | "theme";

const MAP_STYLES_OPTIONS = [
  { value: "realistic", label: "Realistic" },
  { value: "minimal", label: "Minimal" },
  { value: "neon", label: "Neon" },
];

const ControlPanel: React.FC<ControlPanelProps> = ({
  filters,
  visualizationSettings,
  theme,
  onFiltersChange,
  onVisualizationChange,
  onThemeChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<FiltersOptions>("filters");

  const uniqueExchanges = Array.from(
    new Set(EXCHANGE_LOCATIONS.map((loc) => loc.name))
  );

  const handleFilterChange = (
    key: keyof FilterOptions,
    value: string[] | boolean
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleVisualizationChange = (
    key: keyof VisualizationSettings,
    value: string[] | boolean | number
  ) => {
    onVisualizationChange({ ...visualizationSettings, [key]: value });
  };

  const handleLatencyRangeChange = (type: "min" | "max", value: number) => {
    onFiltersChange({
      ...filters,
      latencyRange: {
        ...filters.latencyRange,
        [type]: value,
      },
    });
  };

  const toggleExchange = (exchange: string) => {
    const newExchanges = filters.exchanges.includes(exchange)
      ? filters.exchanges.filter((e) => e !== exchange)
      : [...filters.exchanges, exchange];
    handleFilterChange("exchanges", newExchanges);
  };

  const toggleCloudProvider = (provider: "AWS" | "GCP" | "Azure") => {
    const newProviders = filters.cloudProviders.includes(provider)
      ? filters.cloudProviders.filter((p) => p !== provider)
      : [...filters.cloudProviders, provider];
    handleFilterChange("cloudProviders", newProviders);
  };

  const resetFilters = () => {
    onFiltersChange({
      exchanges: [],
      cloudProviders: [],
      latencyRange: { min: 0, max: 500 },
      showRealTime: true,
      showHistorical: false,
      showRegions: true,
    });
  };

  if (!isExpanded) {
    return (
      <div className="fixed top-22 right-3 p-2 z-50">
        <Button variant="outline" size="sm" onClick={() => setIsExpanded(true)}>
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed top-22 right-2 w-96 max-h-[84vh] overflow-y-auto z-50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Control Panel</h3>
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
          <EyeOff className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 -mt-3">
        {[
          { key: "filters", label: "Filters", icon: Filter },
          { key: "visualization", label: "Visual", icon: Eye },
          { key: "theme", label: "Theme", icon: Sun },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab(tab.key as FiltersOptions)}
          >
            <tab.icon className="w-3 h-3 mr-1" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Search Bar */}
      {activeTab === "filters" && (
        <div className="relative -mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search exchanges..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Filters Tab */}
      {activeTab === "filters" && (
        <div className="space-y-4 -mt-2">
          {/* Exchange Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Exchanges</label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {uniqueExchanges
                .filter((exchange) =>
                  exchange.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((exchange, idx) => (
                  <div
                    key={`exchange-${exchange}-${idx}`}
                    className="flex items-center"
                  >
                    <input
                      type="checkbox"
                      id={`exchange-${exchange}-${idx}`}
                      checked={filters.exchanges.includes(exchange)}
                      onChange={() => toggleExchange(exchange)}
                      className="mr-2"
                    />
                    <label
                      htmlFor={`exchange-${exchange}-${idx}`}
                      className="text-sm capitalize"
                    >
                      {exchange}
                    </label>
                  </div>
                ))}
            </div>
          </div>

          {/* Cloud Provider Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Cloud Providers
            </label>
            <div className="space-y-2">
              {(["AWS", "GCP", "Azure"] as const).map((provider) => (
                <div key={provider} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`provider-${provider}`}
                    checked={filters.cloudProviders.includes(provider)}
                    onChange={() => toggleCloudProvider(provider)}
                    className="mr-2"
                  />
                  <div
                    className="w-3 h-3 rounded mr-2"
                    style={{ backgroundColor: PROVIDER_COLORS[provider] }}
                  />
                  <label htmlFor={`provider-${provider}`} className="text-sm">
                    {provider}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Latency Range */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Latency Range (ms): {filters.latencyRange.min} -{" "}
              {filters.latencyRange.max}
            </label>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-600">Min:</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="5"
                  value={filters.latencyRange.min}
                  onChange={(e) =>
                    handleLatencyRangeChange("min", parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Max:</label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={filters.latencyRange.max}
                  onChange={(e) =>
                    handleLatencyRangeChange("max", parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Display Options */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Display Options
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="real-time-connections"
                  checked={filters.showRealTime}
                  onCheckedChange={(checked) =>
                    handleFilterChange("showRealTime", checked)
                  }
                />
                <Label htmlFor="real-time-connections">
                  Real-time Connections
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="historical-data"
                  checked={filters.showHistorical}
                  onCheckedChange={(checked) =>
                    handleFilterChange("showHistorical", checked)
                  }
                />
                <Label htmlFor="real-time-connections">Historical Data</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="cloud-regions"
                  checked={filters.showRegions}
                  onCheckedChange={(checked) =>
                    handleFilterChange("showRegions", checked)
                  }
                />
                <Label htmlFor="cloud-regions">Cloud Regions</Label>
              </div>
            </div>
          </div>

          {/* Reset Filters */}
          <Button variant="outline" onClick={resetFilters} className="w-full">
            Reset Filters
          </Button>
        </div>
      )}

      {/* Visualization Tab */}
      {activeTab === "visualization" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Animation Speed: {visualizationSettings.animationSpeed.toFixed(1)}
              x
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={visualizationSettings.animationSpeed}
              onChange={(e) =>
                handleVisualizationChange(
                  "animationSpeed",
                  parseFloat(e.target.value)
                )
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Particle Count: {visualizationSettings.particleCount}
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={visualizationSettings.particleCount}
              onChange={(e) =>
                handleVisualizationChange(
                  "particleCount",
                  parseInt(e.target.value)
                )
              }
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="latency-heatmap"
                checked={visualizationSettings.showLatencyHeatmap}
                onCheckedChange={(checked) =>
                  handleVisualizationChange("showLatencyHeatmap", checked)
                }
              />
              <Label htmlFor="latency-heatmap">Latency Heatmap</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="network-topology"
                checked={visualizationSettings.showNetworkTopology}
                onCheckedChange={(checked) =>
                  handleVisualizationChange("showNetworkTopology", checked)
                }
              />
              <Label htmlFor="network-topology">Network Topology</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="data-flow-animation"
                checked={visualizationSettings.showDataFlow}
                onCheckedChange={(checked) =>
                  handleVisualizationChange("showDataFlow", checked)
                }
              />
              <Label htmlFor="data-flow-animation">Data Flow Animation</Label>
            </div>
          </div>
        </div>
      )}

      {/* Theme Tab */}
      {activeTab === "theme" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Theme Mode</label>
            <div className="flex space-x-2">
              <Button
                variant={theme.mode === "dark" ? "default" : "outline"}
                onClick={() => onThemeChange({ ...theme, mode: "dark" })}
                className="flex-1"
              >
                <Moon className="w-4 h-4 mr-1" />
                Dark
              </Button>
              <Button
                variant={theme.mode === "light" ? "default" : "outline"}
                onClick={() => onThemeChange({ ...theme, mode: "light" })}
                className="flex-1"
              >
                <Sun className="w-4 h-4 mr-1" />
                Light
              </Button>
            </div>
          </div>

          <div>
            <Label className="block text-sm font-medium mb-2">Map Style</Label>
            <Select
              value={theme.mapStyle}
              onValueChange={(value) =>
                onThemeChange({ ...theme, mapStyle: value as never })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select styling options" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Styles</SelectLabel>
                  {MAP_STYLES_OPTIONS?.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ControlPanel;
