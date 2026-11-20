-- Only the two configured customer-facing Boku payment methods are public.
-- Administrative write policies remain unchanged.
create policy boku_checkout_read_payment_methods on public.payment_methods
for select to anon, authenticated
using (
  brand_id = 'a63da806-a62a-49b9-a833-07e0976785ad'::uuid
  and is_active = true
  and id in (
    'e4527833-0104-4ed8-988c-cdcbb634bd02'::uuid,
    'd964a90e-d135-4c14-b6fe-f63910e9dd5b'::uuid
  )
);
