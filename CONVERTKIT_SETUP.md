# ConvertKit Email List Integration Setup

## 🎯 Overview

This setup automatically adds user email addresses to your ConvertKit email list when they first enter their email on ResellerNumbers.com.

## 📋 What You Need

1. **ConvertKit Account** - Sign up at [convertkit.com](https://convertkit.com) if you don't have one
2. **API Secret** - From your ConvertKit account settings
3. **Form ID** - The ID of the form/list you want to add subscribers to

## 🔧 Step-by-Step Setup

### Step 1: Get Your ConvertKit API Secret

1. Log in to your ConvertKit account
2. Go to **Settings** → **Advanced** → **API Secret**
3. Copy your API Secret (it looks like: `xxxxx-xxxxx-xxxxx-xxxxx`)

### Step 2: Get Your Form ID

1. In ConvertKit, go to **Forms** (or **Landing Pages & Forms**)
2. Click on the form you want to use (or create a new one)
3. Look at the URL - it will be something like: `https://app.convertkit.com/forms/123456/edit`
4. The number `123456` is your **Form ID**
5. Alternatively, you can find it in the form's embed code or API settings

### Step 3: Add Environment Variables to Vercel

1. Go to your Vercel dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your **ResellerNumbers** project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

   **Variable 1:**
   - **Name:** `CONVERTKIT_API_SECRET`
   - **Value:** Your ConvertKit API Secret (from Step 1)
   - **Environment:** Production, Preview, Development (select all)

   **Variable 2:**
   - **Name:** `CONVERTKIT_FORM_ID`
   - **Value:** Your Form ID (from Step 2)
   - **Environment:** Production, Preview, Development (select all)

5. Click **Save**

### Step 4: Redeploy Your Site

After adding the environment variables, you need to redeploy:

1. In Vercel, go to **Deployments**
2. Click the **⋯** menu on your latest deployment
3. Click **Redeploy**
4. Or, make a small change and push to GitHub (auto-deploys)

## ✅ Testing

1. Visit your live site: ResellerNumbers.com
2. Enter an email address (use your own for testing)
3. Check your ConvertKit dashboard → **Subscribers**
4. You should see the new subscriber appear within a few seconds

## 🔍 How It Works

1. User enters email on your website
2. Email is saved to localStorage (for app functionality)
3. **If it's a new user**, the email is automatically sent to your ConvertKit API
4. ConvertKit adds them to your specified form/list
5. User continues using the app (non-blocking - if ConvertKit fails, user still gets access)

## 🎨 Optional: Add Tags or Custom Fields

If you want to add tags or custom fields to subscribers, edit `/api/convertkit/subscribe.js`:

```javascript
body: JSON.stringify({
    api_secret: CONVERTKIT_API_SECRET,
    email: email,
    tags: ['reseller-numbers', 'website-signup'],  // Add tags
    fields: {                                       // Add custom fields
        source: 'website-signup',
        signup_date: new Date().toISOString()
    }
}),
```

## 🐛 Troubleshooting

### Emails not appearing in ConvertKit

1. **Check Vercel logs:**
   - Go to Vercel Dashboard → Your Project → **Functions** tab
   - Look for `/api/convertkit/subscribe` function
   - Check for any errors

2. **Verify environment variables:**
   - Make sure `CONVERTKIT_API_SECRET` and `CONVERTKIT_FORM_ID` are set
   - Check that they're available in Production environment

3. **Test the API directly:**
   ```bash
   curl -X POST https://your-site.vercel.app/api/convertkit/subscribe \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

4. **Check ConvertKit API limits:**
   - Free tier: 1,000 subscribers
   - Make sure you haven't hit your limit

### Function not found (404 error)

- Make sure you've redeployed after creating the API function
- Check that `api/convertkit/subscribe.js` exists in your repository
- Verify `vercel.json` includes the API routes configuration

## 📊 Monitoring

- **Vercel Function Logs:** Check function execution and errors
- **ConvertKit Dashboard:** Monitor new subscribers in real-time
- **Browser Console:** Check for any client-side errors

## 🔒 Security Notes

- ✅ API Secret is stored securely in Vercel environment variables
- ✅ API Secret is never exposed to the frontend
- ✅ All API calls are server-side only
- ✅ Email validation happens on both client and server

## 💡 Pro Tips

1. **Create a dedicated form** in ConvertKit just for website signups
2. **Set up automation** in ConvertKit to send welcome emails
3. **Use tags** to segment your subscribers (e.g., "reseller-numbers", "free-tier")
4. **Monitor your subscriber count** to track growth

---

**Need Help?** 
- ConvertKit API Docs: https://developers.convertkit.com/
- Vercel Functions Docs: https://vercel.com/docs/functions

