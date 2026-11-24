import type { SectionDef } from "@/components/admin/RecordForm";
import { ACCESS24_STATUSES, LEAD_SOURCES, LEAD_STATUSES, LEAD_TYPES, MEMBERSHIP_STATUSES, MEMBERSHIP_TYPES } from "./picklists";

const address = (title = "Billing Address"): SectionDef => ({
  title,
  fields: [
    { name: "address_line1", label: "Street", span: 2 },
    { name: "address_line2", label: "Street line 2" },
    { name: "city", label: "City" },
    { name: "state", label: "State / Province" },
    { name: "postal_code", label: "Zip / Postal Code" },
    { name: "country", label: "Country / Region" },
  ],
});
const emergency: SectionDef = {
  title: "Emergency Contact",
  fields: [
    { name: "ec_first_name", label: "Emergency Contact First Name" },
    { name: "ec_last_name", label: "Emergency Contact Last Name" },
    { name: "ec_phone", label: "Emergency Contact Phone Number", type: "tel" },
  ],
};

export const LEAD_SECTIONS: SectionDef[] = [
  {
    title: "Lead Information",
    fields: [
      { name: "first_name", label: "First Name", required: true },
      { name: "last_name", label: "Last Name" },
      { name: "preferred_name", label: "Preferred Name" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "tel" },
      { name: "dob", label: "Date of Birth", type: "date" },
      { name: "lead_status", label: "Lead Status", type: "select", options: LEAD_STATUSES },
      { name: "lead_type", label: "Lead Type", type: "select", options: LEAD_TYPES },
      { name: "lead_source", label: "Lead Source", type: "select", options: LEAD_SOURCES },
      { name: "lead_date", label: "Lead Date", type: "date" },
      { name: "tour_guide", label: "Tour Guide" },
      { name: "tour_date", label: "Tour Date", type: "date" },
      { name: "lead_owner", label: "Lead Owner" },
    ],
  },
  { ...emergency, note: "Optional at lead stage; usually completed during onboarding." },
  { title: "Referral Info", fields: [{ name: "referred_by", label: "Referred By" }] },
  address(),
  {
    title: "Business Details",
    fields: [
      { name: "business_name", label: "Business Name" },
      { name: "business_website", label: "Business Website", type: "url" },
      { name: "business_social", label: "Business Social Handles" },
    ],
  },
  { title: "Notes", fields: [{ name: "notes", label: "Notes", type: "textarea" }] },
];

export function memberSections(groups: { id: string; name: string }[]): SectionDef[] {
  return [
    {
      title: "Member Information",
      fields: [
        { name: "first_name", label: "First Name", required: true },
        { name: "last_name", label: "Last Name" },
        { name: "preferred_name", label: "Preferred Name" },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel" },
        { name: "dob", label: "Date of Birth", type: "date" },
        { name: "mmid", label: "MMID" },
        { name: "group_id", label: "Group Account", type: "select", options: groups.map((g) => ({ value: g.id, label: g.name })) },
        { name: "membership_status", label: "Membership Status", type: "select", options: MEMBERSHIP_STATUSES },
        { name: "membership_type", label: "Membership Type", type: "select", options: MEMBERSHIP_TYPES },
        { name: "membership_start_date", label: "Membership Start Date", type: "date" },
        { name: "orientation_date", label: "New Member Orientation Completion Date", type: "date" },
        { name: "member_owner", label: "Member Owner" },
        { name: "bio", label: "Member Bio", type: "textarea" },
      ],
    },
    emergency,
    address("Address Information"),
    {
      title: "24 Hour Access",
      note: "Completed as the member progresses through 24-hour access training; not required at sign-up.",
      fields: [
        { name: "access24_status", label: "24 Hour Access Status", type: "select", options: ACCESS24_STATUSES },
        { name: "access24_response_date", label: "24 Hour Access Response Date", type: "date" },
        { name: "coi_end_date", label: "COI End Date", type: "date" },
        { name: "eoc_rating", label: "EOC Rating" },
        { name: "hazmat_training_date", label: "Hazardous Materials Training", type: "date" },
        { name: "compressed_gas_training_date", label: "Compressed Gas Training", type: "date" },
        { name: "paint_booth_training_date", label: "Paint Booth Safety Training", type: "date" },
        { name: "access24_onboarding_date", label: "24 Hour Access Onboarding Completion", type: "date" },
      ],
    },
    {
      title: "Business Information",
      fields: [
        { name: "business_name", label: "Business Name" },
        { name: "business_website", label: "Business Website", type: "url" },
        { name: "business_social", label: "Business Social Handles" },
      ],
    },
    {
      title: "NFAS Information",
      note: "Populated once the member is added to the access-control system and issued a badge.",
      fields: [
        { name: "badge_number", label: "Badge Number" },
        { name: "access_level", label: "Access Level" },
        { name: "last_visit", label: "Last Visit", type: "date" },
      ],
    },
  ];
}
