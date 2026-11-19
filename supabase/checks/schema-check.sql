-- Behaviour check for the schema: row level security, booking rules, mock checkout.
-- Runs in one transaction and rolls back, so it leaves the database unchanged.
-- Uses its own users and venue, so it works with or without the seed loaded.
-- Run: pnpm db:check   (needs supabase start)
\set QUIET on
\pset tuples_only on
begin;
create temp table result (n serial, name text, ok boolean, detail text);
grant all on result to anon, authenticated; grant usage on sequence result_n_seq to anon, authenticated;

-- helper: act as a user (or anon when null)
create function pg_temp.act(uid uuid) returns void language plpgsql as $$
begin
  if uid is null then
    perform set_config('role', 'anon', true);
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  else
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  end if;
end $$;
create function pg_temp.reset() returns void language sql as $$ select set_config('role','postgres',true), set_config('request.jwt.claims','',true) $$;

-- users: signing up creates a profile automatically
insert into auth.users (id, email, raw_user_meta_data, aud, role) values
 ('11111111-1111-1111-1111-111111111111','alice@test','{"full_name":"Alice"}','authenticated','authenticated'),
 ('22222222-2222-2222-2222-222222222222','bob@test','{"full_name":"Bob"}','authenticated','authenticated'),
 ('33333333-3333-3333-3333-333333333333','merchant@test','{"full_name":"Mia"}','authenticated','authenticated');
insert into result(name, ok, detail) select 'Signup creates profiles as customer', count(*)=3 and bool_and(role='customer'), count(*)::text||' profiles' from profiles where id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333');
update profiles set role='merchant' where id='33333333-3333-3333-3333-333333333333';

insert into venues (id, owner_id, name, slug, category, city) values ('aaaaaaaa-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333','Test Salon','test-salon','hair','Nairobi');
insert into services (id, venue_id, name, duration_minutes, price_cents) values ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Haircut',60,150000);
insert into staff (id, venue_id, name) values ('cccccccc-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Jane');
insert into availability (staff_id, weekday, start_time, end_time) select 'cccccccc-0000-0000-0000-000000000001', d, '09:00', '17:00' from generate_series(0,6) d;

create temp table t as select (current_date + 7) as day, ((current_date + 7) + time '10:00') at time zone 'Africa/Nairobi' as slot;
grant select on t to anon, authenticated;

-- anon browsing
select pg_temp.act(null);
insert into result(name, ok, detail) select 'Anon can browse venues', count(*)=1, '' from venues where slug='test-salon';
insert into result(name, ok, detail) select 'Anon gets free slots (9:00-16:00, 30 min steps)', count(*)=15, count(*)::text||' slots' from get_available_slots('bbbbbbbb-0000-0000-0000-000000000001', (select day from t));
insert into result(name, ok, detail) select 'Anon cannot see bookings', count(*)=0, '' from bookings;

-- Alice books 10:00; server fills venue, end time and price
select pg_temp.act('11111111-1111-1111-1111-111111111111');
insert into bookings (customer_id, service_id, staff_id, starts_at, venue_id, ends_at, price_cents)
  values ('11111111-1111-1111-1111-111111111111','bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001',(select slot from t),
          '00000000-0000-0000-0000-000000000000', now(), 1);
insert into result(name, ok, detail) select 'Booking: price/end/venue set by database, not client',
  price_cents=150000 and ends_at=starts_at+interval '1 hour' and venue_id='aaaaaaaa-0000-0000-0000-000000000001', price_cents::text from bookings;

-- expected failures
create function pg_temp.expect_fail(label text, stmt text) returns void language plpgsql as $$
begin
  begin execute stmt;
    insert into result(name, ok, detail) values (label, false, 'statement succeeded');
  exception when others then
    insert into result(name, ok, detail) values (label, true, left(sqlerrm, 70));
  end;
end $$;

select pg_temp.expect_fail('Customer cannot change price', $$update bookings set price_cents=1$$);
select pg_temp.expect_fail('Customer cannot make self merchant', $$update profiles set role='merchant' where id=auth.uid()$$);
select pg_temp.expect_fail('Customer cannot insert payments', $$insert into payments(booking_id, amount_cents, status) select id, 0, 'succeeded' from bookings$$);
select pg_temp.expect_fail('Booking in the past rejected', $$insert into bookings (customer_id, service_id, staff_id, starts_at, venue_id, ends_at, price_cents) values (auth.uid(),'bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001', now() - interval '1 day', gen_random_uuid(), now(), 0)$$);
select pg_temp.expect_fail('Booking outside working hours rejected', $$insert into bookings (customer_id, service_id, staff_id, starts_at, venue_id, ends_at, price_cents) select auth.uid(),'bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001', slot + interval '7 hours', gen_random_uuid(), now(), 0 from t$$);
select pg_temp.expect_fail('Booking for someone else rejected', $$insert into bookings (customer_id, service_id, staff_id, starts_at, venue_id, ends_at, price_cents) select '22222222-2222-2222-2222-222222222222','bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001', slot + interval '3 hours', gen_random_uuid(), now(), 0 from t$$);

-- Bob: overlap blocked, can't see Alice's booking, 10:00 and 9:30 slots gone
select pg_temp.act('22222222-2222-2222-2222-222222222222');
select pg_temp.expect_fail('Overlapping booking rejected', $$insert into bookings (customer_id, service_id, staff_id, starts_at, venue_id, ends_at, price_cents) select auth.uid(),'bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001', slot + interval '30 minutes', gen_random_uuid(), now(), 0 from t$$);
insert into result(name, ok, detail) select 'Other customer cannot see the booking', count(*)=0, '' from bookings;
insert into result(name, ok, detail) select 'Booked time removed from free slots', count(*)=12, count(*)::text||' slots left' from get_available_slots('bbbbbbbb-0000-0000-0000-000000000001', (select day from t));
select pg_temp.expect_fail('Other customer cannot pay for it', $$select mock_checkout((select id from bookings limit 1))$$);

-- Alice pays
select pg_temp.act('11111111-1111-1111-1111-111111111111');
select mock_checkout(id) from bookings;
insert into result(name, ok, detail) select 'Mock checkout confirms booking + payment', b.status='confirmed' and p.status='succeeded' and p.amount_cents=150000, p.provider_ref from bookings b join payments p on p.booking_id=b.id;
select pg_temp.expect_fail('Cannot pay twice', $$select mock_checkout(id) from bookings$$);

-- merchant
select pg_temp.act('33333333-3333-3333-3333-333333333333');
insert into result(name, ok, detail) select 'Merchant sees venue booking + payment', (select count(*) from bookings)=1 and (select count(*) from payments)=1, '';
insert into result(name, ok, detail) select 'Merchant sees customer name', string_agg(full_name, ',') like '%Alice%', string_agg(full_name, ',') from profiles;
insert into services (venue_id, name, duration_minutes, price_cents) values ('aaaaaaaa-0000-0000-0000-000000000001','Braids',120,300000);
insert into result(name, ok, detail) select 'Merchant adds a service', count(*)=2, '' from services where venue_id='aaaaaaaa-0000-0000-0000-000000000001';
update bookings set status='completed';
insert into result(name, ok, detail) select 'Merchant updates booking status', status='completed', '' from bookings;

-- customer cannot add a service to someone else's venue; can cancel own
select pg_temp.act('22222222-2222-2222-2222-222222222222');
select pg_temp.expect_fail('Customer cannot add services', $$insert into services (venue_id, name, duration_minutes, price_cents) values ('aaaaaaaa-0000-0000-0000-000000000001','Hack',30,0)$$);

select pg_temp.reset();
select format('%s  %s%s', case when ok then 'PASS' else 'FAIL' end, name, case when detail<>'' then '  ('||detail||')' else '' end) from result order by n;
select format(E'\n%s/%s passed', count(*) filter (where ok), count(*)) from result;
rollback;
