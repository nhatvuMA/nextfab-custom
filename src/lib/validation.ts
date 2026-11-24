// Shared validation used by the sign-up form (instant feedback) and the API
// (authoritative). Messages match the wording staff/members already know.
import { DISCOUNT_TYPES, type SignupType } from "./pricing";

export const MSG = {
  emailMismatch: "Emails do not match",
  underage: "Member age has to be above 18 years",
};

export const ALLOWED_UPLOAD = ["image/png", "image/jpeg", "image/gif", "application/pdf"];
export const ALLOWED_EXT = /\.(png|jpe?g|gif|pdf)$/i;
export const MAX_UPLOAD = 5 * 1024 * 1024;

export function ageOn(dob: string, today = new Date()) {
  const d = new Date(dob + "T00:00:00");
  if (Number.isNaN(d.getTime())) return NaN;
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export function checkFile(f: { name: string; type: string; size: number } | null | undefined): string | null {
  if (!f) return null;
  if (!(ALLOWED_UPLOAD.includes(f.type) || ALLOWED_EXT.test(f.name))) return "Unsupported file type. Use PNG, JPG, GIF or PDF.";
  if (f.size > MAX_UPLOAD) return "File is larger than 5 MB.";
  return null;
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const isPhone = (s: string) => s.replace(/\D/g, "").length >= 7;
const isUrl = (s: string) => /^(https?:\/\/)?[\w-]+(\.[\w-]+)+\S*$/i.test(s) || /^@[\w.]+$/.test(s);

export type SignupFields = Record<string, string>;
export type FieldErrors = Record<string, string>;

/**
 * Validates every field. `files` describes which uploads are present
 * (either newly attached or already stored from an earlier attempt).
 */
export function validateSignup(type: SignupType, f: SignupFields, files: { photo: boolean; proof: boolean; signature: boolean }): FieldErrors {
  const e: FieldErrors = {};
  const req = (k: string, label: string) => {
    if (!f[k]?.trim()) e[k] = `${label} is required`;
  };

  if (type === "membership") {
    if (!f.plan) e.plan = "Please select a membership plan";
    if (f.plan === "discounted") {
      if (!DISCOUNT_TYPES.includes(f.discount_type as (typeof DISCOUNT_TYPES)[number])) e.discount_type = "Select a discount type";
      if (!f.discount_plan) e.discount_plan = "Select a discounted plan";
      if (f.discount_type === "Artisan") {
        if (!f.discount_proof_link?.trim()) e.discount_proof_link = "Enter a link to your website, Instagram or portfolio";
        else if (!isUrl(f.discount_proof_link.trim())) e.discount_proof_link = "Enter a valid link";
      } else if (f.discount_type && !files.proof) e.discount_proof = "Upload proof of eligibility";
    }
  }
  if (type === "group" && !f.group_id) e.group_id = "Please select your Group ID";
  if (type === "maker-series" && !f.course_id) e.course_id = "Please select a Maker Series course";

  req("first_name", "First name");
  req("last_name", "Last name");
  if (!f.email?.trim()) e.email = "Email is required";
  else if (!isEmail(f.email.trim())) e.email = "Enter a valid email";
  if (f.email && f.confirm_email !== undefined && f.email.trim().toLowerCase() !== (f.confirm_email ?? "").trim().toLowerCase())
    e.confirm_email = MSG.emailMismatch;
  if (!f.phone?.trim()) e.phone = "Phone is required";
  else if (!isPhone(f.phone)) e.phone = "Enter a valid phone number";

  if (!f.dob) e.dob = "Date of birth is required";
  else {
    const age = ageOn(f.dob);
    if (Number.isNaN(age)) e.dob = "Enter a valid date";
    else if (age < 18) e.dob = MSG.underage;
    else if (age > 120) e.dob = "Enter a valid date";
  }
  if (!files.photo) e.photo = "Upload your member ID photo";

  req("address_line1", "Address line 1");
  req("city", "City");
  req("state", "State / Province");
  req("postal_code", "Postal code");
  req("country", "Country");
  req("ec_first_name", "Emergency contact first name");
  req("ec_last_name", "Emergency contact last name");
  if (!f.ec_phone?.trim()) e.ec_phone = "Emergency contact phone is required";
  else if (!isPhone(f.ec_phone)) e.ec_phone = "Enter a valid phone number";

  if (f.agree_terms !== "on" && f.agree_terms !== "true") e.agree_terms = "You must accept the Terms & Conditions";
  if (!files.signature) e.signature = "Signature is required";
  return e;
}

export function validateJunior(f: SignupFields): FieldErrors {
  const e: FieldErrors = {};
  for (const [k, l] of [["parent_email", "Parent member email"], ["first_name", "First name"], ["last_name", "Last name"], ["ec_phone", "Emergency phone"]])
    if (!f[k]?.trim()) e[k] = `${l} is required`;
  if (f.parent_email && !isEmail(f.parent_email)) e.parent_email = "Enter a valid email";
  if (!f.dob) e.dob = "Date of birth is required";
  else {
    const a = ageOn(f.dob);
    if (Number.isNaN(a) || a < 10 || a > 17) e.dob = "Junior members must be between 10 and 17 years old";
  }
  if (f.agree_terms !== "on") e.agree_terms = "Parent/guardian consent is required";
  return e;
}
