import { NextResponse } from "next/server";
import { db, normEmail } from "@/lib/store";
import { validateJunior } from "@/lib/validation";

export async function POST(req: Request) {
  const fd = await req.formData();
  const f: Record<string, string> = {};
  fd.forEach((v, k) => (f[k] = String(v).trim()));
  const errors = validateJunior(f);
  const parent = f.parent_email ? await db.findOne("members", { email: normEmail(f.parent_email) }) : null;
  if (f.parent_email && !errors.parent_email && !parent) errors.parent_email = "We couldn't find a member with that email";
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors }, { status: 422 });
  await db.insert("junior_members", {
    parent_member_id: parent!.id, first_name: f.first_name, last_name: f.last_name, dob: f.dob, ec_phone: f.ec_phone, status: "Pending Review",
  });
  return NextResponse.json({ ok: true });
}
