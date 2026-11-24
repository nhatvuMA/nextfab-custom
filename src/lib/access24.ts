// 24-Hour Access: request validation and the approval checklist.
// The checklist is computed on the server and enforced again inside the
// Approve action, so a request can't be approved with a step missing.
import type { Row } from "./store";
import { ACCESS24_OPEN } from "./picklists";

export const ACCESS24_RULES_VERSION = "2026-11";
export const ACCESS24_PRICE = 49;

export type Requirement = { key: string; label: string; done: boolean; detail?: string };

/** Today's date at NextFab (Philadelphia), not the server's or UTC date. */
export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

/**
 * What has to be true before staff can approve. Trainings are only required
 * for the areas the member said they'll use after hours.
 */
export function requirements(req: Row, member: Row, calls: Row[]): Requirement[] {
  const coiEnd = req.coi_end_date ? String(req.coi_end_date) : "";
  const list: Requirement[] = [
    { key: "active", label: "Membership is Active", done: member.membership_status === "Active", detail: String(member.membership_status ?? "No status") },
    { key: "coi", label: "Certificate of Insurance on file", done: Boolean(req.coi_path) },
    { key: "coi_end", label: "COI is current", done: Boolean(coiEnd) && coiEnd >= today(), detail: coiEnd ? `Ends ${coiEnd}` : "No end date" },
    { key: "call", label: "Safety call logged", done: calls.length > 0, detail: calls.length ? `${calls.length} call${calls.length > 1 ? "s" : ""}` : undefined },
    { key: "eoc", label: "EOC rating recorded", done: Boolean(String(req.eoc_rating ?? "").trim()) },
  ];
  if (req.uses_hazmat) list.push({ key: "hazmat", label: "Hazardous Materials training", done: Boolean(member.hazmat_training_date) });
  if (req.uses_compressed_gas) list.push({ key: "gas", label: "Compressed Gas training", done: Boolean(member.compressed_gas_training_date) });
  if (req.uses_paint_booth) list.push({ key: "paint", label: "Paint Booth Safety training", done: Boolean(member.paint_booth_training_date) });
  list.push({ key: "onboarding", label: "24-hour access onboarding completed", done: Boolean(member.access24_onboarding_date) });
  return list;
}

export const isOpen = (r: Row) => ACCESS24_OPEN.includes(String(r.status));

export type Access24Fields = Record<string, string>;

/** Validation shared by the public form (instant feedback) and the API. */
export function validateAccess24(f: Access24Fields, hasCoi: boolean): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.email?.trim()) e.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Enter a valid email";
  if (!f.dob) e.dob = "Date of birth is required";
  if (!f.reason?.trim()) e.reason = "Tell us what you'll be working on after hours";
  else if (f.reason.length > 2000) e.reason = "Keep this under 2,000 characters";
  if (hasCoi) {
    if (!f.coi_end_date) e.coi_end_date = "Enter the date your insurance certificate ends";
    else if (f.coi_end_date < today()) e.coi_end_date = "This certificate has already ended";
  }
  if (f.agree_rules !== "on") e.agree_rules = "You must agree to the 24-hour access rules";
  return e;
}
