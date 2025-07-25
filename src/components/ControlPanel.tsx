"use client";

import React, { useState } from "react";
import { Settings, Search, Filter, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { FilterOptions, VisualizationSettings, ThemeSettings } from "@/types";
import {
  EXCHANGE_LOCATIONS,
  PROVIDER_COLORS,
} from "@/constants/exchangeLocations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ControlPanelProps {
  filters: FilterOptions;
  visualizationSettings: VisualizationSettings;
  theme: ThemeSettings;
  onFiltersChange: (filters: FilterOptions) => void;
  onVisualizationChange: (settings: VisualizationSettings) => void;
  onThemeChange: (theme: ThemeSettings) => void;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
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
  isOpen,
  onOpen,
  onClose,
}) => {
  const [internalOpen, setInternalOpen] = useState(true);
  const expanded = typeof isOpen === "boolean" ? isOpen : internalOpen;
  const setExpanded = (open: boolean) => {
    if (typeof isOpen === "boolean") {
      if (open && onOpen) onOpen();
      if (!open && onClose) onClose();
    } else {
      setInternalOpen(open);
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<FiltersOptions>("filters");

  // Detect mobile (tailwind: max-width 768px)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

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

  if (!expanded && !isMobile) {
    return (
      <div className="fixed top-22 right-3 p-2 z-50">
        <Button variant="outline" size="sm" onClick={() => setExpanded(true)}>
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Responsive card classes
  const cardClass =
    "fixed top-20 right-2 w-full max-w-md md:w-96 z-50 p-4 max-h-[60vh] md:max-h-[84vh] overflow-y-auto shadow-xl";
  const mobileCardClass =
    "w-full h-full fixed inset-0 z-40 bg-white dark:bg-gray-900 p-0 flex flex-col overflow-y-auto";

  return (
    <Card className={`${isMobile ? mobileCardClass : cardClass}`}>
      {/* Sticky header for mobile */}
      <div
        className={`${
          isMobile
            ? "sticky top-0 z-10 bg-white dark:bg-gray-900 px-4 pt-4 pb-2 border-b border-gray-200 dark:border-gray-800"
            : "flex items-center justify-between"
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <h3
            className={`${
              isMobile ? "text-xl font-bold" : "text-lg font-semibold"
            }`}
          >
            Control Panel
          </h3>
          <Button
            variant="ghost"
            size={isMobile ? "lg" : "sm"}
            onClick={() => setExpanded(false)}
            className={isMobile ? "ml-2 text-gray-500" : ""}
          >
            <EyeOff className={isMobile ? "w-6 h-6" : "w-4 h-4"} />
          </Button>
        </div>
      </div>

      {/* Sticky/scrollable tab bar for mobile */}
      <div
        className={`${
          isMobile
            ? "sticky top-14 z-10 bg-white dark:bg-gray-900 px-2 pt-2 pb-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto flex gap-2"
            : "flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 -mt-3"
        }`}
      >
        {[
          { key: "filters", label: "Filters", icon: Filter },
          { key: "visualization", label: "Visual", icon: Eye },
          { key: "theme", label: "Theme", icon: Sun },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "ghost"}
            size={isMobile ? "lg" : "sm"}
            className={`flex-1 whitespace-nowrap ${
              isMobile ? "px-4 py-2 text-base" : ""
            }`}
            onClick={() => setActiveTab(tab.key as FiltersOptions)}
          >
            <tab.icon className={isMobile ? "w-5 h-5 mr-2" : "w-3 h-3 mr-1"} />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Main content area, scrollable on mobile */}
      <div
        className={`${
          isMobile ? "flex-1 px-4 py-4 space-y-8 overflow-y-auto" : ""
        }`}
      >
        {/* Search Bar */}
        {activeTab === "filters" && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search exchanges..."
              className={`w-full pl-12 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 ${
                isMobile ? "text-base" : ""
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {/* Filters Tab */}
        {activeTab === "filters" && (
          <div className="space-y-6">
            {/* Exchange Selection */}
            <div>
              <label className="block text-base font-semibold mb-3">
                Exchanges
              </label>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {uniqueExchanges
                  .filter((exchange) =>
                    exchange.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((exchange, idx) => (
                    <div
                      key={`exchange-${exchange}-${idx}`}
                      className="flex items-center gap-3"
                    >
                      <input
                        type="checkbox"
                        id={`exchange-${exchange}-${idx}`}
                        checked={filters.exchanges.includes(exchange)}
                        onChange={() => toggleExchange(exchange)}
                        className={`accent-blue-600 w-5 h-5 ${
                          isMobile ? "rounded-lg" : ""
                        }`}
                      />
                      <label
                        htmlFor={`exchange-${exchange}-${idx}`}
                        className="text-base capitalize"
                      >
                        {exchange}
                      </label>
                    </div>
                  ))}
              </div>
            </div>

            {/* Cloud Provider Selection */}
            <div>
              <label className="block text-base font-semibold mb-3">
                Cloud Providers
              </label>
              <div className="space-y-3">
                {(["AWS", "GCP", "Azure"] as const).map((provider) => (
                  <div key={provider} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`provider-${provider}`}
                      checked={filters.cloudProviders.includes(provider)}
                      onChange={() => toggleCloudProvider(provider)}
                      className={`accent-blue-600 w-5 h-5 ${
                        isMobile ? "rounded-lg" : ""
                      }`}
                    />
                    <div
                      className="w-5 h-5 rounded mr-2"
                      style={{ backgroundColor: PROVIDER_COLORS[provider] }}
                    />
                    <label
                      htmlFor={`provider-${provider}`}
                      className="text-base"
                    >
                      {provider}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Latency Range */}
            <div>
              <label className="block text-base font-semibold mb-3">
                Latency Range (ms): {filters.latencyRange.min} -{" "}
                {filters.latencyRange.max}
              </label>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Min:</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={filters.latencyRange.min}
                    onChange={(e) =>
                      handleLatencyRangeChange("min", parseInt(e.target.value))
                    }
                    className="w-full accent-blue-600"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Max:</label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={filters.latencyRange.max}
                    onChange={(e) =>
                      handleLatencyRangeChange("max", parseInt(e.target.value))
                    }
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Display Options */}
            <div>
              <label className="block text-base font-semibold mb-3">
                Display Options
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch
                    id="real-time-connections"
                    checked={filters.showRealTime}
                    onCheckedChange={(checked) =>
                      handleFilterChange("showRealTime", checked)
                    }
                  />
                  <Label htmlFor="real-time-connections" className="text-base">
                    Real-time Connections
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="historical-data"
                    checked={filters.showHistorical}
                    onCheckedChange={(checked) =>
                      handleFilterChange("showHistorical", checked)
                    }
                  />
                  <Label htmlFor="historical-data" className="text-base">
                    Historical Data
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="cloud-regions"
                    checked={filters.showRegions}
                    onCheckedChange={(checked) =>
                      handleFilterChange("showRegions", checked)
                    }
                  />
                  <Label htmlFor="cloud-regions" className="text-base">
                    Cloud Regions
                  </Label>
                </div>
              </div>
            </div>

            {/* Reset Filters */}
            <Button
              variant="outline"
              onClick={resetFilters}
              className="w-full py-3 text-base"
            >
              Reset Filters
            </Button>
          </div>
        )}

        {/* Visualization Tab */}
        {activeTab === "visualization" && (
          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold mb-3">
                Animation Speed:{" "}
                {visualizationSettings.animationSpeed.toFixed(1)}x
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
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <label className="block text-base font-semibold mb-3">
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
                className="w-full accent-blue-600"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch
                  id="latency-heatmap"
                  checked={visualizationSettings.showLatencyHeatmap}
                  onCheckedChange={(checked) =>
                    handleVisualizationChange("showLatencyHeatmap", checked)
                  }
                />
                <Label htmlFor="latency-heatmap" className="text-base">
                  Latency Heatmap
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="network-topology"
                  checked={visualizationSettings.showNetworkTopology}
                  onCheckedChange={(checked) =>
                    handleVisualizationChange("showNetworkTopology", checked)
                  }
                />
                <Label htmlFor="network-topology" className="text-base">
                  Network Topology
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="data-flow-animation"
                  checked={visualizationSettings.showDataFlow}
                  onCheckedChange={(checked) =>
                    handleVisualizationChange("showDataFlow", checked)
                  }
                />
                <Label htmlFor="data-flow-animation" className="text-base">
                  Data Flow Animation
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Theme Tab */}
        {activeTab === "theme" && (
          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold mb-3">
                Theme Mode
              </label>
              <div className="flex space-x-3">
                <Button
                  variant={theme.mode === "dark" ? "default" : "outline"}
                  onClick={() => onThemeChange({ ...theme, mode: "dark" })}
                  className="flex-1 py-3 text-base"
                >
                  <Moon className="w-5 h-5 mr-2" />
                  Dark
                </Button>
                <Button
                  variant={theme.mode === "light" ? "default" : "outline"}
                  onClick={() => onThemeChange({ ...theme, mode: "light" })}
                  className="flex-1 py-3 text-base"
                >
                  <Sun className="w-5 h-5 mr-2" />
                  Light
                </Button>
              </div>
            </div>

            <div>
              <Label className="block text-base font-semibold mb-3">
                Map Style
              </Label>
              <Select
                value={theme.mapStyle}
                onValueChange={(value) =>
                  onThemeChange({ ...theme, mapStyle: value as never })
                }
              >
                <SelectTrigger className="w-full h-12 text-base">
                  <SelectValue placeholder="Select styling options" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Styles</SelectLabel>
                    {MAP_STYLES_OPTIONS?.map((style) => (
                      <SelectItem
                        key={style.value}
                        value={style.value}
                        className="text-base"
                      >
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ControlPanel;
