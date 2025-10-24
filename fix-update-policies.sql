-- ============================================
-- FIX UPDATE POLICIES FOR USER MANAGEMENT
-- Run this in your Supabase SQL Editor
-- ============================================

-- Drop existing update policies
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow service role full access" ON public.profiles;

-- Create more permissive update policies
CREATE POLICY "Allow authenticated users to update profiles" ON public.profiles
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Allow service role to do everything
CREATE POLICY "Allow service role full access" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Allow anon role to update (for the user management app)
CREATE POLICY "Allow anon to update profiles" ON public.profiles
    FOR UPDATE USING (true)
    WITH CHECK (true);

-- Grant additional permissions
GRANT UPDATE ON public.profiles TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
