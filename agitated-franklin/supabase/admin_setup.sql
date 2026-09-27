-- =====================================================================
-- ARES — Supabase PostgreSQL Admin Users & Auth Setup Script
-- Execute this script in your Supabase SQL Editor
-- =====================================================================

-- 1. Create Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Stored as bcrypt/sha256 hash
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) DEFAULT 'CLASSIFIED_ADMIN',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON public.admin_users(username);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public select for login verification
CREATE POLICY "Allow public select on admin_users for auth" ON public.admin_users FOR SELECT USING (true);

-- 2. Insert Default Admin User Record
-- Default Username: admin
-- Default Password: admin123 (sha256: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9)
INSERT INTO public.admin_users (username, password_hash, full_name, role)
VALUES (
    'admin',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    'Commander Operational Access',
    'CLASSIFIED_ADMIN'
)
ON CONFLICT (username) DO NOTHING;

-- =====================================================================
-- End of Admin Setup Script
-- =====================================================================
