-- Seed data for the salon booking app. Loaded by `supabase db reset`.
--
-- Deterministic: no random(). Every id comes from md5('<kind>-<n>') and every
-- "random" choice from arithmetic on row numbers, so each reset produces the
-- same data. Dates are relative to the day of the reset (Africa/Nairobi), so
-- there are always upcoming bookings and free slots.
--
-- Contents
--   Test accounts (password: password123)
--     customer@example.com   test customer, with past and upcoming bookings
--     merchant@example.com   test merchant, owns "Amani Hair Studio"
--   30 venues in Nairobi + 6 in Mombasa and Kisumu (so city search filters)
--   3-6 services per venue, 2-4 staff per venue
--   Weekly working hours for every staff member. Free slots for any of the
--   next 14 days come from get_available_slots(); bookings fill some of them.
--   Bookings: 56 days of history (for analytics) and 14 days ahead (for the
--   calendar), with mock payments for confirmed and completed ones.

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------

-- Creates a confirmed email/password user that can sign in through Supabase
-- Auth. The on_auth_user_created trigger creates the matching profile.
create function pg_temp.seed_user(p_id uuid, p_email text, p_full_name text)
returns void
language sql
as $$
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated',
    p_email, extensions.crypt('password123', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', p_full_name), now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (
    p_id, p_id::text, 'email',
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
    now(), now(), now()
  );
$$;

-- Test accounts
select pg_temp.seed_user('00000000-0000-4000-a000-000000000001', 'customer@example.com', 'Test Customer');
select pg_temp.seed_user('00000000-0000-4000-a000-000000000002', 'merchant@example.com', 'Test Merchant');

-- 20 more customers who make the generated bookings
select pg_temp.seed_user(
  md5('customer-' || n)::uuid,
  format('customer%s@example.com', lpad(n::text, 2, '0')),
  (array['Wanjiru Kamau', 'Brian Otieno', 'Akinyi Odhiambo', 'Kevin Mwangi', 'Faith Chebet',
         'Dennis Kiprop', 'Mercy Njeri', 'Collins Omondi', 'Grace Wambui', 'Ian Kariuki',
         'Purity Atieno', 'Victor Mutua', 'Esther Wairimu', 'Samuel Njoroge', 'Lucy Jeptoo',
         'Martin Ochieng', 'Joy Nyambura', 'Felix Kimani', 'Ann Muthoni', 'Peter Kibet'])[n]
) from generate_series(1, 20) n;

-- 6 more merchants who own the other venues
select pg_temp.seed_user(
  md5('merchant-' || n)::uuid,
  format('merchant%s@example.com', lpad(n::text, 2, '0')),
  (array['Nyokabi Gitau', 'Hassan Abdi', 'Rose Adhiambo', 'Daniel Kiplagat', 'Sharon Waithera', 'Omar Salim'])[n]
) from generate_series(1, 6) n;

update public.profiles
   set role = 'merchant'
 where id = '00000000-0000-4000-a000-000000000002'
    or id in (select md5('merchant-' || n)::uuid from generate_series(1, 6) n);

update public.profiles
   set phone = '+2547' || lpad((10000000 + abs(hashtext(id::text)) % 89999999)::text, 8, '0');

-- ---------------------------------------------------------------------------
-- Venues
-- ---------------------------------------------------------------------------

create temp table venue_seed (n int, name text, category public.venue_category, city text, area text);

insert into venue_seed (n, name, category, city, area) values
  -- Nairobi (venue 1 belongs to the test merchant)
  (1,  'Amani Hair Studio',        'hair',   'Nairobi', 'Westlands'),
  (2,  'Kilimani Cuts',            'barber', 'Nairobi', 'Kilimani'),
  (3,  'Polished Nail Bar',        'nails',  'Nairobi', 'Lavington'),
  (4,  'Utulivu Spa',              'spa',    'Nairobi', 'Karen'),
  (5,  'Glow by Wanjiku',          'makeup', 'Nairobi', 'Kileleshwa'),
  (6,  'Crown & Coils',            'hair',   'Nairobi', 'Hurlingham'),
  (7,  'The Fade Room',            'barber', 'Nairobi', 'Parklands'),
  (8,  'Tips & Toes',              'nails',  'Nairobi', 'Upper Hill'),
  (9,  'Serenity Day Spa',         'spa',    'Nairobi', 'Runda'),
  (10, 'Braids by Achieng',        'hair',   'Nairobi', 'South B'),
  (11, 'Sharp Edge Barbers',       'barber', 'Nairobi', 'CBD'),
  (12, 'Lash Lounge Nairobi',      'makeup', 'Nairobi', 'Westlands'),
  (13, 'Natural Roots Salon',      'hair',   'Nairobi', 'Kilimani'),
  (14, 'Mvuli Wellness',           'spa',    'Nairobi', 'Gigiri'),
  (15, 'Gloss Nail Studio',        'nails',  'Nairobi', 'Kileleshwa'),
  (16, 'Kinyozi Classic',          'barber', 'Nairobi', 'Eastleigh'),
  (17, 'Silk Press Studio',        'hair',   'Nairobi', 'Lavington'),
  (18, 'Bridal Beauty Co.',        'makeup', 'Nairobi', 'Karen'),
  (19, 'Locs & Twists',            'hair',   'Nairobi', 'Langata'),
  (20, 'Gentlemen''s Corner',      'barber', 'Nairobi', 'Upper Hill'),
  (21, 'Lavender Spa',             'spa',    'Nairobi', 'Spring Valley'),
  (22, 'Nail Art Kenya',           'nails',  'Nairobi', 'Parklands'),
  (23, 'Mane Attraction',          'hair',   'Nairobi', 'South C'),
  (24, 'Clean Cut Kasarani',       'barber', 'Nairobi', 'Kasarani'),
  (25, 'Radiance Makeup Studio',   'makeup', 'Nairobi', 'Hurlingham'),
  (26, 'Afro Chic Salon',          'hair',   'Nairobi', 'Embakasi'),
  (27, 'Oasis Massage & Spa',      'spa',    'Nairobi', 'Ngong Road'),
  (28, 'Pretty Hands Nail Spa',    'nails',  'Nairobi', 'Ruaka'),
  (29, 'Curl Haven',               'hair',   'Nairobi', 'Kilimani'),
  (30, 'Blade & Brush',            'barber', 'Nairobi', 'Westlands'),
  -- Other cities, so a city search actually filters something out
  (31, 'Pwani Hair Lounge',        'hair',   'Mombasa', 'Nyali'),
  (32, 'Coastline Barbers',        'barber', 'Mombasa', 'Old Town'),
  (33, 'Bahari Spa',               'spa',    'Mombasa', 'Bamburi'),
  (34, 'Lakeside Braids',          'hair',   'Kisumu',  'Milimani'),
  (35, 'Kisumu Nail Studio',       'nails',  'Kisumu',  'CBD'),
  (36, 'Dunga Grooming',           'barber', 'Kisumu',  'Dunga');

insert into public.venues (id, owner_id, name, slug, description, category, city, address, rating, review_count, created_at)
select
  md5('venue-' || v.n)::uuid,
  case when v.n = 1 then '00000000-0000-4000-a000-000000000002'::uuid
       else md5('merchant-' || (1 + (v.n - 2) % 6))::uuid end,
  v.name,
  trim(both '-' from regexp_replace(lower(v.name), '[^a-z0-9]+', '-', 'g')),
  format('%s in %s, %s.',
    case v.category
      when 'hair' then 'Hair styling, braiding and natural hair care'
      when 'barber' then 'Haircuts, fades and beard grooming'
      when 'nails' then 'Manicures, pedicures and nail art'
      when 'spa' then 'Massages, facials and body treatments'
      when 'makeup' then 'Makeup, lashes and brows'
    end, v.area, v.city),
  v.category,
  v.city,
  format('%s, %s, %s', (array['Mpaka Road', 'Argwings Kodhek Road', 'James Gichuru Road', 'Ngong Road', 'Waiyaki Way', 'Kenyatta Avenue', 'Moi Avenue', 'Ring Road'])[1 + v.n % 8], v.area, v.city),
  round((3.8 + (v.n * 7 % 12) / 10.0)::numeric, 1),  -- 3.8 to 4.9
  10 + (v.n * 37) % 390,
  now() - make_interval(days => 400 - v.n * 5)
from venue_seed v;

-- ---------------------------------------------------------------------------
-- Services: a menu per category, price adjusted per venue
-- ---------------------------------------------------------------------------

create temp table service_menu (category public.venue_category, position int, name text, minutes int, price_kes int);

insert into service_menu values
  ('hair', 1, 'Wash & blow-dry', 45, 1500),
  ('hair', 2, 'Women''s cut & style', 60, 2500),
  ('hair', 3, 'Cornrows', 120, 2500),
  ('hair', 4, 'Silk press', 90, 3500),
  ('hair', 5, 'Locs retwist', 120, 3000),
  ('hair', 6, 'Box braids', 240, 6000),
  ('barber', 1, 'Men''s haircut', 30, 800),
  ('barber', 2, 'Beard trim', 20, 500),
  ('barber', 3, 'Haircut & beard', 45, 1200),
  ('barber', 4, 'Kids'' haircut', 30, 600),
  ('barber', 5, 'Hot towel shave', 30, 1000),
  ('nails', 1, 'Gel manicure', 60, 2000),
  ('nails', 2, 'Classic pedicure', 60, 1800),
  ('nails', 3, 'Acrylic full set', 90, 3500),
  ('nails', 4, 'Nail art (per set)', 30, 800),
  ('spa', 1, 'Swedish massage', 60, 4500),
  ('spa', 2, 'Deep tissue massage', 90, 6500),
  ('spa', 3, 'Classic facial', 60, 4000),
  ('spa', 4, 'Body scrub', 45, 3500),
  ('makeup', 1, 'Event makeup', 60, 5000),
  ('makeup', 2, 'Bridal makeup', 120, 12000),
  ('makeup', 3, 'Lash extensions', 90, 4000),
  ('makeup', 4, 'Brow shaping', 30, 1000);

-- Each venue offers the first 3 to all items of its category's menu.
-- Price factor 0.85 to 1.30, rounded to 50 KES.
insert into public.services (id, venue_id, name, description, duration_minutes, price_cents)
select
  md5(format('service-%s-%s', v.n, m.position))::uuid,
  md5('venue-' || v.n)::uuid,
  m.name,
  '',
  m.minutes,
  (round(m.price_kes * (0.85 + (v.n * 13 % 10) * 0.05) / 50) * 50 * 100)::int
from venue_seed v
join service_menu m on m.category = v.category
where m.position <= 3 + (v.n % 4);

-- ---------------------------------------------------------------------------
-- Staff: 2 to 4 per venue (the test merchant's venue has 4)
-- ---------------------------------------------------------------------------

create temp table first_names (i int, name text);
insert into first_names
select row_number() over (), x from unnest(array[
  'Achieng', 'Wanjiru', 'Njeri', 'Akinyi', 'Mwangi', 'Otieno', 'Kamau', 'Wambui', 'Chebet', 'Kiprop',
  'Nyambura', 'Odhiambo', 'Muthoni', 'Kariuki', 'Atieno', 'Mutua', 'Wairimu', 'Omondi', 'Jeptoo', 'Njoroge',
  'Halima', 'Baraka', 'Zawadi', 'Juma', 'Neema', 'Tumaini', 'Imani', 'Amani', 'Rehema', 'Salim'
]) x;

insert into public.staff (id, venue_id, name, title)
select
  md5(format('staff-%s-%s', v.n, s))::uuid,
  md5('venue-' || v.n)::uuid,
  f.name,
  case when s = 1 then 'Senior ' else '' end ||
  case v.category
    when 'hair' then 'Stylist' when 'barber' then 'Barber' when 'nails' then 'Nail Technician'
    when 'spa' then 'Therapist' when 'makeup' then 'Makeup Artist'
  end
from venue_seed v
cross join generate_series(1, 4) s
join first_names f on f.i = 1 + (v.n * 3 + s * 7) % 30
where s <= case when v.n = 1 then 4 else 2 + v.n % 3 end;

-- ---------------------------------------------------------------------------
-- Availability: weekly hours in local time
--   Mon-Sat 09:00-18:00, each staff member has one weekday off.
--   Every third venue also opens Sunday 10:00-16:00.
-- ---------------------------------------------------------------------------

insert into public.availability (staff_id, weekday, start_time, end_time)
select st.id, d,
       case when d = 0 then time '10:00' else time '09:00' end,
       case when d = 0 then time '16:00' else time '18:00' end
from public.staff st
join venue_seed v on md5('venue-' || v.n)::uuid = st.venue_id
cross join generate_series(0, 6) d
where (d between 1 and 6 and d <> 1 + abs(hashtext(st.id::text)) % 6)
   or (d = 0 and v.n % 3 = 0);

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------

-- Test customer: two past visits and one upcoming confirmed booking, inserted
-- first so the generated bookings below work around them.
-- Sundays are skipped (the venues used here are closed), and the staff member
-- is whoever at the venue works that weekday.
with wanted (k, day_offset, at, service_id, status) as (
  values
    (1, -21, time '11:30', md5('service-1-2')::uuid, 'completed'::public.booking_status),
    (2, -7,  time '16:00', md5('service-7-1')::uuid, 'completed'::public.booking_status),
    (3,  5,  time '12:00', md5('service-1-4')::uuid, 'confirmed'::public.booking_status)
),
dated as (
  select w.*, s.venue_id, s.duration_minutes, s.price_cents,
         d0 + case when extract(dow from d0) = 0 then 1 else 0 end as day
  from wanted w
  join public.services s on s.id = w.service_id
  cross join lateral (select (now() at time zone 'Africa/Nairobi')::date + w.day_offset as d0) x
)
insert into public.bookings (id, customer_id, venue_id, service_id, staff_id, starts_at, ends_at, status, price_cents, created_at)
select
  md5('test-booking-' || b.k)::uuid,
  '00000000-0000-4000-a000-000000000001',
  b.venue_id, b.service_id, st.id,
  (b.day + b.at) at time zone 'Africa/Nairobi',
  (b.day + b.at) at time zone 'Africa/Nairobi' + make_interval(mins => b.duration_minutes),
  b.status, b.price_cents,
  now() - make_interval(days => greatest(1, 3 - b.day_offset))
from dated b
cross join lateral (
  select st.id from public.staff st
  join public.availability a on a.staff_id = st.id
   and a.weekday = extract(dow from b.day)
   and a.start_time <= b.at
   and a.end_time >= b.at + make_interval(mins => b.duration_minutes)
  where st.venue_id = b.venue_id
  order by st.id
  limit 1
) st;

-- Generated bookings: for each staff member and day from 56 days ago to 14
-- days ahead (today skipped), consider 10:00 and 14:00. About half of those
-- are booked; more in the past than the future. Only times that fit inside
-- the staff member's hours are used. ON CONFLICT skips any overlap.
with days as (
  select d, (now() at time zone 'Africa/Nairobi')::date + d as day
  from generate_series(-56, 14) d
  where d <> 0
),
candidates as (
  select
    st.id as staff_id, st.venue_id, dy.d, dy.day, t.at,
    abs(hashtext(st.id::text || dy.d || t.at)) as h
  from public.staff st
  cross join days dy
  cross join (values (time '10:00'), (time '14:00')) t(at)
  join public.availability a
    on a.staff_id = st.id and a.weekday = extract(dow from dy.day)
   and a.start_time <= t.at
),
chosen as (
  select c.*
  from candidates c
  where c.h % 100 < case when c.d < 0 then 55 else 35 end
),
with_service as (
  select c.*, s.id as service_id, s.duration_minutes, s.price_cents,
         (c.day + c.at) at time zone 'Africa/Nairobi' as starts_at
  from chosen c
  join lateral (
    select s.* from public.services s
     where s.venue_id = c.venue_id
     order by s.id
     offset (c.h / 100) % (select count(*) from public.services s2 where s2.venue_id = c.venue_id)
     limit 1
  ) s on true
  join public.availability a
    on a.staff_id = c.staff_id and a.weekday = extract(dow from c.day)
   and c.at + make_interval(mins => s.duration_minutes) <= a.end_time
)
insert into public.bookings (id, customer_id, venue_id, service_id, staff_id, starts_at, ends_at, status, price_cents, created_at)
select
  md5(format('booking-%s-%s-%s', w.staff_id, w.d, w.at))::uuid,
  md5('customer-' || (1 + (w.h / 7) % 20))::uuid,
  w.venue_id, w.service_id, w.staff_id,
  w.starts_at,
  w.starts_at + make_interval(mins => w.duration_minutes),
  case
    when w.d < 0 then
      case when (w.h / 13) % 100 < 85 then 'completed'
           when (w.h / 13) % 100 < 93 then 'cancelled'
           else 'no_show' end
    else
      case when (w.h / 13) % 100 < 75 then 'confirmed' else 'pending' end
  end::public.booking_status,
  w.price_cents,
  w.starts_at - make_interval(days => 1 + (w.h / 17) % 10)
from with_service w
order by w.starts_at, w.staff_id
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Payments: mock payment for every confirmed or completed booking
-- ---------------------------------------------------------------------------

insert into public.payments (id, booking_id, amount_cents, status, provider_ref, created_at)
select
  md5('payment-' || b.id)::uuid,
  b.id,
  b.price_cents,
  'succeeded',
  'mock_' || left(md5('ref-' || b.id), 24),
  b.created_at + interval '5 minutes'
from public.bookings b
where b.status in ('confirmed', 'completed');
