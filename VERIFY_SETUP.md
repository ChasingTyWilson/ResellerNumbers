# ✅ How to Verify ConvertKit Environment Variables

## Check in Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your **ResellerNumbers** project
3. Click **Settings** → **Environment Variables**

You should see **TWO** variables listed:

✅ **CONVERTKIT_API_SECRET**
   - Value: `9CjNB-PePhr9IKCn6AlCiGTBIAQHmL8I8zSQLqk8llg` (hidden)
   - Environments: Production, Preview, Development

✅ **CONVERTKIT_FORM_ID**
   - Value: `8906946`
   - Environments: Production, Preview, Development

## Next Steps

### 1. Redeploy Your Site

The environment variables won't be active until you redeploy:

1. Go to **Deployments** tab
2. Find your latest deployment
3. Click the **⋯** (three dots) menu
4. Click **Redeploy**
5. Wait 1-2 minutes for deployment to complete

### 2. Test the Integration

After redeploy:

1. Visit your live site: **ResellerNumbers.com**
2. Enter an email address (use your own for testing)
3. Check **ConvertKit Dashboard** → **Subscribers**
4. The subscriber should appear within a few seconds!

### 3. Check Function Logs (if needed)

If emails aren't appearing:

1. Go to Vercel Dashboard → **Functions** tab
2. Click on `/api/convertkit/subscribe`
3. Check the logs for any errors

---

**All set!** Your ConvertKit integration should now be live. 🎉

