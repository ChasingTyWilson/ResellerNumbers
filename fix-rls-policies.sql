-- ============================================
-- FIX RLS POLICIES FOR USER MANAGEMENT
-- Run this in your Supabase SQL Editor
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create more permissive policies for admin access
-- Allow authenticated users to read all profiles (for admin management)
CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to update profiles (for admin management)
CREATE POLICY "Allow authenticated users to update profiles" ON public.profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow service role to do everything (for admin operations)
CREATE POLICY "Allow service role full access" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Also allow anon role to read (for the user management app)
CREATE POLICY "Allow anon to read profiles" ON public.profiles
    FOR SELECT USING (true);

-- Grant additional permissions
GRANT SELECT, UPDATE ON public.profiles TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
