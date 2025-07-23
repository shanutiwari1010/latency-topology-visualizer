// src/components/Legend.tsx
'use client';

import React from 'react';
import { Info, Zap, Globe, Cloud } from 'lucide-react';
import { PROVIDER_COLORS, LATENCY_QUALITY_COLORS } from '@/constants/exchangeLocations';
import { Card } from './ui/card';


interface LegendProps {
  className?: string;
}

const Legend: React.FC<LegendProps> = ({ className }) => {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center">
        <Info className="w-4 h-4 mr-2 text-blue-600" />
        <h4 className="font-semibold text-sm">Legend</h4>
      </div>
      
      <div className="space-y-4 text-sm">
        {/* Cloud Providers */}
        <div>
          <div className="flex items-center mb-2">
            <Cloud className="w-3 h-3 mr-1" />
            <span className="font-medium text-xs">Cloud Providers</span>
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
            <Zap className="w-3 h-3 mr-1" />
            <span className="font-medium text-xs">Latency Quality</span>
          </div>
          <div className="space-y-1 ml-4">
            {Object.entries(LATENCY_QUALITY_COLORS).map(([quality, color]) => (
              <div key={quality} className="flex items-center">
                <div
                  className="w-3 h-1 rounded mr-2"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs capitalize">{quality}</span>
                <span className="text-xs text-gray-500 ml-1">
                  {quality === 'excellent' && '(≤20ms)'}
                  {quality === 'good' && '(21-50ms)'}
                  {quality === 'fair' && '(51-100ms)'}
                  {quality === 'poor' && '(>100ms)'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Map Elements */}
        <div>
          <div className="flex items-center mb-2">
            <Globe className="w-3 h-3 mr-1" />
            <span className="font-medium text-xs">Map Elements</span>
          </div>
          <div className="space-y-1 ml-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2" />
              <span className="text-xs">Exchange Servers</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-1 bg-gradient-to-r from-green-400 to-red-400 rounded mr-2" />
              <span className="text-xs">Latency Connections</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 border-2 border-gray-400 rounded-full mr-2" />
              <span className="text-xs">Cloud Regions</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Legend;

