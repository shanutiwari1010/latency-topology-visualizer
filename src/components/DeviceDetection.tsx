"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  screenSize: "xs" | "sm" | "md" | "lg" | "xl";
  orientation: "portrait" | "landscape";
  performanceLevel: "low" | "medium" | "high";
}

const DeviceContext = createContext<DeviceInfo>({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  hasTouch: false,
  screenSize: "md",
  orientation: "landscape",
  performanceLevel: "medium",
});

export const useDevice = () => useContext(DeviceContext);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    hasTouch: false,
    screenSize: "md",
    orientation: "landscape",
    performanceLevel: "medium",
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const hasTouch = "ontouchstart" in window;

      // Screen size detection
      let screenSize: DeviceInfo["screenSize"] = "md";
      if (width < 640) screenSize = "xs";
      else if (width < 768) screenSize = "sm";
      else if (width < 1024) screenSize = "md";
      else if (width < 1280) screenSize = "lg";
      else screenSize = "xl";

      // Device type detection
      const isMobile = width < 768 && hasTouch;
      const isTablet = width >= 768 && width < 1024 && hasTouch;
      const isDesktop = !isMobile && !isTablet;

      // Orientation
      const orientation = width > height ? "landscape" : "portrait";

      // Performance level estimation
      let performanceLevel: DeviceInfo["performanceLevel"] = "medium";

      if (navigator.hardwareConcurrency) {
        if (navigator.hardwareConcurrency >= 8) performanceLevel = "high";
        else if (navigator.hardwareConcurrency <= 2) performanceLevel = "low";
      }

      // Check for performance memory API
      if ("memory" in performance) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const memInfo = (performance as any).memory;
        if (memInfo.usedJSHeapSize > 100000000) performanceLevel = "low";
      }

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        hasTouch,
        screenSize,
        orientation,
        performanceLevel,
      });
    };

    updateDeviceInfo();
    window.addEventListener("resize", updateDeviceInfo);
    window.addEventListener("orientationchange", updateDeviceInfo);

    return () => {
      window.removeEventListener("resize", updateDeviceInfo);
      window.removeEventListener("orientationchange", updateDeviceInfo);
    };
  }, []);

  return (
    <DeviceContext.Provider value={deviceInfo}>
      {children}
    </DeviceContext.Provider>
  );
};
