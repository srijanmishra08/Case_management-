import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getClientById, createHearing } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// POST /api/cases/[id]/hearings — add a hearing update to a client
export async function POST(
  req: NextRequest,
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

  try {
    const body = await req.json();
    const { hearing_date, next_hearing_date, purpose_of_hearing, special_notes } = body;

    if (!hearing_date) {
      return NextResponse.json({ error: "Hearing date is required" }, { status: 400 });
    }

    const hearing = createHearing({
      id: uuidv4(),
      client_id: id,
      hearing_date,
      next_hearing_date: next_hearing_date || null,
      purpose_of_hearing: purpose_of_hearing || null,
      special_notes: special_notes || null,
    });

    return NextResponse.json({ hearing }, { status: 201 });
  } catch (error) {
    console.error("Create hearing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
