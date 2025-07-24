/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card } from "./ui/card";

interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  renderTime: number;
  networkLatency: number;
  threejsObjects: number;
  drawCalls: number;
  timestamp: number;
}

interface PerformanceMonitorProps {
  onPerformanceIssue?: (
    metric: keyof PerformanceMetrics,
    value: number
  ) => void;
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  onPerformanceIssue,
  className,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: { used: 0, total: 0, percentage: 0 },
    renderTime: 0,
    networkLatency: 0,
    threejsObjects: 0,
    drawCalls: 0,
    timestamp: Date.now(),
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderTimeRef = useRef(0);

  // FPS measurement
  const measureFPS = useCallback(() => {
    frameCountRef.current++;
    const currentTime = performance.now();

    if (currentTime - lastTimeRef.current >= 1000) {
      const fps = Math.round(frameCountRef.current);

      setMetrics((prev) => {
        const newMetrics = { ...prev, fps, timestamp: Date.now() };

        // Check for performance issues
        if (fps < 30 && onPerformanceIssue) {
          onPerformanceIssue("fps", fps);
        }

        return newMetrics;
      });

      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
    }
  }, [onPerformanceIssue]);

  // Memory measurement
  const measureMemory = useCallback(() => {
    if ("memory" in performance) {
      const memInfo = (performance as any).memory;
      const used = memInfo.usedJSHeapSize;
      const total = memInfo.totalJSHeapSize;
      const percentage = (used / total) * 100;

      setMetrics((prev) => ({
        ...prev,
        memory: { used, total, percentage },
        timestamp: Date.now(),
      }));

      // Check for memory leaks
      if (percentage > 80 && onPerformanceIssue) {
        onPerformanceIssue("memory", percentage);
      }
    }
  }, [onPerformanceIssue]);

  // Network latency measurement
  const measureNetworkLatency = useCallback(async () => {
    const start = performance.now();

    try {
      await fetch("/api/latency?type=ping", { method: "HEAD" });
      const latency = performance.now() - start;

      setMetrics((prev) => ({
        ...prev,
        networkLatency: latency,
        timestamp: Date.now(),
      }));

      if (latency > 1000 && onPerformanceIssue) {
        onPerformanceIssue("networkLatency", latency);
      }
    } catch (error) {
      console.warn("Network latency measurement failed:", error);
    }
  }, [onPerformanceIssue]);

  // Render time measurement
  const measureRenderTime = useCallback(() => {
    const start = performance.now();

    requestAnimationFrame(() => {
      const renderTime = performance.now() - start;
      renderTimeRef.current = renderTime;

      setMetrics((prev) => ({
        ...prev,
        renderTime,
        timestamp: Date.now(),
      }));

      if (renderTime > 16.67 && onPerformanceIssue) {
        // 60fps threshold
        onPerformanceIssue("renderTime", renderTime);
      }
    });
  }, [onPerformanceIssue]);

  // Main monitoring loop
  useEffect(() => {
    let animationFrame: number;

    const monitor = () => {
      measureFPS();
      measureRenderTime();
      animationFrame = requestAnimationFrame(monitor);
    };

    // Start monitoring
    monitor();

    // Memory monitoring (every 2 seconds)
    const memoryInterval: NodeJS.Timeout = setInterval(measureMemory, 2000);

    // Network monitoring (every 10 seconds)
    const networkInterval: NodeJS.Timeout = setInterval(
      measureNetworkLatency,
      10000
    );

    return () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(memoryInterval);
      clearInterval(networkInterval);
    };
  }, [measureFPS, measureMemory, measureNetworkLatency, measureRenderTime]);

  // Store performance history
  useEffect(() => {
    setHistory((prev) => {
      const newHistory = [...prev, metrics].slice(-100); // Keep last 100 measurements
      return newHistory;
    });
  }, [metrics]);

  // Performance indicators
  const getPerformanceStatus = () => {
    const { fps, memory, renderTime, networkLatency } = metrics;

    const issues = [];
    if (fps < 30) issues.push("Low FPS");
    if (memory.percentage > 80) issues.push("High Memory");
    if (renderTime > 20) issues.push("Slow Rendering");
    if (networkLatency > 1000) issues.push("High Latency");

    if (issues.length === 0)
      return { status: "good", color: "text-green-600", icon: TrendingUp };
    if (issues.length <= 2)
      return {
        status: "warning",
        color: "text-yellow-600",
        icon: AlertTriangle,
      };
    return { status: "poor", color: "text-red-600", icon: TrendingDown };
  };

  const status = getPerformanceStatus();

  const formatBytes = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatTime = (time: number) => {
    return `${time.toFixed(2)}ms`;
  };

  return (
    <Card className={`${className} py-3 px-2 transition-all duration-200`}>
      <div
        role="button"
        aria-expanded={isExpanded}
        aria-label="Performance monitor"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex flex-col gap-2 justify-between px-3 cursor-pointer"
      >
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium">Performance</span>
          {isExpanded && (
            <span className="text-xs ml-auto font-medium text-gray-500">
              {formatBytes(metrics.memory.used)}
            </span>
          )}
        </div>

        {!isExpanded && (
          <div className="flex items-center justify-between space-x-1 text-xs">
            <span
              className={`flex items-center gap-2 font-mono ${status.color}`}
            >
              <status.icon className={`w-3 h-3 ${status.color}`} />
              {metrics.fps}fps
            </span>
            <span className="text-gray-500">
              {formatBytes(metrics.memory.used)}
            </span>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-2 -mt-3">
          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-2 gap-1">
            <div className="text-center py-2 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="flex items-center justify-center mb-1">
                <Activity className="w-3 h-3 mr-1 text-blue-600" />
                <span className="text-xs font-medium">FPS</span>
              </div>
              <div
                className={`text-xs font-mono ${
                  metrics.fps < 30 ? "text-red-600" : "text-green-600"
                }`}
              >
                {metrics.fps}
              </div>
            </div>

            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="flex items-center justify-center mb-1">
                <HardDrive className="w-3 h-3 mr-1 text-purple-600" />
                <span className="text-xs font-medium">Memory</span>
              </div>
              <div
                className={`text-xs font-mono ${
                  metrics.memory.percentage > 80
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {metrics.memory.percentage.toFixed(1)}%
              </div>
            </div>

            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="flex items-center justify-center mb-1">
                <Cpu className="w-3 h-3 mr-1 text-orange-600" />
                <span className="text-xs font-medium">Render</span>
              </div>
              <div
                className={`text-xs font-mono ${
                  metrics.renderTime > 16.67 ? "text-red-600" : "text-green-600"
                }`}
              >
                {formatTime(metrics.renderTime)}
              </div>
            </div>

            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="flex items-center justify-center mb-1">
                <Wifi className="w-3 h-3 mr-1 text-teal-600" />
                <span className="text-xs font-medium">Network</span>
              </div>
              <div
                className={`text-xs font-mono ${
                  metrics.networkLatency > 1000
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {formatTime(metrics.networkLatency)}
              </div>
            </div>
          </div>

          {/* Performance History */}
          <div className="mt-2">
            <div className="text-xs font-medium mb-1">FPS History</div>
            <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
              <div className="flex h-full items-end">
                {history.slice(-20).map((metric, index) => {
                  const height = Math.max(4, (metric.fps / 60) * 100);
                  const color =
                    metric.fps >= 50
                      ? "bg-green-400"
                      : metric.fps >= 30
                      ? "bg-yellow-400"
                      : "bg-red-400";

                  return (
                    <div
                      key={index}
                      className={`flex-1 ${color} mr-px`}
                      style={{ height: `${height}%` }}
                      title={`${metric.fps} fps at ${new Date(
                        metric.timestamp
                      ).toLocaleTimeString()}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance Tips */}
          {status.status !== "good" && (
            <div className="text-xs p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <div className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                Performance Tips:
              </div>
              <ul className="text-yellow-700 dark:text-yellow-400 space-y-1">
                {metrics.fps < 30 && (
                  <li>• Reduce particle count or visual effects</li>
                )}
                {metrics.memory.percentage > 80 && (
                  <li>• Refresh page to clear memory</li>
                )}
                {metrics.renderTime > 20 && <li>• Enable performance mode</li>}
                {metrics.networkLatency > 1000 && (
                  <li>• Check internet connection</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// Enhanced error boundary with accessibility
export class AccessibleErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  { hasError: boolean; error: Error | null; errorInfo: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ error, errorInfo });

    // Announce error to screen readers
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", "assertive");
    announcement.setAttribute("role", "alert");
    announcement.className = "sr-only";
    announcement.textContent =
      "An error occurred in the application. Please refresh the page or contact support.";
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 5000);

    // Log error for debugging
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent =
        this.props.fallback ||
        (() => (
          <Card className="p-6 m-4 border-red-200 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
                Something went wrong
              </h2>
            </div>

            <p className="text-red-700 dark:text-red-400 mb-4">
              We encountered an error while loading the visualization. This
              could be due to:
            </p>

            <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside mb-4">
              <li>Browser compatibility issues</li>
              <li>Network connectivity problems</li>
              <li>Insufficient device resources</li>
            </ul>

            <div className="flex space-x-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Reload the application"
              >
                Reload Page
              </button>

              <button
                onClick={() =>
                  this.setState({
                    hasError: false,
                    error: null,
                    errorInfo: null,
                  })
                }
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Try again without reloading"
              >
                Try Again
              </button>
            </div>

            {this.state.error && (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-red-600 hover:text-red-800">
                  Technical Details
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </Card>
        ));

      return <FallbackComponent />;
    }

    return this.props.children;
  }
}
