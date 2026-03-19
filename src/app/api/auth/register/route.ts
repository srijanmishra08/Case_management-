import { NextRequest, NextResponse } from "next/server";
import { hashPassword, COOKIE_NAME, signToken } from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, firm_name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const password_hash = await hashPassword(password);
    const user = await createUser({
      id: uuidv4(),
      email,
      password_hash,
      name,
      firm_name: firm_name || "Law Office",
    });

    const token = signToken(user.id);
    const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
