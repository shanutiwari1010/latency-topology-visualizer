import { NextRequest, NextResponse } from "next/server";

const RADAR_API_BASE = "https://api.cloudflare.com/client/v4/radar";
const API_KEY = process.env.CLOUDFLARE_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: "CLOUDFLARE_API_KEY is not set in environment variables.",
      },
      { status: 500 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { success: false, error: "Missing 'code' query parameter" },
      { status: 400 }
    );
  }

  const radarUrl = `${RADAR_API_BASE}/entities/locations/${code}`;

  try {
    const radarRes = await fetch(radarUrl, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (!radarRes.ok) {
      const text = await radarRes.text();
      console.error(
        "Radar Location API error:",
        radarUrl,
        radarRes.status,
        text
      );
      return NextResponse.json(
        {
          success: false,
          error: `Radar Location API error: ${radarRes.status}`,
          details: text,
        },
        { status: radarRes.status }
      );
    }
    const data = await radarRes.json();
    const response = NextResponse.json({ success: true, data });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    return response;
  } catch (error) {
    console.error("Internal server error (location):", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  // Handle CORS preflight
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
