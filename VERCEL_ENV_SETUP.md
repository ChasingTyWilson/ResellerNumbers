# ✅ ConvertKit Environment Variables Setup for Vercel

## Your ConvertKit Credentials

**⚠️ IMPORTANT: Get these from your ConvertKit account or contact the admin**

- **API Secret:** (Get from ConvertKit → Settings → Advanced → API Secret)
- **Form ID:** (Get from ConvertKit → Forms → Your Form ID)

## 🚀 Quick Setup Steps

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Select your **ResellerNumbers** project

### Step 2: Add Environment Variables
1. Click **Settings** (in the top menu)
2. Click **Environment Variables** (in the left sidebar)
3. Add the following variables:

#### Variable 1: CONVERTKIT_API_SECRET
- **Key:** `CONVERTKIT_API_SECRET`
- **Value:** `9CjNB-PePhr9IKCn6AlCiGTBIAQHmL8I8zSQLqk8llg`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

#### Variable 2: CONVERTKIT_FORM_ID
- **Key:** `CONVERTKIT_FORM_ID`
- **Value:** `8906946`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on your latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete (1-2 minutes)

## ✅ Testing

After redeploy, test it:
1. Visit your live site: ResellerNumbers.com
2. Enter an email address (use your own for testing)
3. Check ConvertKit → Subscribers
4. You should see the new subscriber appear!

## 🔒 Security Note

✅ These credentials are now stored securely in Vercel
✅ They will NOT be exposed in your code
✅ Only your serverless function can access them

---

**That's it!** Your ConvertKit integration is now live. 🎉

