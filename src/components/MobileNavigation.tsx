"use client";

import React, { useState } from "react";
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
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeView,
  onViewChange,
  isLoading = false,
  className,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: "map" as const, icon: Map, label: "3D Map", badge: null },
    { id: "chart" as const, icon: BarChart3, label: "Charts", badge: null },
    { id: "settings" as const, icon: Settings, label: "Settings", badge: null },
    { id: "info" as const, icon: Info, label: "Info", badge: null },
  ];

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
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share View
              </Button>
              <div className="border-t mt-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
};
