-- Initial schema for the salon booking app.
--
-- Tables: profiles, venues, services, staff, availability, bookings, payments.
-- Every configuration (monolith, F2, F4, F8) runs against this same schema.
--
-- Money is stored in the smallest currency unit (KES cents) as integers.
-- Times are timestamptz; each venue has a timezone (Africa/Nairobi).

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('customer', 'merchant');
create type public.venue_category as enum ('hair', 'barber', 'nails', 'spa', 'makeup');
create type public.booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  -- Everyone signs up as a customer. Merchants are set by the seed (or an
  -- admin), never by the client, so nobody can make themselves a merchant.
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

-- Create a profile automatically when someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- venues: salons, barbers, spas
-- ---------------------------------------------------------------------------

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text not null default '',
  category public.venue_category not null,
  city text not null,
  address text not null default '',
  timezone text not null default 'Africa/Nairobi',
  cover_image_url text,
  -- Shown in search results. Seeded values; there is no reviews table.
  rating numeric(2, 1) check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  created_at timestamptz not null default now()
);

create index venues_city_idx on public.venues (lower(city));
create index venues_owner_idx on public.venues (owner_id);

-- ---------------------------------------------------------------------------
-- services: what a venue offers
-- ---------------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  name text not null,
  description text not null default '',
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 480),
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'KES',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index services_venue_idx on public.services (venue_id);

-- ---------------------------------------------------------------------------
-- staff: people who perform services. Any active staff member at a venue can
-- perform any of its services (kept simple on purpose).
-- ---------------------------------------------------------------------------

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  name text not null,
  title text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index staff_venue_idx on public.staff (venue_id);

-- ---------------------------------------------------------------------------
-- availability: weekly working hours per staff member, in the venue's local
-- time. Bookable slots are computed from this minus existing bookings (see
-- get_available_slots). Weekly hours rather than dated slots keep the seed
-- valid whatever day it is loaded.
-- ---------------------------------------------------------------------------

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

create index availability_staff_idx on public.availability (staff_id, weekday);

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete restrict,
  venue_id uuid not null references public.venues (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,
  staff_id uuid not null references public.staff (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.booking_status not null default 'pending',
  -- Copied from the service when booked, so later price changes don't
  -- rewrite history (and analytics stay correct).
  price_cents integer not null check (price_cents >= 0),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- A staff member can't have two active bookings that overlap.
  constraint bookings_no_overlap exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending', 'confirmed'))
);

create index bookings_venue_time_idx on public.bookings (venue_id, starts_at);
create index bookings_customer_time_idx on public.bookings (customer_id, starts_at);

-- Fill in derived fields and validate a new booking. The client sends only
-- service, staff and start time; venue, end time and price come from the
-- database so they can't be faked.
create function public.prepare_booking()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  svc record;
  local_start timestamp;
  local_end timestamp;
  tz text;
begin
  select s.venue_id, s.duration_minutes, s.price_cents, s.is_active, v.timezone
    into svc
    from public.services s
    join public.venues v on v.id = s.venue_id
   where s.id = new.service_id;

  if not found or not svc.is_active then
    raise exception 'Service is not available';
  end if;

  if not exists (
    select 1 from public.staff st
     where st.id = new.staff_id and st.venue_id = svc.venue_id and st.is_active
  ) then
    raise exception 'Staff member does not work at this venue';
  end if;

  new.venue_id := svc.venue_id;
  new.ends_at := new.starts_at + make_interval(mins => svc.duration_minutes);
  new.price_cents := svc.price_cents;

  -- Requests from app users must be in the future and inside working hours.
  -- The seed (no logged-in user) may insert past bookings for analytics.
  if auth.uid() is not null then
    if new.starts_at <= now() then
      raise exception 'Booking must be in the future';
    end if;

    tz := svc.timezone;
    local_start := new.starts_at at time zone tz;
    local_end := new.ends_at at time zone tz;

    if local_start::date <> local_end::date or not exists (
      select 1 from public.availability a
       where a.staff_id = new.staff_id
         and a.weekday = extract(dow from local_start)
         and a.start_time <= local_start::time
         and a.end_time >= local_end::time
    ) then
      raise exception 'Outside the staff member''s working hours';
    end if;
  end if;

  return new;
end;
$$;

create trigger bookings_prepare
  before insert on public.bookings
  for each row execute function public.prepare_booking();

-- ---------------------------------------------------------------------------
-- payments: mock checkout only, no real provider
-- ---------------------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete restrict,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'KES',
  status public.payment_status not null default 'pending',
  provider text not null default 'mock',
  provider_ref text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers used by row level security
-- ---------------------------------------------------------------------------

create function public.is_venue_owner(p_venue_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.venues v
     where v.id = p_venue_id and v.owner_id = auth.uid()
  );
$$;

create function public.is_merchant()
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
     where p.id = auth.uid() and p.role = 'merchant'
  );
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.availability enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;

-- profiles: see your own; merchants see customers who booked at their venue.
create policy "Users read own profile" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "Merchants read their customers" on public.profiles
  for select to authenticated
  using (exists (
    select 1 from public.bookings b
     where b.customer_id = profiles.id and public.is_venue_owner(b.venue_id)
  ));

create policy "Users update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Users may change only their name and phone, not their role.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Catalogue tables: anyone can browse; only the venue owner can change them.
create policy "Anyone reads venues" on public.venues
  for select to anon, authenticated using (true);
create policy "Merchants create own venues" on public.venues
  for insert to authenticated
  with check (owner_id = auth.uid() and public.is_merchant());
create policy "Owners update venues" on public.venues
  for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Anyone reads services" on public.services
  for select to anon, authenticated using (true);
create policy "Owners manage services" on public.services
  for all to authenticated
  using (public.is_venue_owner(venue_id)) with check (public.is_venue_owner(venue_id));

create policy "Anyone reads staff" on public.staff
  for select to anon, authenticated using (true);
create policy "Owners manage staff" on public.staff
  for all to authenticated
  using (public.is_venue_owner(venue_id)) with check (public.is_venue_owner(venue_id));

create policy "Anyone reads availability" on public.availability
  for select to anon, authenticated using (true);
create policy "Owners manage availability" on public.availability
  for all to authenticated
  using (exists (
    select 1 from public.staff st
     where st.id = availability.staff_id and public.is_venue_owner(st.venue_id)
  ))
  with check (exists (
    select 1 from public.staff st
     where st.id = availability.staff_id and public.is_venue_owner(st.venue_id)
  ));

-- bookings: customers see and create their own; owners see their venue's.
create policy "Customers read own bookings" on public.bookings
  for select to authenticated using (customer_id = auth.uid());
create policy "Owners read venue bookings" on public.bookings
  for select to authenticated using (public.is_venue_owner(venue_id));

create policy "Customers create bookings" on public.bookings
  for insert to authenticated
  with check (customer_id = auth.uid() and status = 'pending');

-- Only the status column can be updated (see grant below).
create policy "Customers cancel own bookings" on public.bookings
  for update to authenticated
  using (customer_id = auth.uid() and status in ('pending', 'confirmed'))
  with check (customer_id = auth.uid() and status = 'cancelled');
create policy "Owners update booking status" on public.bookings
  for update to authenticated
  using (public.is_venue_owner(venue_id)) with check (public.is_venue_owner(venue_id));

revoke update on public.bookings from anon, authenticated;
grant update (status) on public.bookings to authenticated;

-- payments: read-only for the customer and the venue owner. Rows are created
-- only by mock_checkout().
create policy "Customers read own payments" on public.payments
  for select to authenticated
  using (exists (
    select 1 from public.bookings b
     where b.id = payments.booking_id and b.customer_id = auth.uid()
  ));
create policy "Owners read venue payments" on public.payments
  for select to authenticated
  using (exists (
    select 1 from public.bookings b
     where b.id = payments.booking_id and public.is_venue_owner(b.venue_id)
  ));

revoke insert, update, delete on public.payments from anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC: free slots for a service on a given day
-- ---------------------------------------------------------------------------

-- Returns every start time (30-minute steps) at which some staff member is
-- working and free for the whole service duration. Runs as definer because it
-- must see other customers' bookings to exclude busy times; it returns only
-- staff ids and times, nothing personal.
create function public.get_available_slots(p_service_id uuid, p_day date)
returns table (staff_id uuid, starts_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with svc as (
    select s.venue_id, s.duration_minutes, v.timezone
      from public.services s
      join public.venues v on v.id = s.venue_id
     where s.id = p_service_id and s.is_active
  ),
  windows as (
    select a.staff_id,
           (p_day + a.start_time) at time zone svc.timezone as win_start,
           (p_day + a.end_time) at time zone svc.timezone as win_end,
           make_interval(mins => svc.duration_minutes) as duration
      from svc
      join public.staff st on st.venue_id = svc.venue_id and st.is_active
      join public.availability a on a.staff_id = st.id
     where a.weekday = extract(dow from p_day)
  ),
  candidates as (
    select w.staff_id, gs as starts_at, gs + w.duration as ends_at
      from windows w,
           generate_series(w.win_start, w.win_end - w.duration, interval '30 minutes') gs
  )
  select c.staff_id, c.starts_at
    from candidates c
   where c.starts_at > now()
     and not exists (
       select 1 from public.bookings b
        where b.staff_id = c.staff_id
          and b.status in ('pending', 'confirmed')
          and tstzrange(b.starts_at, b.ends_at) && tstzrange(c.starts_at, c.ends_at)
     )
   order by c.starts_at, c.staff_id;
$$;

-- ---------------------------------------------------------------------------
-- RPC: mock checkout
-- ---------------------------------------------------------------------------

-- Pays for a pending booking: records a succeeded mock payment and confirms
-- the booking, in one transaction.
create function public.mock_checkout(p_booking_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  b record;
  payment_id uuid;
begin
  select id, price_cents
    into b
    from public.bookings
   where id = p_booking_id
     and customer_id = auth.uid()
     and status = 'pending'
   for update;

  if not found then
    raise exception 'Booking not found or not awaiting payment';
  end if;

  insert into public.payments (booking_id, amount_cents, status, provider_ref)
  values (b.id, b.price_cents, 'succeeded', 'mock_' || replace(gen_random_uuid()::text, '-', ''))
  returning id into payment_id;

  update public.bookings set status = 'confirmed' where id = b.id;

  return payment_id;
end;
$$;

revoke execute on function public.mock_checkout(uuid) from public, anon;
grant execute on function public.mock_checkout(uuid) to authenticated;
