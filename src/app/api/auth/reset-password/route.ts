import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { getUserByEmail, updateUserPassword, consumeOtp } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();
    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Email, OTP, and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const user = await getUserByEmail(email.toLowerCase().trim());
    if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    // Re-verify OTP (single-use already consumed in verify-otp step, so we just trust it here)
    // For extra security we do a final check
    const valid = await consumeOtp(email.toLowerCase().trim(), otp.trim());
    if (!valid) return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });

    const newHash = await hashPassword(newPassword);
    await updateUserPassword(email.toLowerCase().trim(), newHash);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
