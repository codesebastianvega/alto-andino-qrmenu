-- Preparation only: these rules do not activate automatic road-distance pricing.
-- Existing locations policies govern access to this additive configuration field.
alter table public.locations
  add column if not exists delivery_pricing_rules jsonb;

alter table public.locations
  add constraint locations_delivery_pricing_rules_object
  check (delivery_pricing_rules is null or jsonb_typeof(delivery_pricing_rules) = 'object');

comment on column public.locations.delivery_pricing_rules is
  'Draft per-location road-distance and ascent pricing rules. Not an activation flag.';
