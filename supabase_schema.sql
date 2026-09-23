-- ========================================================
-- INVOICELY SUPABASE POSTGRESQL SCHEMA
-- Copy & Paste this entire script into your Supabase SQL Editor
-- ========================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  upi_id TEXT DEFAULT 'hemantmeena2005@oksbi',
  upi_name TEXT,
  upi_qr_code TEXT,
  business_name TEXT,
  business_phone TEXT,
  business_address TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Migration for existing installations:
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS upi_id TEXT DEFAULT 'hemantmeena2005@oksbi';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS upi_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS upi_qr_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS business_phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS business_address TEXT;

-- 2. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb NOT NULL,
  subtotal NUMERIC(12, 2) DEFAULT 0 NOT NULL,
  tax_rate NUMERIC(5, 2) DEFAULT 0 NOT NULL,
  tax_amount NUMERIC(12, 2) DEFAULT 0 NOT NULL,
  total NUMERIC(12, 2) DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'draft' NOT NULL, -- draft, sent, paid, overdue
  issue_date TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  terms TEXT,
  paid_at TIMESTAMPTZ,
  email_status TEXT DEFAULT 'not_sent', -- not_sent, sent, delivered, failed
  last_emailed_at TIMESTAMPTZ,
  email_logs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Migration for invoices reminder schedule:
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS reminder_schedule TEXT DEFAULT 'off';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS next_reminder_at TIMESTAMPTZ;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS reminder_count INT DEFAULT 0;

-- 4. INDEXES FOR HIGH-SPEED QUERIES
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon/service_role in Next.js Server API
CREATE POLICY "Allow all access to users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all access to clients" ON public.clients FOR ALL USING (true);
CREATE POLICY "Allow all access to invoices" ON public.invoices FOR ALL USING (true);
