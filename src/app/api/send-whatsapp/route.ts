import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendWhatsAppMessage } from "@/lib/twilio";

// POST /api/send-whatsapp — send a WhatsApp message
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { phoneNumber, message, templateParams } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: "phoneNumber and message are required" },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessage(phoneNumber, message, templateParams);

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to send message" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Send WhatsApp error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
