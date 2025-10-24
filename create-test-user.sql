-- ============================================
-- CREATE TEST USER FOR TESTING
-- Run this in your Supabase SQL Editor
-- ============================================

-- Insert a test user directly into profiles table
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    status,
    subscription_status,
    subscription_plan,
    trial_ends_at,
    created_at
) VALUES (
    gen_random_uuid(),
    'test@example.com',
    'Test User',
    'pending',
    'trial',
    'free',
    NOW() + INTERVAL '14 days',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Check the result
SELECT * FROM public.profiles ORDER BY created_at DESC;
