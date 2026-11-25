import { supabase } from '../config/supabase';
import { isOrderableVisibility } from '../utils/productVisibility';

// Check at the customer's click, including recommendations created before a hide.
export async function canOrderProductNow(productId, brandId, locationId) {
  if (!productId || !brandId) return false;
  const { data: product, error } = await supabase.from('products').select('id,is_active,stock_status').eq('id', productId).eq('brand_id', brandId).maybeSingle();
  if (error || !isOrderableVisibility(product)) return false;
  if (!locationId || locationId === 'all') return true;
  const { data: status, error: statusError } = await supabase.from('location_product_status').select('is_active,stock_status').eq('product_id', productId).eq('location_id', locationId).maybeSingle();
  return !statusError && isOrderableVisibility(product, status);
}
