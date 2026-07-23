-- PocketCoach EU — Location-based Reminders (Productive premium gap)
-- Stores a {lat, lng, radius_meters, label} blob on habits.
-- Triggering happens client-side via the Geolocation API + watchPosition.

alter table public.habits
  add column if not exists reminder_location jsonb;

-- Sanity constraint: when reminder_location is set, it must include the 4 fields
alter table public.habits
  drop constraint if exists habits_reminder_location_shape;

alter table public.habits
  add constraint habits_reminder_location_shape
  check (
    reminder_location is null
    or (
      reminder_location ? 'lat'
      and reminder_location ? 'lng'
      and reminder_location ? 'radius_meters'
      and reminder_location ? 'label'
      and (reminder_location->>'lat')::double precision between -90 and 90
      and (reminder_location->>'lng')::double precision between -180 and 180
      and (reminder_location->>'radius_meters')::integer between 50 and 5000
    )
  );

comment on column public.habits.reminder_location is
  'Geo-triggered reminder: { lat, lng, radius_meters (50-5000), label }';
