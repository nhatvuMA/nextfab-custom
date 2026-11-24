# NextFab: Zoho replacement prototype

This is a Next.js 15 and Supabase app. It replaces the **Zoho Creator** sign-up form and the **Zoho CRM** Leads, Members and Accounts modules that are described in *NextFab Member Sign-Up & CRM Walkthrough*. The public pages copy the look of nextfab.com.

```bash
npm install
npm run dev -- -p 3005     # http://localhost:3005
```

The app runs with **no setup**. Without Supabase or Stripe keys, it stores data in `.data/db.json` and `.data/uploads/`, and it shows a demo checkout page instead of Stripe. Seed groups, courses, coupons (`WELCOME25`, `MAKER10`) and leads are created on first run.

Staff CRM: `/admin`. The password is `nextfab`, or whatever you set in `ADMIN_PASSWORD`.

## Pages

| Path | Replaces |
|---|---|
| `/`, `/join` | nextfab.com home and Join pages (same layout, copy and images) |
| `/join/membership-sign-up?type=membership\|group\|maker-series` | The Creator *New Membership Agreement Form*. The URL is the same as today. |
| `/join/junior` | Junior Membership Form (ages 10–17) |
| `/join/24-hour-access` | **New.** Active members request 24-hour access (no Zoho equivalent) |
| `/tour`, footer contact, newsletter | Zoho Forms. These now create **Leads** directly. |
| `/admin/signups` | Creator records, plus Integration Status/Error with a **Retry** button |
| `/admin/leads` | CRM Leads: create, status history, visit log, **Convert**, with duplicate check and merge |
| `/admin/members` | CRM Members (Contacts), with every section from B.4 |
| `/admin/groups` | CRM Accounts. Feeds the Group ID dropdown and has a Subtenant flag. |
| `/admin/courses` | Maker Series course set-up, date rules, registration link, Close course |
| `/admin/access24` | **New.** 24-hour access queue: safety calls, trainings, insurance certificate, approval checklist |

## What changed from the Zoho setup

1. **No iframe.** The sign-up form is part of the site. The Zoho embed on nextfab.com currently loads as a blank white box.
2. **The server sets the price.** Plan, add-on, course and coupon prices are recalculated on the server from `src/lib/pricing.ts`. The amount the browser sends is ignored. (Tested: a submission claiming `total=1` was still charged $146.70.)
3. **One database.** Sign-ups, Members, Leads and Groups are tables in one Postgres database, so nothing has to sync between Creator and CRM.
4. **Duplicate emails are blocked.** Emails are stored in lowercase and must be unique. Signing up again updates the existing Member.
5. **Leads convert automatically on sign-up.** If someone signs up with an email that matches an open Lead, the Lead is converted and its history (source, referral, tour) moves to the Member.
6. **Safer resume links.** Returning from payment uses a random token. The old link put the raw record ID in the URL, so anyone with the link could see that person's details.
7. **Failures show up for staff.** If an integration step fails, the sign-up is still saved and marked as an error on the dashboard, and staff can retry it. The person sees a plain message instead of losing their entries.
8. **Error messages appear next to the field.** Inputs are no longer wiped. Messages such as "Emails do not match" and "Member age has to be above 18 years" keep their current wording.
9. **Course status is calculated when the page loads.** Courses close by themselves after their end date, with no scheduled job to fall behind.
10. **The signed agreement is kept.** It stores the signature image, time, IP address and terms version, and it has a printable agreement page.

## 24-Hour Access requests

NextFab asked for a way to handle 24-hour member access requests. The PDF only lists the fields on the member record (B.4, "24 Hour Access" and "Safety Call Fulfilment"); nothing fed them.

1. An active member fills in `/join/24-hour-access`: email and date of birth (both must match their membership), what they'll work on, which controlled areas they'll use (hazardous materials, compressed gas, paint booth), their Certificate of Insurance (optional at this point) and agreement to the rules. An unknown email and a wrong date of birth get the same message, so the form can't be used to look up who is a member.
2. Staff work the request at `/admin/access24`: log safety calls (staff person, time, EOC decision details), record the EOC rating, the insurance end date, the trainings and the onboarding date.
3. **Approve** stays locked until every checklist item is done, and the server checks the list again when it's clicked. Trainings are only required for the areas the member said they'll use. Approval writes the result onto the member's 24 Hour Access section.
4. The queue page warns when an approved member's insurance ends within 30 days.

Assumptions to confirm with NextFab: only Active members can apply; the three trainings are required only for the matching areas; the rules text is a placeholder; the $49/month is not billed automatically yet (staff add it in Stripe).

Supabase: run `supabase/migrations/0002_access24.sql` after `0001_init.sql`.

## Connecting Supabase

1. Create a project, then run the files in `supabase/migrations/` in order, followed by `supabase/seed.sql` (SQL editor or `supabase db push`).
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Restart. The admin sidebar should show **DB: Supabase**. Files go to the private `member-files` bucket and are viewed through signed URLs.

## Connecting Stripe

Set `STRIPE_SECRET_KEY` (start with test keys). Coupons are then checked against Stripe coupons and promotion codes. Continue creates a Stripe Customer and a Checkout Session: a subscription for monthly or six-month plans, a one-time payment for Maker Series, and setup mode for $0 group sign-ups. Add a webhook to `/api/stripe/webhook` for `checkout.session.completed` and set `STRIPE_WEBHOOK_SECRET`.

## Before production

- Replace the shared staff password with Supabase Auth staff accounts and roles.
- Get the real Terms & Conditions text (the text in the form is a placeholder).
- Decide how 24-Hour Access is billed. Sign-up records "notify me when eligible", and approval does not start billing yet.
- Move images and video off nextfab.com hot-links and into this project. FF DIN is replaced by Barlow, which has an open license.
- Integrations not yet built: QReserve, NFAS, MM3, Jot Form, and moving existing data out of Zoho.
