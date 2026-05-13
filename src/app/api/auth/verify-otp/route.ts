import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });

    const valid = await verifyOtp(email.toLowerCase().trim(), otp.trim());
    if (!valid) return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}
