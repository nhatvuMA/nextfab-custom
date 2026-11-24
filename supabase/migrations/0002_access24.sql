-- 24-Hour Access requests. An existing member asks for 24-hour access; staff run
-- the safety call(s), record trainings and the insurance certificate (COI), then
-- approve or deny. Approval writes the outcome onto the member's
-- "24 Hour Access" section (PDF B.4).

create table if not exists access24_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  status text not null default 'Requested'
    check (status in ('Requested','Safety Call Scheduled','In Onboarding','Approved','Denied','Withdrawn')),
  reason text,
  uses_hazmat boolean not null default false,
  uses_compressed_gas boolean not null default false,
  uses_paint_booth boolean not null default false,
  coi_path text,
  coi_end_date date,
  eoc_rating text,
  agreed_rules_at timestamptz,
  rules_version text,
  signer_ip text,
  decided_by text,
  decided_at timestamptz,
  decision_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- Only one open request per member at a time.
create unique index if not exists access24_one_open_per_member
  on access24_requests(member_id)
  where status in ('Requested','Safety Call Scheduled','In Onboarding');
create index if not exists access24_status_idx on access24_requests(status);

-- "Safety Call Fulfilment" related list: Staff Person + EOC Decision Details, repeatable.
create table if not exists access24_safety_calls (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references access24_requests(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  staff_person text not null,
  called_at timestamptz not null,
  eoc_decision_details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index if not exists access24_calls_request_idx on access24_safety_calls(request_id);

alter table access24_requests enable row level security;
alter table access24_safety_calls enable row level security;
