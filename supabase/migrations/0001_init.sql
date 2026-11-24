-- NextFab member platform: replaces Zoho Creator (sign-up form) + Zoho CRM (Leads / Members / Accounts).
-- Run with: supabase db push   (or paste into the Supabase SQL editor)

create extension if not exists pgcrypto;

-- Groups (formerly CRM Accounts)
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_code text not null unique,
  is_subtenant boolean not null default false,
  seats int,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- Maker Series courses
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text not null check (level in ('Beginner','Intermediate','Advanced')),
  start_date date not null,
  end_date date not null,
  status text not null default 'Active' check (status in ('Active','Inactive')),
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint course_dates check (end_date >= start_date)
);

-- Local coupons (only used when Stripe isn't configured; Stripe coupons otherwise)
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  amount_off numeric(10,2),
  percent_off numeric(5,2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint one_discount check ((amount_off is null) <> (percent_off is null))
);

-- Members (formerly CRM Contacts). Email is the unique/duplicate-check field.
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  preferred_name text,
  email text unique check (email = lower(email)),
  phone text,
  dob date,
  mmid text,
  group_id uuid references groups(id) on delete set null,
  photo_path text,
  membership_status text default 'Unpaid',
  membership_type text,
  membership_start_date date,
  orientation_date date,
  member_owner text,
  bio text,
  ec_first_name text, ec_last_name text, ec_phone text,
  address_line1 text, address_line2 text, city text, state text, postal_code text, country text,
  -- 24 hour access
  access24_status text, access24_response_date date, coi_end_date date, eoc_rating text,
  hazmat_training_date date, compressed_gas_training_date date, paint_booth_training_date date, access24_onboarding_date date,
  -- business
  business_name text, business_website text, business_social text,
  -- NFAS
  badge_number text, access_level text, last_visit date,
  -- lead history (copied on conversion)
  lead_source text, lead_date date, referred_by text, tour_guide text, tour_date date,
  converted_from_lead_id uuid,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists junior_members (
  id uuid primary key default gen_random_uuid(),
  parent_member_id uuid not null references members(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  dob date not null,
  ec_phone text,
  status text default 'Pending Review',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  preferred_name text,
  email text unique check (email = lower(email)),
  phone text,
  dob date,
  tour_guide text, tour_date date,
  lead_owner text, lead_status text default 'New', lead_type text, lead_source text, lead_date date,
  ec_first_name text, ec_last_name text, ec_phone text,
  referred_by text,
  address_line1 text, address_line2 text, city text, state text, postal_code text, country text,
  business_name text, business_website text, business_social text,
  notes text,
  converted_at timestamptz,
  converted_member_id uuid references members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
alter table members drop constraint if exists members_converted_from_lead_fk;
alter table members add constraint members_converted_from_lead_fk foreign key (converted_from_lead_id) references leads(id) on delete set null;

create table if not exists lead_visits (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  visited_at timestamptz not null,
  host_member text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  status text not null,
  changed_by text,
  lead_type text, lead_source text, lead_owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- Sign-ups (formerly the Creator "New Membership Agreement Form" records)
create table if not exists signups (
  id uuid primary key default gen_random_uuid(),
  resume_token text not null unique,
  type text not null check (type in ('membership','group','maker-series')),
  plan text, discount_type text, discount_plan text, discount_proof_link text, discount_proof_path text,
  addon_credits boolean default false, addon_adobe boolean default false, addon_shipping boolean default false, addon_access24 boolean default false,
  coupon_code text,
  group_id uuid references groups(id),
  course_id uuid references courses(id),
  course_name text,
  quote_lines jsonb not null default '[]',
  subtotal numeric(10,2) not null default 0,
  coupon_discount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  interval text,
  first_name text not null, last_name text not null, preferred_name text,
  email text not null, phone text not null, dob date not null,
  photo_path text,
  address_line1 text, address_line2 text, city text, state text, postal_code text, country text,
  ec_first_name text, ec_last_name text, ec_phone text,
  signature_path text, signed_at timestamptz, terms_version text, signer_ip text,
  status text not null default 'submitted' check (status in ('submitted','pending_payment','paid','complete','error')),
  integration_status text default 'Pending',
  integration_error text,
  member_id uuid references members(id) on delete set null,
  stripe_customer_id text, stripe_session_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists signups_email_idx on signups(email);
create index if not exists signups_status_idx on signups(status);
create index if not exists signups_member_idx on signups(member_id);
create index if not exists leads_status_idx on leads(lead_status);
create index if not exists members_status_idx on members(membership_status);

-- Lock everything down: the app talks to Postgres with the service-role key from
-- the server only. No anon access to member PII.
alter table groups enable row level security;
alter table courses enable row level security;
alter table coupons enable row level security;
alter table members enable row level security;
alter table junior_members enable row level security;
alter table leads enable row level security;
alter table lead_visits enable row level security;
alter table lead_status_history enable row level security;
alter table signups enable row level security;

-- Private bucket for member photos, proof uploads and signatures
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-files', 'member-files', false, 5242880, array['image/png','image/jpeg','image/gif','application/pdf'])
on conflict (id) do nothing;
