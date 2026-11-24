export const LEAD_TYPES = [
  "Space", "Collaborator", "Group Membership", "Artisan Accelerator", "Resident", "Contractor", "Subtenant",
  "Month-to-Month Membership", "Annual Contract Membership", "Six-Month Bundle Membership",
  "Discounted Month-to-Month Membership", "Discounted Annual Contract Membership",
];

export const LEAD_SOURCES = [
  "Contact Us Form", "Space Inquiry Form", "Feedback Form", "Visited a Member", "Member Referral",
  "Artisan Accelerator Application", "Phone Call", "Event Registration", "Event Attendance", "Eventbrite",
  "Instagram", "Facebook", "Twitter", "Other Social Media", "Paid Search (Google Ads)",
  "Organic Search (Google/Bing SEO)", "Newsletters", "Chatbot", "Google AdWords", "Membership Sign-Up Form",
];

export const LEAD_STATUSES = [
  "New", "Contact Us Form", "Tour Scheduled", "Tour Completed", "Visitor", "Member Referral", "Attended Event",
  "Attended Public Workshop", "Space Inquiry", "Artisan Accelerator Applicant", "Phone Call Scheduled",
  "Phone Call Completed", "Pre-Qualified", "Qualified", "Contact in Future", "Contacted", "Submitted Feedback",
  "Not Qualified", "Closed Lead",
];

export const MEMBERSHIP_STATUSES = ["Active", "Inactive", "Unpaid", "Pending Payment", "Cancelled"];

export const MEMBERSHIP_TYPES = [
  "Month-to-Month", "Annual Contract", "Six-Month Bundle", "Discounted Month-to-Month",
  "Discounted Annual Contract", "Group", "Maker Series", "Subtenant",
];

export const ACCESS24_STATUSES = ["Not Requested", "Notify When Eligible", "Requested", "In Onboarding", "Approved", "Denied"];

/** Stages of a 24-hour access request. Approved / Denied / Withdrawn are final. */
export const ACCESS24_REQUEST_STATUSES = ["Requested", "Safety Call Scheduled", "In Onboarding", "Approved", "Denied", "Withdrawn"] as const;
export const ACCESS24_OPEN = ["Requested", "Safety Call Scheduled", "In Onboarding"];
