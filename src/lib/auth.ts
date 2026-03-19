import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getUserByEmail, getUserById, type UserRecord } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production-please";
const COOKIE_NAME = "cm_token";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

/**
 * Get the currently authenticated user from cookies (server component / route handler).
 */
export async function getCurrentUser(): Promise<UserRecord | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  return await getUserById(payload.userId);
}

/**
 * Authenticate a user by email/password. Returns a JWT token string or null.
 */
export async function authenticate(
  email: string,
  password: string
): Promise<string | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return null;

  return signToken(user.id);
}

export { COOKIE_NAME };
