import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchCourts } from "@/lib/ecase";

// GET /api/ecase/courts — fetch list of courts from eCase
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const courts = await fetchCourts();
    return NextResponse.json({ courts });
  } catch (error) {
    console.error("Fetch courts error:", error);
    return NextResponse.json({ error: "Failed to fetch courts" }, { status: 500 });
  }
}
