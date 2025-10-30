# 🔧 Fix Profile Creation Issue

## Problem
Auth users were created successfully (31 out of 32), but profiles failed to be created due to missing INSERT policies.

## Solution

### Step 1: Run the SQL Fix
Go to your Supabase dashboard → SQL Editor and run the contents of `fix-profiles-insert-policy.sql`:

```sql
-- Allow service role to insert profiles
CREATE POLICY "Allow service role to insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Allow service role to do everything (in case we need it)
CREATE POLICY "Allow service role full access" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Grant INSERT permission to service role (as backup)
GRANT INSERT ON public.profiles TO service_role;
```

### Step 2: Backfill Missing Profiles
Run the backfill script to create profiles for all users that don't have them:

```bash
SUPABASE_URL=https://yknvgrydvxnkzycpjblv.supabase.co SUPABASE_SERVICE_ROLE_KEY=your_key_here python3 backfill-profiles.py
```

Or using the helper script approach:
```bash
export SUPABASE_SERVICE_ROLE_KEY=your_key_here
python3 backfill-profiles.py
```

## Status After Fix

✅ **31 auth users created** (ready to log in)
⚠️  **Profiles need to be backfilled** (run Step 2)

## Verification
After running both steps, check in Supabase Dashboard → Table Editor → profiles to confirm all users have profiles.

## Future Bulk Creation
After running the SQL fix, future bulk creations will work without this issue!

