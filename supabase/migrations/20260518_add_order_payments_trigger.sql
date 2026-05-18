-- Migration: Add trigger to update orders.paid_amount and payment_status automatically when order_payments are modified
CREATE OR REPLACE FUNCTION public.update_order_paid_amount()
RETURNS TRIGGER AS $$
DECLARE
    total_paid numeric;
    o_total_amount numeric;
    target_order_id uuid;
BEGIN
    -- Determine target order ID depending on event type
    IF TG_OP = 'DELETE' THEN
        target_order_id := OLD.order_id;
    ELSE
        target_order_id := NEW.order_id;
    END IF;

    -- Calculate the sum of all payments for this order
    SELECT COALESCE(SUM(amount), 0)
    INTO total_paid
    FROM public.order_payments
    WHERE order_id = target_order_id;

    -- Get total amount from orders table
    SELECT total_amount
    INTO o_total_amount
    FROM public.orders
    WHERE id = target_order_id;

    -- Update paid_amount and payment_status on orders
    UPDATE public.orders
    SET 
        paid_amount = total_paid,
        payment_status = CASE 
            WHEN total_paid >= o_total_amount - 1 THEN 'paid'
            ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = target_order_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists to prevent duplicate execution errors
DROP TRIGGER IF EXISTS tr_update_order_paid_amount ON public.order_payments;

CREATE TRIGGER tr_update_order_paid_amount
AFTER INSERT OR UPDATE OR DELETE
ON public.order_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_order_paid_amount();
