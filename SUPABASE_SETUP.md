# 🚀 Supabase Setup Guide
## eBay Business Analytics Platform

This guide will walk you through setting up Supabase as the backend for your eBay Analytics application.

---

## 📋 Prerequisites

- A Supabase account (free tier is sufficient to start)
- Your application files in this directory

---

## 🔧 Step 1: Create a Supabase Project

1. **Go to Supabase:** https://app.supabase.com
2. **Sign up or log in** to your account
3. **Click "New Project"**
4. **Fill in the details:**
   - **Name:** `ebay-analytics` (or your preferred name)
   - **Database Password:** Choose a strong password (save this!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free (upgradable later)
5. **Click "Create new project"**
6. **Wait 2-3 minutes** for the project to initialize

---

## 🗄️ Step 2: Set Up the Database Schema

1. **Open SQL Editor:**
   - In your Supabase dashboard, click on the **SQL Editor** icon (left sidebar)

2. **Create a new query:**
   - Click **"New query"** button

3. **Copy and paste the schema:**
   - Open the file `supabase-schema.sql` in this directory
   - Copy ALL the contents
   - Paste into the SQL Editor

4. **Run the query:**
   - Click **"Run"** button (or press Ctrl+Enter / Cmd+Enter)
   - You should see a success message

5. **Verify tables were created:**
   - Click on **"Table Editor"** in the left sidebar
   - You should see these tables:
     - `profiles`
     - `business_metrics`
     - `collections`
     - `inventory_data`
     - `sold_data`

---

## 🔑 Step 3: Get Your API Credentials

1. **Go to Project Settings:**
   - Click the **⚙️ gear icon** in the left sidebar
   - Click **"API"** under "Project Settings"

2. **Copy your credentials:**
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** A long string starting with `eyJ...`

3. **Keep these safe!** You'll need them in the next step

---

## ⚙️ Step 4: Configure Your Application

1. **Open `supabase-config.js`** in your text editor

2. **Replace the placeholder values:**

```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project-id.supabase.co',  // ← Paste your Project URL here
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',  // ← Paste your anon key here
};
```

3. **Save the file**

---

## 🔐 Step 5: Configure Email Authentication (Optional but Recommended)

By default, Supabase will require email confirmation for new signups.

### Option A: Enable Email Confirmations (Production)

1. **Go to Authentication Settings:**
   - Click **"Authentication"** in left sidebar
   - Click **"Email Templates"**

2. **Customize confirmation email (optional)**
   - Edit the "Confirm signup" template
   - Add your branding

### Option B: Disable Email Confirmations (Development Only)

1. **Go to Authentication Settings:**
   - Click **"Authentication"** → **"Providers"**
   
2. **Scroll to Email settings:**
   - Toggle **"Enable email confirmations"** to OFF
   - ⚠️ Only do this for development!

3. **Click "Save"**

---

## 🧪 Step 6: Test Your Setup

1. **Open your application:**
   ```bash
   open index.html
   ```
   Or serve it with a simple HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
   Then visit: http://localhost:8000

2. **Create a test account:**
   - Click "Create New Account"
   - Fill in the form
   - Submit

3. **Check the browser console:**
   - Open DevTools (F12 or Cmd+Option+I)
   - Look for: `✅ Supabase initialized successfully`
   - If you see errors, double-check your credentials in `supabase-config.js`

4. **Verify in Supabase:**
   - Go to Supabase Dashboard → **"Authentication"** → **"Users"**
   - Your test user should appear!

---

## 🎨 Step 7: Set Up Row Level Security (Already Done!)

The SQL schema already includes Row Level Security (RLS) policies, which means:

- ✅ Users can only see their own data
- ✅ Users can only modify their own data
- ✅ User data is completely isolated
- ✅ No user can access another user's information

---

## 📊 Database Tables Overview

### `profiles`
Stores extended user information beyond auth.users
- User subscription status
- Trial period tracking
- Stripe customer ID (for future payment integration)

### `business_metrics`
Stores user's business settings
- Minutes per item
- Ideal hourly rate
- Fee percentages
- Tax bracket

### `collections`
Stores collection purchase data
- Collection name and SKU
- Purchase date and cost
- Notes

### `inventory_data`
Stores uploaded CSV inventory data
- Full JSON of inventory
- Upload timestamp
- Row count

### `sold_data`
Stores uploaded CSV sold orders data
- Full JSON of sold orders
- Upload timestamp
- Row count

---

## 🔄 Data Migration from LocalStorage

Your app will now:
1. ✅ Check if Supabase is configured
2. ✅ Use Supabase if available
3. ✅ Fall back to demo mode (localStorage) if not configured

**When a user logs in:**
- All their data (collections, settings) is loaded from Supabase
- CSV uploads are automatically saved to their account
- Everything syncs across devices!

---

## 💰 Pricing Considerations

### Free Tier (Current)
- ✅ 500MB database storage
- ✅ 50,000 monthly active users
- ✅ 2GB bandwidth
- ✅ 50MB file storage
- **Perfect for: 0-500 users**

### Pro Plan ($25/mo)
- ✅ 8GB database storage
- ✅ 100,000 monthly active users
- ✅ 50GB bandwidth
- ✅ 100GB file storage
- **Perfect for: 500-5,000 users**

You can upgrade anytime from the Supabase dashboard.

---

## 🚨 Troubleshooting

### "Supabase not configured - running in demo mode"
- Check that your `supabase-config.js` has real values (not placeholder text)
- Verify your Project URL and anon key are correct

### "Invalid API key"
- Make sure you copied the **anon public key**, not the service role key
- Check for extra spaces or missing characters

### "User already registered"
- Each email can only be used once
- Go to Supabase → Authentication → Users to delete test accounts

### CORS Errors
- Supabase should handle CORS automatically
- If you see errors, make sure you're accessing via HTTP (not file://)

---

## 🎯 Next Steps

Now that Supabase is set up:

1. **Test all features:**
   - Sign up / Login
   - Upload CSV data
   - Save collections
   - Save business settings
   - Logout and login again (data persists!)

2. **Ready for deployment:**
   - Deploy to Netlify, Vercel, or any static host
   - Your backend is already live on Supabase!

3. **Add payment integration (future):**
   - Stripe/PayPal webhooks can update the `profiles` table
   - Subscription status controls app access

---

## 📞 Support

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Community:** https://github.com/supabase/supabase/discussions

---

## ✅ Checklist

Before going live, make sure:

- [ ] Supabase project created
- [ ] Database schema executed successfully
- [ ] API credentials configured in `supabase-config.js`
- [ ] Email authentication configured
- [ ] Test signup works
- [ ] Test login works
- [ ] Test data persistence (logout/login)
- [ ] All features tested with real Supabase backend

---

🎉 **Congratulations!** Your eBay Analytics platform now has a professional, scalable backend!


