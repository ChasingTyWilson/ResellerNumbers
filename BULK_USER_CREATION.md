# Bulk User Creation Guide

This guide explains how to bulk create user accounts for the eBay Analytics platform.

## 📋 Prerequisites

1. **Node.js installed** (v14 or higher)
2. **Supabase Admin API Key** (Service Role Key)
3. **Supabase Project URL**

## 🔑 Getting Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy your **Project URL** and **service_role** key (keep this secret!)

## 📦 Installation

Install the required dependency:

```bash
npm install @supabase/supabase-js
```

## 🚀 Usage

### Option 1: Using a Text File (Recommended)

1. **Create a text file** with email addresses (one per line):
   ```
   user1@example.com
   user2@example.com
   user3@example.com
   ```

2. **Set environment variables**:
   ```bash
   export SUPABASE_URL=https://your-project.supabase.co
   export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Run the script**:
   ```bash
   node bulk-create-users.js emails.txt
   ```

### Option 2: Interactive Mode

1. **Set environment variables** (same as above)

2. **Run without arguments**:
   ```bash
   node bulk-create-users.js
   ```

3. **Enter emails** (one per line or comma-separated):
   ```
   user1@example.com
   user2@example.com, user3@example.com
   done
   ```

### Option 3: One-Line Command

```bash
SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx node bulk-create-users.js emails.txt
```

## ⚙️ Configuration

You can modify the default settings in `bulk-create-users.js`:

- **DEFAULT_PASSWORD**: `'Recharge'` (change this if needed)
- **DEFAULT_FULL_NAME**: `'User'` (default name for all users)

## 📊 Output

The script will:
- ✅ Create user accounts in Supabase Auth
- ✅ Create profiles with 14-day trial periods
- ✅ Set status to 'pending' (requires admin approval)
- ✅ Show a summary of successful and failed creations

## 🔒 Security Notes

- ⚠️ **Never commit** your `SUPABASE_SERVICE_ROLE_KEY` to git
- ⚠️ The service role key has admin access - keep it secure
- ⚠️ All users are created with status 'pending' and need approval

## 📝 Example Output

```
🚀 Starting bulk user creation for 3 email(s)...

📧 [1/3] Creating account for: user1@example.com...
✅ Success: user1@example.com (User ID: abc123...)

📧 [2/3] Creating account for: user2@example.com...
✅ Success: user2@example.com (User ID: def456...)

📧 [3/3] Creating account for: user3@example.com...
❌ Failed: user3@example.com - User already registered

============================================================
📊 BULK USER CREATION SUMMARY
============================================================
Total emails: 3
✅ Successful: 2
❌ Failed: 1

✅ SUCCESSFUL CREATIONS:
   - user1@example.com
   - user2@example.com

❌ FAILED CREATIONS:
   - user3@example.com: User already registered

============================================================

📝 Default password for all accounts: "Recharge"
📝 Note: Users are created with status "pending" and need approval.
```

## 🛠️ Troubleshooting

### Error: "Invalid email format"
- Check that emails are properly formatted (user@domain.com)

### Error: "User already registered"
- Email already exists in the system - skip this user or use a different email

### Error: "Profile creation failed"
- Auth user was created but profile failed
- Check Supabase database tables and RLS policies

### Error: "Please configure SUPABASE_URL"
- Make sure you've set the environment variables correctly
- Or edit the script directly with your credentials (not recommended for production)

## 📧 After Creation

1. **Users can log in** with their email and password: `Recharge`
2. **They start as 'pending'** - you'll need to approve them in the admin panel
3. **They have a 14-day trial** period automatically set
4. **Users can change their password** after first login

## 🔄 Approving Users

After bulk creation, go to your user management dashboard to approve the new users.

---

**Need help?** Check the main README or contact support.

