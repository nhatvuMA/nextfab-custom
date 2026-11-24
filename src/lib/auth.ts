// Prototype staff auth: one shared password (ADMIN_PASSWORD) → signed cookie.
// Swap for Supabase Auth (staff accounts + roles) before production.
import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "nf_admin";
const secret = () => process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "nextfab-dev-secret";
export const adminPassword = () => process.env.ADMIN_PASSWORD || "nextfab";

const sign = (v: string) => crypto.createHmac("sha256", secret()).update(v).digest("base64url");

export async function isAdmin() {
  const c = (await cookies()).get(COOKIE)?.value;
  if (!c) return false;
  const [v, sig] = c.split(".");
  if (!v || !sig) return false;
  const want = Buffer.from(sign(v)), got = Buffer.from(sig);
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}

export async function login(pw: string) {
  const a = Buffer.from(pw), b = Buffer.from(adminPassword());
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const v = `staff-${Date.now()}`;
  (await cookies()).set(COOKIE, `${v}.${sign(v)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
  return true;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}
