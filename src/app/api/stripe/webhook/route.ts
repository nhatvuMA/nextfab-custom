import { NextResponse } from "next/server";
import { stripe, markPaid } from "@/lib/integration";

export const runtime = "nodejs";

// Configure in Stripe: endpoint /api/stripe/webhook, event checkout.session.completed
export async function POST(req: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  const body = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const id = event.data.object.metadata?.signup_id;
    if (id) await markPaid(id);
  }
  return NextResponse.json({ received: true });
}
