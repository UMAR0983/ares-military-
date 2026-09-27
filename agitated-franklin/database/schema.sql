-- =====================================================================
-- ARES — Advanced Reconnaissance and Event Security System
-- Supabase Database Schema (PostgreSQL v3.0)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. System Events Table (Telemetry Snapshots)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type VARCHAR(50) NOT NULL,
    sector_id VARCHAR(50) NOT NULL,
    cpu_usage FLOAT NOT NULL DEFAULT 0.0,
    memory_usage FLOAT NOT NULL DEFAULT 0.0,
    active_processes INT NOT NULL DEFAULT 0,
    details JSONB DEFAULT '{}'::jsonb
);

-- ---------------------------------------------------------------------
-- 2. Alert Logs Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alert_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL', 'EMERGENCY')),
    source_module VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    sector_id VARCHAR(50),
    resolved BOOLEAN DEFAULT FALSE,
    payload JSONB DEFAULT '{}'::jsonb
);

-- ---------------------------------------------------------------------
-- 3. Custom Monitored Clusters Table (User Defined)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.custom_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_code VARCHAR(30) UNIQUE NOT NULL,
    cluster_name VARCHAR(100) NOT NULL,
    ip_range VARCHAR(50) NOT NULL,
    sector_x FLOAT DEFAULT 250.0,
    sector_y FLOAT DEFAULT 250.0,
    priority VARCHAR(20) DEFAULT 'HIGH',
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 4. Tactical Response Team Members Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    voice_passphrase TEXT DEFAULT 'ARES AUTHORIZE DISPATCH',
    role VARCHAR(30) DEFAULT 'TACTICAL_RESPONDER',
    assigned_cluster_code VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 5. Attack & Injection Security Audit Logs Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attack_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attack_code VARCHAR(50) NOT NULL, -- e.g., 'SYN_FLOOD_ATTACK', 'DEADLOCK_LOCKUP'
    target_cluster_code VARCHAR(30) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    injected_by VARCHAR(50) NOT NULL,
    injected_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(30) DEFAULT 'ACTIVE_THREAT', -- 'ACTIVE_THREAT', 'MITIGATED'
    payload JSONB DEFAULT '{}'::jsonb
);

-- ---------------------------------------------------------------------
-- 6. Generated Incident & OS Audit Reports Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incident_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_code VARCHAR(50) UNIQUE NOT NULL,
    attack_id UUID REFERENCES public.attack_logs(id),
    target_cluster_code VARCHAR(30) NOT NULL,
    summary TEXT NOT NULL,
    dispatched_team_id VARCHAR(30),
    cpu_snapshot FLOAT DEFAULT 0.0,
    memory_snapshot FLOAT DEFAULT 0.0,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(30) DEFAULT 'DISPATCHED'
);

-- RLS Policies
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attack_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select all" ON public.system_events FOR SELECT USING (true);
CREATE POLICY "Allow public select alerts" ON public.alert_logs FOR SELECT USING (true);
CREATE POLICY "Allow public select clusters" ON public.custom_clusters FOR SELECT USING (true);
CREATE POLICY "Allow public select team" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Allow public select attacks" ON public.attack_logs FOR SELECT USING (true);
CREATE POLICY "Allow public select reports" ON public.incident_reports FOR SELECT USING (true);

-- Seed Default Team Member (ID: TEAM-01, Password: team123)
INSERT INTO public.team_members (team_id, name, password_hash, voice_passphrase, role)
VALUES (
    'TEAM-01',
    'Captain Response Officer',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', -- sha256 of team123
    'ARES AUTHORIZE DISPATCH',
    'TACTICAL_RESPONDER'
)
ON CONFLICT (team_id) DO NOTHING;
