// src/components/MetricsDashboard.tsx
"use client";

import React from "react";
import { Activity, Server, Zap, Clock, TrendingUp, Wifi } from "lucide-react";
import { MetricsData } from "@/types";
import { Card } from "./ui/card";

interface MetricsDashboardProps {
  metrics: MetricsData;
  isLoading?: boolean;
  className?: string;
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
  className,
}) => {
  const metricCards = [
    {
      title: "Total Exchanges",
      value: metrics.totalExchanges.toString(),
      icon: Server,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Active Connections",
      value: metrics.activeConnections.toString(),
      icon: Wifi,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Avg Latency",
      value: formatLatency(metrics.averageLatency),
      icon: Zap,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      title: "System Uptime",
      value: formatUptime(metrics.uptime),
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center mb-4">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-semibold">System Metrics</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 h-16 w-16 rounded-lg"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Activity className="w-5 h-5 mr-2 shrink-0 text-blue-600" />
          <h3 className="text-md font-semibold">System Metrics</h3>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Updated {formatLastUpdated(metrics.lastUpdated)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className={`p-2 w-20 rounded-lg ${metric.bgColor} border border-gray-200 dark:border-gray-700`}
            >
              <div className="flex items-center mb-2">
                <Icon className={`w-3 h-3 mr-1 ${metric.color}`} />
                <div className="text-right">
                  <p className={`text-xs font-bold ${metric.color}`}>
                    {metric.value}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {metric.title}
              </p>
            </div>
          );
        })}
      </div>

      {/* Status Indicators */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3 justify-between">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            <span className="text-gray-600 dark:text-gray-400">
              Real-time Updates
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
            <span className="text-gray-600 dark:text-gray-400">
              All Systems Operational
            </span>
          </div>
        </div>
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <div className="w-2 h-2 bg-gray-500 rounded-full mr-2" />
          {metrics.activeConnections > 30 ? "High Activity" : "Normal Activity"}
        </div>
      </div>
    </Card>
  );
};

export default MetricsDashboard;
