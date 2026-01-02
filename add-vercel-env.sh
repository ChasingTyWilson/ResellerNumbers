#!/bin/bash
# Script to add ConvertKit environment variables to Vercel

echo "🔐 Adding ConvertKit environment variables to Vercel..."
echo ""

# First, make sure we're logged in
echo "Checking Vercel login status..."
if ! vercel whoami > /dev/null 2>&1; then
    echo "❌ Not logged in to Vercel. Please run: vercel login"
    echo "   (This will open a browser for authentication)"
    exit 1
fi

echo "✅ Logged in to Vercel"
echo ""

# Link the project if not already linked
if [ ! -f .vercel/project.json ]; then
    echo "🔗 Linking project to Vercel..."
    vercel link --yes
    echo ""
fi

# Add CONVERTKIT_API_SECRET
echo "➕ Adding CONVERTKIT_API_SECRET..."
echo "9CjNB-PePhr9IKCn6AlCiGTBIAQHmL8I8zSQLqk8llg" | vercel env add CONVERTKIT_API_SECRET production preview development

# Add CONVERTKIT_FORM_ID  
echo ""
echo "➕ Adding CONVERTKIT_FORM_ID..."
echo "8906946" | vercel env add CONVERTKIT_FORM_ID production preview development

echo ""
echo "✅ Environment variables added successfully!"
echo ""
echo "📋 Summary:"
echo "   - CONVERTKIT_API_SECRET added to Production, Preview, Development"
echo "   - CONVERTKIT_FORM_ID added to Production, Preview, Development"
echo ""
echo "🚀 Next step: Redeploy your site for the changes to take effect"
echo "   Run: vercel --prod"
echo "   Or redeploy from the Vercel dashboard"

