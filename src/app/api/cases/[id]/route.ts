import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getClientById, updateClient, deleteClient, getHearingsByClientId, getLatestHearingByClientId } from "@/lib/db";

// GET /api/cases/[id] — get a client with their hearings
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const client = getClientById(id);
  if (!client || client.user_id !== user.id) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const hearings = getHearingsByClientId(id);
  const latestHearing = getLatestHearingByClientId(id);

  return NextResponse.json({ client, hearings, latestHearing });
}

// PUT /api/cases/[id] — update client info
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = getClientById(id);
  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const updated = updateClient(id, {
      client_name: body.client_name,
      client_whatsapp: body.client_whatsapp,
      case_title: body.case_title,
      court_name: body.court_name,
    });

    return NextResponse.json({ client: updated });
  } catch (error) {
    console.error("Update client error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/cases/[id] — delete a client and all their hearings
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = getClientById(id);
  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  deleteClient(id);
  return NextResponse.json({ success: true });
}
