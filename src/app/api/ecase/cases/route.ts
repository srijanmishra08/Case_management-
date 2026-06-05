import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchCasesByCourt } from "@/lib/ecase";

// POST /api/ecase/cases — fetch cases for a specific court
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { court_code } = body;

    if (!court_code) {
      return NextResponse.json({ error: "Court code is required" }, { status: 400 });
    }

    const cases = await fetchCasesByCourt(court_code);
    return NextResponse.json({ cases });
  } catch (error) {
    console.error("Fetch cases error:", error);
    return NextResponse.json({ error: "Failed to fetch cases" }, { status: 500 });
  }
}
