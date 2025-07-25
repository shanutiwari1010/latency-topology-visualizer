"use client";

import React, { useState, useEffect } from "react";
import {
  Map,
  BarChart3,
  Settings,
  Info,
  Menu,
  X,
  Search,
  Filter,
  Download,
  Share2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MobileNavigationProps {
  activeView: "map" | "chart" | "settings" | "info";
  onViewChange: (view: "map" | "chart" | "settings" | "info") => void;
  isLoading?: boolean;
  className?: string;
  showOnlyMenu?: boolean;
  showOnlyBottomNav?: boolean;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeView,
  onViewChange,
  isLoading = false,
  className,
  showOnlyMenu = false,
  showOnlyBottomNav = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Handler: Export Data
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/latency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export" }),
      });
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = "latency-data.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToast("Export started. Check your downloads.");
      } else {
        setToast("Export failed.");
      }
    } catch (e) {
      setToast("Export failed.");
    }
    setExporting(false);
    setIsMenuOpen(false);
  };

  // Handler: Share View
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast("Link copied to clipboard!");
    } catch {
      setToast("Failed to copy link.");
    }
    setIsMenuOpen(false);
  };

  // Handler: Help
  const handleHelp = () => {
    setShowHelp(true);
    setIsMenuOpen(false);
  };

  // Handler: Search/Filters
  const handleSearch = () => {
    onViewChange("settings");
    setIsMenuOpen(false);
    // Optionally, focus search input via context/ref
  };

  // Handler: Advanced Filters
  const handleFilters = () => {
    onViewChange("settings");
    setIsMenuOpen(false);
  };

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const navItems = [
    { id: "map" as const, icon: Map, label: "3D Map", badge: null },
    { id: "chart" as const, icon: BarChart3, label: "Charts", badge: null },
    { id: "settings" as const, icon: Settings, label: "Settings", badge: null },
    { id: "info" as const, icon: Info, label: "Info", badge: null },
  ];

  // If showing only menu, render just the hamburger menu
  if (showOnlyMenu) {
    return (
      <>
        {/* Hamburger Menu for Extra Actions */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-lg"
          >
            {isMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </Button>

          {/* Menu Dropdown */}
          {isMenuOpen && (
            <Card className="absolute top-full right-0 mt-2 w-48 py-2 z-50">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleSearch}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleFilters}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Advanced Filters
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exporting ? "Exporting..." : "Export Data"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share View
                </Button>
                <div className="border-t mt-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleHelp}
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <Card className="p-6 max-w-md w-full mx-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Help & Info</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHelp(false)}
                >
                  <X />
                </Button>
              </div>
              <div className="space-y-3 text-sm">
                <p>
                  <b>Latency Topology Visualizer</b> helps you explore exchange
                  latency, regions, and network topology for crypto trading
                  infrastructure.
                </p>
                <p>
                  Use the Control Panel to filter exchanges, regions, and
                  latency. Use the chart to view historical trends. Tap the
                  legend for map info.
                </p>
                <p>
                  For more help, contact:{" "}
                  <a
                    href="mailto:support@goquant.ai"
                    className="text-blue-600 underline"
                  >
                    support@goquant.ai
                  </a>
                </p>
              </div>
              <Button
                className="mt-6 w-full"
                onClick={() => setShowHelp(false)}
              >
                Close
              </Button>
            </Card>
          </div>
        )}
        {/* Toast */}
        {toast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-4 py-2 rounded shadow-lg text-sm">
            {toast}
          </div>
        )}
      </>
    );
  }

  // If showing only bottom nav, render just the bottom navigation
  if (showOnlyBottomNav) {
    return (
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden ${className}`}
      >
        <Card className="rounded-none border-t border-x-0 border-b-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
          <div className="flex items-center justify-around px-2 py-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeView === item.id ? "default" : "ghost"}
                size="sm"
                className="flex-1 flex-col h-12 px-1 relative"
                onClick={() => onViewChange(item.id)}
                disabled={isLoading}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-xs mt-1">{item.label}</span>
                {item.badge && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Default: render both (for backward compatibility)
  return (
    <>
      {/* Bottom Navigation Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden ${className}`}
      >
        <Card className="rounded-none border-t border-x-0 border-b-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
          <div className="flex items-center justify-around px-2 py-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeView === item.id ? "default" : "ghost"}
                size="sm"
                className="flex-1 flex-col h-12 px-1 relative"
                onClick={() => onViewChange(item.id)}
                disabled={isLoading}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-xs mt-1">{item.label}</span>
                {item.badge && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Hamburger Menu for Extra Actions */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-lg"
        >
          {isMenuOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </Button>

        {/* Menu Dropdown */}
        {isMenuOpen && (
          <Card className="mt-2 w-48 py-2">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={handleSearch}
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={handleFilters}
              >
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={handleExport}
                disabled={exporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? "Exporting..." : "Export Data"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share View
              </Button>
              <div className="border-t mt-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleHelp}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help
                </Button>
              </div>
            </div>
          </Card>
        )}
        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <Card className="p-6 max-w-md w-full mx-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Help & Info</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHelp(false)}
                >
                  <X />
                </Button>
              </div>
              <div className="space-y-3 text-sm">
                <p>
                  <b>Latency Topology Visualizer</b> helps you explore exchange
                  latency, regions, and network topology for crypto trading
                  infrastructure.
                </p>
                <p>
                  Use the Control Panel to filter exchanges, regions, and
                  latency. Use the chart to view historical trends. Tap the
                  legend for map info.
                </p>
                <p>
                  For more help, contact:{" "}
                  <a
                    href="mailto:support@goquant.ai"
                    className="text-blue-600 underline"
                  >
                    support@goquant.ai
                  </a>
                </p>
              </div>
              <Button
                className="mt-6 w-full"
                onClick={() => setShowHelp(false)}
              >
                Close
              </Button>
            </Card>
          </div>
        )}
        {/* Toast */}
        {toast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-4 py-2 rounded shadow-lg text-sm">
            {toast}
          </div>
        )}
      </div>
    </>
  );
};
