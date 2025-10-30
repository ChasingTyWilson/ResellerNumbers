-- ============================================
-- FIX PROFILES INSERT POLICY
-- Run this in your Supabase SQL Editor
-- This allows service role to create profiles
-- ============================================

-- Allow service role to insert profiles
CREATE POLICY "Allow service role to insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Allow service role to do everything (in case we need it)
CREATE POLICY "Allow service role full access" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Grant INSERT permission to service role (as backup)
GRANT INSERT ON public.profiles TO service_role;

