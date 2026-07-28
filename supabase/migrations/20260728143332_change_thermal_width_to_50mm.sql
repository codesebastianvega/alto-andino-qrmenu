alter table public.restaurant_settings
  drop constraint if exists restaurant_settings_thermal_paper_width_check;

update public.restaurant_settings
set thermal_paper_width = '50'
where thermal_paper_width = '58';

alter table public.restaurant_settings
  add constraint restaurant_settings_thermal_paper_width_check
  check (thermal_paper_width in ('80', '50'));
