// api/payments/bold/webhook.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const payload = req.body || {};
  const { order_id, status, transaction_id, payment_method } = payload;
  if (!order_id) return res.status(400).json({ error: 'order_id requerido' });

  let newStatus = 'failed';
  if (status === 'approved') newStatus = 'paid';
  else if (status === 'canceled') newStatus = 'canceled';

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  await supabase
    .from('orders')
    .update({ status: newStatus, transaction_id, payment_method })
    .eq('id', order_id);

  return res.status(200).json({ received: true });
}
