import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createOtp } from "@/lib/db";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const user = await getUserByEmail(email.toLowerCase().trim());
    // Always return success to avoid email enumeration
    if (!user) return NextResponse.json({ success: true });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await createOtp(email.toLowerCase().trim(), otp);
    await sendOtpEmail(email, otp);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
