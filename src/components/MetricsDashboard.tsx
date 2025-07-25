"use client";

import React from "react";
import {
  Zap,
  Eye,
  Wifi,
  Clock,
  EyeOff,
  Server,
  Activity,
  TrendingUp,
} from "lucide-react";
import { MetricsData } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MetricsDashboardProps {
  metrics?: MetricsData;
  isLoading?: boolean;
  className?: string;
  initialVisible?: boolean;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

const formatUptime = (uptime: number): string => {
  return `${uptime.toFixed(2)}%`;
};

const formatLatency = (latency: number): string => {
  return `${latency.toFixed(1)}ms`;
};

const formatLastUpdated = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return `${seconds}s ago`;
};

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  metrics,
  isLoading = false,
  className = "",
  initialVisible = true,
  isOpen,
  onOpen,
  onClose,
}) => {
  const [internalVisible, setInternalVisible] = React.useState(initialVisible);
  const visible = typeof isOpen === "boolean" ? isOpen : internalVisible;
  const setVisible = (open: boolean) => {
    if (typeof isOpen === "boolean") {
      if (open && onOpen) onOpen();
      if (!open && onClose) onClose();
    } else {
      setInternalVisible(open);
    }
  };

  // Handle edge case: metrics undefined/null
  const safeMetrics = metrics || {
    totalExchanges: 0,
    activeConnections: 0,
    averageLatency: 0,
    uptime: 0,
    lastUpdated: Date.now(),
  };

  // Responsive card width and position
  const cardClass =
    "fixed bottom-10 right-2 z-40 w-full max-w-xs sm:max-w-md md:max-w-lg lg:w-96 p-4 sm:p-6 shadow-lg bg-white dark:bg-gray-900";
  const mobileCardClass =
    "w-full max-w-md mx-auto p-4 sm:p-6 rounded-xl shadow-md bg-white dark:bg-gray-900 mb-4 overflow-y-auto";
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  if (!visible && !isMobile) {
    return (
      <div className="fixed bottom-10 right-2 z-50">
        <Button
          variant="outline"
          size="sm"
          aria-label="Show metrics dashboard"
          onClick={() => setVisible(true)}
          className="shadow-lg"
        >
          <Eye className="w-4 h-4 mr-1" />
          Show Metrics
        </Button>
      </div>
    );
  }

  // Responsive grid columns
  const gridCols = isMobile
    ? "grid-cols-1 gap-4"
    : "grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-4 xl:gap-6";

  return (
    <Card
      className={`${isMobile ? mobileCardClass : cardClass} ${className}`}
      tabIndex={0}
      aria-label="System Metrics Dashboard"
      role="region"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
        <div className="flex items-center">
          <Activity className="w-5 h-5 mr-2 shrink-0 text-blue-600" />
          <h3 className="text-lg font-semibold">System Metrics</h3>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="w-4 h-4" />
          <span className="ml-1">
            Updated {formatLastUpdated(safeMetrics.lastUpdated)}
          </span>
        </div>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Hide metrics dashboard"
            onClick={() => setVisible(false)}
            className="ml-2"
          >
            <EyeOff className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className={`grid ${gridCols}`}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 h-16 w-16 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid ${gridCols}`}>
          {[
            {
              title: "Total Exchanges",
              value: safeMetrics.totalExchanges.toString(),
              icon: Server,
              color: "text-blue-600",
              bgColor: "bg-blue-50 dark:bg-blue-900/20",
            },
            {
              title: "Active Connections",
              value: safeMetrics.activeConnections.toString(),
              icon: Wifi,
              color: "text-green-600",
              bgColor: "bg-green-50 dark:bg-green-900/20",
            },
            {
              title: "Avg Latency",
              value: formatLatency(safeMetrics.averageLatency),
              icon: Zap,
              color: "text-yellow-600",
              bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
            },
            {
              title: "System Uptime",
              value: formatUptime(safeMetrics.uptime),
              icon: TrendingUp,
              color: "text-purple-600",
              bgColor: "bg-purple-50 dark:bg-purple-900/20",
            },
          ].map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className={`p-4 w-full min-w-[80px] rounded-lg ${metric.bgColor} border border-gray-200 dark:border-gray-700 flex flex-col items-start sm:items-center`}
              >
                <div className="flex items-center mb-2">
                  <Icon className={`w-5 h-5 mr-2 ${metric.color}`} />
                  <p
                    className={`font-bold ${
                      isMobile ? "text-base" : "text-xs"
                    } ${metric.color}`}
                  >
                    {metric.value}
                  </p>
                </div>
                <p
                  className={`${
                    isMobile ? "text-sm" : "text-xs"
                  } text-gray-600 dark:text-gray-400 font-medium`}
                >
                  {metric.title}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Status Indicators */}
      <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm gap-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse" />
            <span className="text-gray-600 dark:text-gray-400">
              Real-time Updates
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
            <span className="text-gray-600 dark:text-gray-400">
              All Systems Operational
            </span>
          </div>
        </div>
        <div className="flex items-center text-gray-600 dark:text-gray-400 mt-2 sm:mt-0">
          <div className="w-3 h-3 bg-gray-500 rounded-full mr-2" />
          {safeMetrics.activeConnections > 30
            ? "High Activity"
            : "Normal Activity"}
        </div>
      </div>
    </Card>
  );
};

export default MetricsDashboard;
