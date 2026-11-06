-- ==============================================================================
-- ALUNA OS — MÓDULO DE FINANZAS & CONTABILIDAD PRO (ADD-ON)
-- Migración: 20261106150000_create_financial_ledger_and_receivables.sql
-- ==============================================================================

-- 1. TABLA: financial_accounts (Bolsillos y Cuentas del Restaurante)
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'digital_wallet', 'bank', 'credit_card', 'other')),
    account_number TEXT,
    currency TEXT NOT NULL DEFAULT 'COP',
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    initial_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABLA: accounts_receivable (Cartera / Fiados Centralizados)
CREATE TABLE IF NOT EXISTS public.accounts_receivable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    original_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    balance_due NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'cancelled', 'written_off')),
    due_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLA: receivable_payments (Abonos a Cartera)
CREATE TABLE IF NOT EXISTS public.receivable_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    receivable_id UUID NOT NULL REFERENCES public.accounts_receivable(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL,
    notes TEXT,
    is_historical BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA: expenses (Gastos Operativos y Egresos)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('supplies', 'payroll', 'rent', 'utilities', 'maintenance', 'marketing', 'logistics', 'other')),
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    description TEXT NOT NULL,
    beneficiary TEXT,
    receipt_url TEXT,
    payment_method TEXT NOT NULL DEFAULT 'Efectivo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLA: financial_ledger_entries (Libro Mayor Inmutable)
CREATE TABLE IF NOT EXISTS public.financial_ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('debit', 'credit')),
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    balance_after NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT NOT NULL CHECK (reference_type IN ('opening_balance', 'order_sale', 'receivable_collection', 'expense', 'account_transfer', 'shift_adjustment')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_fin_accounts_brand ON public.financial_accounts(brand_id);
CREATE INDEX IF NOT EXISTS idx_acc_receivable_brand_status ON public.accounts_receivable(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_acc_receivable_phone ON public.accounts_receivable(customer_phone);
CREATE INDEX IF NOT EXISTS idx_expenses_brand_date ON public.expenses(brand_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_brand_date ON public.financial_ledger_entries(brand_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_account ON public.financial_ledger_entries(account_id);

-- 7. SEGURIDAD A NIVEL DE FILA (RLS)
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivable_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands manage own financial accounts"
    ON public.financial_accounts FOR ALL TO authenticated
    USING (brand_id IN (SELECT brand_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Brands manage own accounts receivable"
    ON public.accounts_receivable FOR ALL TO authenticated
    USING (brand_id IN (SELECT brand_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Brands manage own receivable payments"
    ON public.receivable_payments FOR ALL TO authenticated
    USING (brand_id IN (SELECT brand_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Brands manage own expenses"
    ON public.expenses FOR ALL TO authenticated
    USING (brand_id IN (SELECT brand_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Brands manage own ledger entries"
    ON public.financial_ledger_entries FOR ALL TO authenticated
    USING (brand_id IN (SELECT brand_id FROM public.profiles WHERE id = auth.uid()));
