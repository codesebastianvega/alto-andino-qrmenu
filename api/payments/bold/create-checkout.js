// api/payments/bold/create-checkout.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({ error: 'orderId requerido' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id,total_cop')
    .eq('id', orderId)
    .single();
  if (orderError || !order) return res.status(404).json({ error: 'Orden no encontrada' });

  const payload = {
    amount: order.total_cop,
    currency: 'COP',
    description: `Pedido ${orderId}`,
    redirect_url: `${process.env.PUBLIC_BASE_URL}/checkout/success?orderId=${orderId}`,
    webhook_url: `${process.env.PUBLIC_BASE_URL}/api/payments/bold/webhook`,
  };

  try {
    const response = await fetch(`${process.env.BOLD_BASE_URL}/checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.BOLD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return res.status(200).json({ checkout_url: data.checkout_url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Bold error' });
  }
}
