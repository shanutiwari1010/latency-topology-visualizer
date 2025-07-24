// src/components/ResponsiveGrid.tsx
"use client";

import React, { useState, useEffect } from "react";

interface ResponsiveGridProps {
  children: React.ReactNode;
  breakpoints?: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  className,
}) => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<
    "xs" | "sm" | "md" | "lg" | "xl"
  >("md");

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;

      if (width >= breakpoints.xl) {
        setCurrentBreakpoint("xl");
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint("lg");
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint("md");
      } else if (width >= breakpoints.sm) {
        setCurrentBreakpoint("sm");
      } else {
        setCurrentBreakpoint("xs");
      }
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);

    return () => window.removeEventListener("resize", updateBreakpoint);
  }, [breakpoints]);

  const getGridClasses = () => {
    const baseClasses = "grid gap-4";

    switch (currentBreakpoint) {
      case "xs":
        return `${baseClasses} grid-cols-1`;
      case "sm":
        return `${baseClasses} grid-cols-1 sm:grid-cols-2`;
      case "md":
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 md:grid-cols-3`;
      case "lg":
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`;
      case "xl":
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`;
      default:
        return `${baseClasses} grid-cols-1`;
    }
  };

  return (
    <div
      className={`${getGridClasses()} ${className || ""}`}
      data-breakpoint={currentBreakpoint}
    >
      {children}
    </div>
  );
};
