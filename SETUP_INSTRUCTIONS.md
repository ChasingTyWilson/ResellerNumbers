# Quick Setup Instructions

## Step 1: Login to Vercel (One-time setup)

Run this command in your terminal:

```bash
vercel login
```

This will:
- Open your browser
- Ask you to authenticate with Vercel
- Return to terminal when complete

## Step 2: Add Environment Variables

After logging in, run:

```bash
./add-vercel-env.sh
```

This script will:
- ✅ Check if you're logged in
- ✅ Link your project (if needed)
- ✅ Add CONVERTKIT_API_SECRET
- ✅ Add CONVERTKIT_FORM_ID
- ✅ Set them for Production, Preview, and Development

## Step 3: Redeploy

After adding the env vars, redeploy:

```bash
vercel --prod
```

Or redeploy from the Vercel dashboard.

---

**That's it!** Your ConvertKit integration will be live. 🎉

