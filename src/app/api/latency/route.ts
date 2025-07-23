import { NextRequest, NextResponse } from "next/server";
import {
  generateMockLatencyData,
  generateHistoricalData,
  generateMockMetrics,
} from "@/lib/mockApi";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "current";
  const days = parseInt(searchParams.get("days") || "7");

  try {
    // Simulate network delay
    await new Promise((resolve) =>
      setTimeout(resolve, 200 + Math.random() * 300)
    );

    switch (type) {
      case "current":
        const currentData = generateMockLatencyData();
        return NextResponse.json({
          success: true,
          data: currentData,
          timestamp: Date.now(),
        });

      case "historical":
        const historicalData = generateHistoricalData(days);
        return NextResponse.json({
          success: true,
          data: historicalData,
          timestamp: Date.now(),
        });

      case "metrics":
        const metricsData = generateMockMetrics();
        return NextResponse.json({
          success: true,
          data: metricsData,
          timestamp: Date.now(),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid type parameter",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    // Simulate different POST actions
    switch (action) {
      case "refresh":
        const refreshedData = generateMockLatencyData();
        return NextResponse.json({
          success: true,
          data: refreshedData,
          message: "Data refreshed successfully",
        });

      case "export":
        // Simulate export functionality
        return NextResponse.json({
          success: true,
          downloadUrl: "/api/latency/export/data.json",
          message: "Export prepared successfully",
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Unknown action",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("POST API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
      },
      { status: 500 }
    );
  }
}
