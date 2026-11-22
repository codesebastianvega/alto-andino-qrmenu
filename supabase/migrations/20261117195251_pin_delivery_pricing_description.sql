-- Version 2 uses pin-distance estimates and excludes elevation entirely.
comment on column public.locations.delivery_pricing_rules is
  'Per-location pin-distance pricing rules. Version 2 enabled=true activates the shared estimated-distance tariff.';
