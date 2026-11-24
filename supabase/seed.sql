insert into groups (name, group_code, is_subtenant) values
  ('Drexel University Makers', 'DREXEL-2026', false),
  ('Philly Woodworkers Collective', 'PWC-01', false),
  ('Studio 4 Subtenants', 'STUDIO4-SUB', true)
on conflict do nothing;

insert into courses (name, level, start_date, end_date, slug, description) values
  ('Intro to Woodworking (Beginner)', 'Beginner', current_date + 14, current_date + 56, 'intro-woodworking', 'Four weeks from first cut to finished cutting board.'),
  ('Build Your Own Pathway', 'Intermediate', current_date + 21, current_date + 80, 'build-your-own-pathway', 'Up to 4 classes plus one-on-one project time.'),
  ('Create Your Own Workwear Jacket', 'Intermediate', current_date + 30, current_date + 60, 'workwear-jacket', 'Studio orientation, material prep, assembly and finishing.')
on conflict do nothing;

insert into coupons (code, amount_off, percent_off) values ('WELCOME25', 25, null), ('MAKER10', null, 10) on conflict do nothing;
