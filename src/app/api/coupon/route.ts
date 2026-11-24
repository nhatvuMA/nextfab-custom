import { NextResponse } from "next/server";
import { lookupCoupon } from "@/lib/integration";

export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({ code: "" }));
  if (!code || typeof code !== "string" || code.length > 64) return NextResponse.json({ valid: false });
  const coupon = await lookupCoupon(code);
  return NextResponse.json(coupon ? { valid: true, coupon } : { valid: false });
}
