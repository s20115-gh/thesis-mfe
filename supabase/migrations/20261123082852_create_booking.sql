-- Create a pending booking for the signed-in customer.
--
-- The client sends only service, staff member and start time. Venue, end
-- time and price are set by the prepare_booking trigger, which also rejects
-- past times and times outside working hours. Overlaps are rejected by the
-- bookings_no_overlap exclusion constraint (error code 23P01), which the app
-- shows as "that time was just taken".
--
-- Runs as the caller (security invoker), so the row level security insert
-- policy still applies.
create function public.create_booking(
  p_service_id uuid,
  p_staff_id uuid,
  p_starts_at timestamptz
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  booking_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to book' using errcode = '42501';
  end if;

  -- venue_id, ends_at and price_cents are placeholders here; the trigger
  -- replaces them with values from the service before the row is checked.
  insert into public.bookings (customer_id, service_id, staff_id, starts_at, venue_id, ends_at, price_cents)
  values (
    auth.uid(), p_service_id, p_staff_id, p_starts_at,
    (select s.venue_id from public.services s where s.id = p_service_id),
    p_starts_at, 0
  )
  returning id into booking_id;

  return booking_id;
end;
$$;

revoke execute on function public.create_booking(uuid, uuid, timestamptz) from public, anon;
grant execute on function public.create_booking(uuid, uuid, timestamptz) to authenticated;
