-- Venue search for the Discovery feature.
--
-- One RPC per search, so every configuration makes exactly the same request
-- and gets rows in exactly the same order (ties are broken down to the id).

-- Escapes LIKE wildcards in user input, so "50%" matches literally.
create function public.like_escape(p_text text)
returns text
language sql
immutable
set search_path = ''
as $$
  select replace(replace(replace(p_text, '\', '\\'), '%', '\%'), '_', '\_');
$$;

-- Search venues by city, category, free text (venue or service name) and
-- minimum rating. Every filter is optional. Sort: 'rating' (default),
-- 'price' (cheapest service first) or 'name'.
create function public.search_venues(
  p_city text default null,
  p_category public.venue_category default null,
  p_text text default null,
  p_min_rating numeric default null,
  p_sort text default 'rating'
)
returns table (
  id uuid,
  name text,
  slug text,
  category public.venue_category,
  city text,
  address text,
  rating numeric,
  review_count integer,
  cover_image_url text,
  min_price_cents integer,
  service_count integer
)
language sql
stable
set search_path = ''
as $$
  with pattern as (
    select case
      when nullif(trim(p_text), '') is null then null
      else '%' || public.like_escape(trim(p_text)) || '%'
    end as value
  )
  select
    v.id, v.name, v.slug, v.category, v.city, v.address, v.rating, v.review_count,
    v.cover_image_url,
    min(s.price_cents)::integer as min_price_cents,
    count(s.id)::integer as service_count
  from public.venues v
  cross join pattern
  left join public.services s on s.venue_id = v.id and s.is_active
  where (nullif(trim(p_city), '') is null or lower(v.city) = lower(trim(p_city)))
    and (p_category is null or v.category = p_category)
    and (p_min_rating is null or v.rating >= p_min_rating)
    and (
      pattern.value is null
      or v.name ilike pattern.value
      or exists (
        select 1 from public.services s2
         where s2.venue_id = v.id and s2.is_active and s2.name ilike pattern.value
      )
    )
  group by v.id
  order by
    case when p_sort = 'price' then min(s.price_cents) end asc nulls last,
    case when p_sort = 'name' then v.name end asc,
    v.rating desc nulls last,
    v.review_count desc,
    v.name asc,
    v.id asc;
$$;

-- Cities that have venues, for the city picker.
create function public.list_cities()
returns table (city text, venue_count integer)
language sql
stable
set search_path = ''
as $$
  select v.city, count(*)::integer
    from public.venues v
   group by v.city
   order by count(*) desc, v.city;
$$;
