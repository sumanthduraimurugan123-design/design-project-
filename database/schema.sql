-- =========================================================
-- GLOBAL INTEL & TELEMETRY (UGI) - SUPABASE POSTGRESQL SCHEMA
-- Complete production schema for users, news, alerts, and logs
-- =========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    persona TEXT NOT NULL CHECK (persona IN ('Analyst', 'Casual user', 'Accessibility mode')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. NEWS TABLE
CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    country TEXT NOT NULL,
    topic TEXT NOT NULL,
    source TEXT,
    sentiment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast query by country and topic
CREATE INDEX IF NOT EXISTS idx_news_country ON public.news(country);
CREATE INDEX IF NOT EXISTS idx_news_topic ON public.news(topic);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON public.news(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_url ON public.news(url);

-- 3. ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    country TEXT NOT NULL,
    source_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_country ON public.alerts(country);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);

-- 4. LOGS TABLE
CREATE TABLE IF NOT EXISTS public.logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_action TEXT NOT NULL,
    persona TEXT,
    metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON public.logs(timestamp DESC);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable read and insert permissions for public anonymous key
-- =========================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated read/write access for dashboard operation
DO $$ 
BEGIN
    -- users policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public read on users') THEN
        CREATE POLICY "Allow public read on users" ON public.users FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public insert on users') THEN
        CREATE POLICY "Allow public insert on users" ON public.users FOR INSERT WITH CHECK (true);
    END IF;

    -- news policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'news' AND policyname = 'Allow public read on news') THEN
        CREATE POLICY "Allow public read on news" ON public.news FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'news' AND policyname = 'Allow public insert on news') THEN
        CREATE POLICY "Allow public insert on news" ON public.news FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'news' AND policyname = 'Allow public update on news') THEN
        CREATE POLICY "Allow public update on news" ON public.news FOR UPDATE USING (true);
    END IF;

    -- alerts policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'Allow public read on alerts') THEN
        CREATE POLICY "Allow public read on alerts" ON public.alerts FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'Allow public insert on alerts') THEN
        CREATE POLICY "Allow public insert on alerts" ON public.alerts FOR INSERT WITH CHECK (true);
    END IF;

    -- logs policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logs' AND policyname = 'Allow public read on logs') THEN
        CREATE POLICY "Allow public read on logs" ON public.logs FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logs' AND policyname = 'Allow public insert on logs') THEN
        CREATE POLICY "Allow public insert on logs" ON public.logs FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- =========================================================
-- INITIAL SEED DATA FOR SYSTEM INITIALIZATION
-- =========================================================

INSERT INTO public.users (name, persona)
VALUES 
    ('Commander Vance', 'Analyst'),
    ('Elena Rostova', 'Casual user'),
    ('Marcus Chen', 'Accessibility mode')
ON CONFLICT DO NOTHING;

INSERT INTO public.logs (user_action, persona, metadata)
VALUES 
    ('UGI System Initialized', 'Analyst', '{"system_version": "1.0.0", "status": "online"}'::jsonb),
    ('Global Telemetry Sensor Grid Activated', 'Analyst', '{"nodes_connected": 48}'::jsonb)
ON CONFLICT DO NOTHING;
