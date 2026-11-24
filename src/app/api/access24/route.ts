import { NextResponse } from "next/server";
import { db, normEmail, saveFile, DuplicateError } from "@/lib/store";
import { checkFile } from "@/lib/validation";
import { ACCESS24_RULES_VERSION, isOpen, validateAccess24 } from "@/lib/access24";

// Existing member requests 24-hour access. Identity = email + date of birth,
// both already on the member record. The same message is shown whether the
// email is unknown or the date doesn't match, so the form can't be used to
// find out who is a member.
const NO_MATCH = "We couldn't match that email and date of birth to a membership. Check both, or contact Member Services.";

export async function POST(req: Request) {
  const fd = await req.formData();
  const f: Record<string, string> = {};
  fd.forEach((v, k) => { if (typeof v === "string") f[k] = v.trim(); });
  const coi = fd.get("coi") as File | null;
  const hasCoi = Boolean(coi && coi.size > 0);

  const errors = validateAccess24(f, hasCoi);
  const coiErr = hasCoi ? checkFile(coi) : null;
  if (coiErr) errors.coi = coiErr;
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors }, { status: 422 });

  const member = await db.findOne("members", { email: normEmail(f.email) });
  if (!member || String(member.dob ?? "") !== f.dob) return NextResponse.json({ ok: false, errors: { _form: NO_MATCH } }, { status: 422 });

  if (member.membership_status !== "Active")
    return NextResponse.json({ ok: false, errors: { _form: "24-hour access is for active members. Your membership isn't active right now. Contact Member Services and we'll help." } }, { status: 422 });
  if (member.access24_status === "Approved")
    return NextResponse.json({ ok: false, errors: { _form: "You already have 24-hour access. Contact Member Services if your badge isn't working." } }, { status: 409 });
  const prior = await db.list("access24_requests", { eq: { member_id: member.id } });
  if (prior.some(isOpen))
    return NextResponse.json({ ok: false, errors: { _form: "You already have a 24-hour access request in progress. We'll be in touch about your safety call." } }, { status: 409 });

  const coi_path = hasCoi ? await saveFile(`access24/${member.id}`, coi!, coi!.name) : null;
  try {
    await db.insert("access24_requests", {
      member_id: member.id,
      status: "Requested",
      reason: f.reason,
      uses_hazmat: f.uses_hazmat === "on",
      uses_compressed_gas: f.uses_compressed_gas === "on",
      uses_paint_booth: f.uses_paint_booth === "on",
      coi_path,
      coi_end_date: hasCoi ? f.coi_end_date : null,
      agreed_rules_at: new Date().toISOString(),
      rules_version: ACCESS24_RULES_VERSION,
      signer_ip: req.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
    });
  } catch (err) {
    // Two submissions at once: the database allows only one open request.
    if (err instanceof DuplicateError)
      return NextResponse.json({ ok: false, errors: { _form: "You already have a 24-hour access request in progress." } }, { status: 409 });
    throw err;
  }
  await db.update("members", member.id, { access24_status: "Requested" });
  return NextResponse.json({ ok: true, needsCoi: !hasCoi });
}
