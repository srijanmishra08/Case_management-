import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient, getClientsByUserId } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// GET /api/cases — list all clients for the logged-in user
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const clients = await getClientsByUserId(user.id);
  return NextResponse.json({ clients });
}

// POST /api/cases — create a new client/case
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { client_name, client_whatsapp, case_title, court_name } = body;

    if (!client_name || !client_whatsapp || !case_title || !court_name) {
      return NextResponse.json(
        { error: "Client name, WhatsApp number, case title, and court name are required" },
        { status: 400 }
      );
    }

    const client = await createClient({
      id: uuidv4(),
      user_id: user.id,
      client_name,
      client_whatsapp,
      case_title,
      court_name,
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
