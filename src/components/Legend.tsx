// src/components/Legend.tsx
"use client";

import React from "react";
import { Info, Zap, Globe, Cloud } from "lucide-react";
import {
  PROVIDER_COLORS,
  LATENCY_QUALITY_COLORS,
} from "@/constants/exchangeLocations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface LegendProps {
  className?: string;
}

const Legend: React.FC<LegendProps> = ({ className }) => {
  const [visible, setVisible] = React.useState(true);

  // Responsive card width and position
  const cardClass =
    "fixed bottom-10 left-2 z-30 w-full max-w-xs sm:max-w-sm md:max-w-md lg:w-60 p-4 shadow-lg bg-white dark:bg-gray-900";

  // Mobile-friendly redesign for Info tab
  const mobileCardClass =
    "w-full max-w-md mx-auto p-4 sm:p-6 rounded-xl shadow-md bg-white dark:bg-gray-900 mb-4 overflow-y-auto";

  // Detect mobile (tailwind: max-width 768px)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  if (!visible && !isMobile) {
    return (
      <div className="fixed bottom-10 left-2 z-40">
        <Button
          variant="outline"
          size="sm"
          aria-label="Show legend"
          onClick={() => setVisible(true)}
          className="shadow-lg"
        >
          <Eye className="w-4 h-4 mr-1" />
          Show Legend
        </Button>
      </div>
    );
  }

  return (
    <Card
      className={`${isMobile ? mobileCardClass : cardClass} ${className || ""}`}
      tabIndex={0}
      aria-label="Legend"
      role="region"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Info className="w-5 h-5 mr-2 text-blue-600" />
          <h4 className="font-semibold text-base sm:text-lg">Legend</h4>
        </div>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Hide legend"
            onClick={() => setVisible(false)}
            className="ml-2"
          >
            <EyeOff className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-6 text-base sm:text-sm -mt-2">
        {/* Cloud Providers */}
        <div>
          <div className="flex items-center mb-2">
            <Cloud className="w-4 h-4 mr-2" />
            <span className="font-medium text-sm">Cloud Providers</span>
          </div>
          <div className="space-y-1 ml-4">
            {Object.entries(PROVIDER_COLORS).map(([provider, color]) => (
              <div key={provider} className="flex items-center">
                <div
                  className="w-3 h-3 rounded mr-2"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs">{provider}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Latency Quality */}
        <div>
          <div className="flex items-center mb-2">
            <Zap className="w-4 h-4 mr-2" />
            <span className="font-medium text-sm">Latency Quality</span>
          </div>
          <div className="space-y-2 ml-4">
            {Object.entries(LATENCY_QUALITY_COLORS).map(([quality, color]) => (
              <div key={quality} className="flex items-center">
                <div
                  className="w-4 h-2 rounded mr-2"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm capitalize">{quality}</span>
                <span className="text-xs text-gray-500 ml-1">
                  {quality === "high" && "(≤20ms)"}
                  {quality === "medium" && "(21-100ms)"}
                  {quality === "low" && "(>100ms)"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Map Elements */}
        <div>
          <div className="flex items-center mb-2">
            <Globe className="w-4 h-4 mr-2" />
            <span className="font-medium text-sm">Map Elements</span>
          </div>
          <div className="space-y-2 ml-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2" />
              <span className="text-sm">Exchange Servers</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-2 bg-gradient-to-r from-green-400 to-red-400 rounded mr-2" />
              <span className="text-sm">Latency Connections</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-gray-400 rounded-full mr-2" />
              <span className="text-sm">Cloud Regions</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Legend;
