-- ============================================
-- CHECK USERS AND MIGRATE EXISTING USERS
-- Run this in your Supabase SQL Editor
-- ============================================

-- Check if there are any users in auth.users
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC;

-- Check if there are any profiles
SELECT 
    id,
    email,
    full_name,
    status,
    subscription_status,
    created_at
FROM public.profiles 
ORDER BY created_at DESC;

-- If you have users in auth.users but not in profiles, run this migration:
-- (Only run this if you see users in the first query but not in the second)

INSERT INTO public.profiles (id, email, full_name, status, subscription_status, subscription_plan, trial_ends_at)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', ''),
    'active' as status,
    'trial' as subscription_status,
    'free' as subscription_plan,
    NOW() + INTERVAL '14 days' as trial_ends_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
