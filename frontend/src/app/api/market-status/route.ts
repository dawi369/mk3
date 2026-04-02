import { NextResponse } from "next/server";
import { MASSIVE_API_KEY } from "@/config/env.server";

const MARKET_STATUS_URL = "https://api.massive.com/futures/vX/market-status?product_code=ES&limit=10";

export async function GET() {
  if (!MASSIVE_API_KEY) {
    return NextResponse.json(
      { marketStatus: "open", fallback: true, reason: "missing_massive_api_key" },
      { status: 200 }
    );
  }

  try {
    const response = await fetch(`${MARKET_STATUS_URL}&apiKey=${MASSIVE_API_KEY}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Massive market status request failed with ${response.status}`);
    }

    const data = await response.json();
    const marketStatus =
      data?.results?.[0]?.market_event && typeof data.results[0].market_event === "string"
        ? data.results[0].market_event
        : "open";

    return NextResponse.json({ marketStatus });
  } catch (error) {
    console.error("Failed to fetch market status on server:", error);
    return NextResponse.json(
      { marketStatus: "open", fallback: true, reason: "market_status_fetch_failed" },
      { status: 200 }
    );
  }
}
