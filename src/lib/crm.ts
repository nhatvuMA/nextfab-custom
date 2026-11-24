import { db, normEmail, DuplicateError, type Row } from "./store";

/** Lead → Member conversion with the B.3 field mapping and email duplicate check. */
export async function convertLead(leadId: string, opts: { mergeInto?: string; by?: string } = {}) {
  const lead = await db.get("leads", leadId);
  if (!lead) throw new Error("Lead not found");
  if (lead.converted_at) throw new Error("Lead is already converted");

  const mapped: Record<string, unknown> = {
    first_name: lead.first_name, last_name: lead.last_name, preferred_name: lead.preferred_name,
    phone: lead.phone, dob: lead.dob,
    ec_first_name: lead.ec_first_name, ec_last_name: lead.ec_last_name, ec_phone: lead.ec_phone,
    business_name: lead.business_name, business_website: lead.business_website, business_social: lead.business_social,
    address_line1: lead.address_line1, address_line2: lead.address_line2, city: lead.city, state: lead.state,
    postal_code: lead.postal_code, country: lead.country,
    // Lead History section
    lead_source: lead.lead_source, lead_date: lead.lead_date, referred_by: lead.referred_by,
    tour_guide: lead.tour_guide, tour_date: lead.tour_date,
    member_owner: lead.lead_owner,
    converted_from_lead_id: lead.id,
  };

  let member: Row;
  if (opts.mergeInto) {
    const existing = await db.get("members", opts.mergeInto);
    if (!existing) throw new Error("Member to merge into not found");
    // Merge: only fill blanks on the existing member, never overwrite.
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(mapped)) if (v && !existing[k]) patch[k] = v;
    member = await db.update("members", existing.id, patch);
  } else {
    const email = normEmail(lead.email);
    if (email) {
      const dup = await db.findOne("members", { email });
      if (dup) throw new DuplicateError(dup.id);
    }
    member = await db.insert("members", { ...mapped, email: email || null, membership_status: "Unpaid" });
  }

  await db.update("leads", lead.id, { converted_at: new Date().toISOString(), converted_member_id: member.id });
  // Carry status history onto the member (Leads Status History related list).
  for (const h of await db.list("lead_status_history", { eq: { lead_id: lead.id } })) {
    await db.update("lead_status_history", h.id, { member_id: member.id });
  }
  await db.insert("lead_status_history", { lead_id: lead.id, member_id: member.id, status: "Converted", changed_by: opts.by ?? "Staff", lead_type: lead.lead_type, lead_source: lead.lead_source });
  return member;
}

export async function logLeadStatus(lead: Row, by = "Staff") {
  await db.insert("lead_status_history", {
    lead_id: lead.id, status: lead.lead_status ?? "New", changed_by: by, lead_type: lead.lead_type, lead_source: lead.lead_source, lead_owner: lead.lead_owner,
  });
}
