"use client";

import React, { useMemo } from "react";
import {
  // LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { HistoricalLatencyData, TimeRange, ChartDataPoint } from "@/types";
import { Card } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface LatencyChartProps {
  data: HistoricalLatencyData[];
  selectedPair?: { source: string; target: string };
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  theme: "dark" | "light";
  className?: string;
}

const timeRangeOptions = [
  { value: "1h", label: "1 Hour" },
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
];

const formatTimestamp = (timestamp: number, range: TimeRange): string => {
  const date = new Date(timestamp);

  switch (range) {
    case "1h":
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    case "24h":
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    case "7d":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
      });
    case "30d":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    default:
      return date.toLocaleString();
  }
};

const calculateStats = (data: ChartDataPoint[]) => {
  if (data.length === 0)
    return { min: 0, max: 0, avg: 0, trend: "stable" as const };

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

  // Calculate trend based on first and last values
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const trendThreshold = avg * 0.05; // 5% threshold

  let trend: "up" | "down" | "stable" = "stable";
  if (lastValue - firstValue > trendThreshold) trend = "up";
  else if (firstValue - lastValue > trendThreshold) trend = "down";

  return { min, max, avg, trend };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
        <p className="text-sm text-gray-600 dark:text-gray-300">{data.label}</p>
        <p className="text-lg font-semibold text-blue-600">
          {payload[0].value.toFixed(1)}ms
        </p>
      </div>
    );
  }
  return null;
};

const LatencyChart: React.FC<LatencyChartProps> = ({
  data,
  selectedPair,
  timeRange,
  onTimeRangeChange,
  theme,
  className,
}) => {
  // Process and filter data
  const chartData = useMemo(() => {
    let filteredData = data;

    // Filter by selected pair if provided
    if (selectedPair) {
      filteredData = data.filter(
        (d) =>
          d.source === selectedPair.source && d.target === selectedPair.target
      );
    }

    // Filter by time range
    const now = Date.now();
    const timeRangeMs = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    const cutoffTime = now - timeRangeMs[timeRange];
    filteredData = filteredData.filter((d) => d.timestamp >= cutoffTime);

    // Sort by timestamp
    filteredData.sort((a, b) => a.timestamp - b.timestamp);

    // Convert to chart format
    return filteredData.map((d) => ({
      timestamp: d.timestamp,
      value: d.latency,
      label: formatTimestamp(d.timestamp, timeRange),
    }));
  }, [data, selectedPair, timeRange]);

  const stats = useMemo(() => calculateStats(chartData), [chartData]);

  const getTrendIcon = () => {
    switch (stats.trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (stats.trend) {
      case "up":
        return "text-red-500";
      case "down":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Latency Trends</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={timeRange}
            onValueChange={(value) => onTimeRangeChange(value as TimeRange)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selected Pair Info */}
      {selectedPair && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Showing latency between:
          </p>
          <p className="font-medium">
            {selectedPair.source} → {selectedPair.target}
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">Min</p>
          <p className="text-lg font-semibold text-green-600">
            {stats.min.toFixed(1)}ms
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">Max</p>
          <p className="text-lg font-semibold text-red-600">
            {stats.max.toFixed(1)}ms
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">Average</p>
          <p className="text-lg font-semibold text-blue-600">
            {stats.avg.toFixed(1)}ms
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-center space-x-1">
            {getTrendIcon()}
            <p className="text-xs text-gray-600 dark:text-gray-400">Trend</p>
          </div>
          <p className={`text-sm font-semibold capitalize ${getTrendColor()}`}>
            {stats.trend}
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient
                  id="latencyGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme === "dark" ? "#374151" : "#e5e7eb"}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
                label={{
                  value: "Latency (ms)",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Average line */}
              <ReferenceLine
                y={stats.avg}
                stroke="#6b7280"
                strokeDasharray="5 5"
                label="Avg"
              />

              {/* Area */}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#latencyGradient)"
              />

              {/* Line */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: "#3b82f6" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-80 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No data available for the selected time range</p>
            <p className="text-sm mt-2">
              Try selecting a different time range or exchange pair
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default LatencyChart;
