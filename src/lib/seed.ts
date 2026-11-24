// Demo data used by the local JSON store (mirrors supabase/seed.sql).
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

export const seed: Record<string, Record<string, unknown>[]> = {
  groups: [
    { name: "Drexel University Makers", group_code: "DREXEL-2026", is_subtenant: false },
    { name: "Philly Woodworkers Collective", group_code: "PWC-01", is_subtenant: false },
    { name: "Studio 4 Subtenants", group_code: "STUDIO4-SUB", is_subtenant: true },
  ],
  courses: [
    { name: "Intro to Woodworking (Beginner)", level: "Beginner", start_date: inDays(14), end_date: inDays(56), status: "Active", slug: "intro-woodworking", description: "Four weeks from first cut to finished cutting board." },
    { name: "Build Your Own Pathway", level: "Intermediate", start_date: inDays(21), end_date: inDays(80), status: "Active", slug: "build-your-own-pathway", description: "Up to 4 classes plus one-on-one project time with a technical educator." },
    { name: "Create Your Own Workwear Jacket", level: "Intermediate", start_date: inDays(30), end_date: inDays(60), status: "Active", slug: "workwear-jacket", description: "Studio orientation, material prep, assembly and finishing." },
  ],
  coupons: [
    { code: "WELCOME25", amount_off: 25, percent_off: null, active: true },
    { code: "MAKER10", amount_off: null, percent_off: 10, active: true },
  ],
  leads: [
    { first_name: "Jordan", last_name: "Rivera", email: "jordan.rivera@example.com", phone: "+1 215 555 0142", lead_status: "Tour Scheduled", lead_type: "Month-to-Month Membership", lead_source: "Instagram", lead_date: inDays(-3), tour_date: inDays(2), tour_guide: "Sam", lead_owner: "Member Services" },
    { first_name: "Priya", last_name: "Shah", email: "priya.shah@example.com", phone: "+1 267 555 0199", lead_status: "Qualified", lead_type: "Annual Contract Membership", lead_source: "Member Referral", referred_by: "Alex Kim", lead_date: inDays(-12), lead_owner: "Member Services" },
  ],
};
