# 🚀 Quick Guide: Bulk Create Users

To create user accounts for the emails in `emails.txt`, follow these steps:

## Step 1: Get Your Service Role Key

1. Go to: https://app.supabase.com
2. Sign in to your account
3. Open your project settings
4. Go to **Settings** → **API**
5. Copy the **service_role** key (not the anon key!)
   - Keep this secret!
   - It has admin access to your database

## Step 2: Run the Script

### Option A: Using the helper script (easiest)

```bash
./run-bulk-create.sh YOUR_SERVICE_ROLE_KEY_HERE
```

### Option B: Using environment variables

```bash
export SUPABASE_URL=https://yknvgrydvxnkzycpjblv.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_key_here
python3 bulk-create-users.py emails.txt
```

### Option C: One-line command

```bash
SUPABASE_URL=https://yknvgrydvxnkzycpjblv.supabase.co SUPABASE_SERVICE_ROLE_KEY=your_key_here python3 bulk-create-users.py emails.txt
```

## What Happens?

The script will:
- ✅ Create 32 user accounts (from emails.txt)
- ✅ Set default password: **Recharge**
- ✅ Create profiles with 14-day trial periods
- ✅ Set status to 'pending' (requires admin approval)
- ✅ Show you a summary of successes and failures

## After Running

1. Users can log in with their email and password: **Recharge**
2. Go to your admin panel to approve the new users
3. Users will have full access after approval

## File Locations

- **Email list**: `emails.txt` (32 email addresses)
- **Python script**: `bulk-create-users.py`
- **Helper script**: `run-bulk-create.sh`
- **Full docs**: `BULK_USER_CREATION.md`

---

**Ready to go?** Just get your service role key and run:

```bash
./run-bulk-create.sh YOUR_SERVICE_ROLE_KEY_HERE
```

