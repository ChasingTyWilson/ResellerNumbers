# 🚀 Deployment Instructions

## Quick Deploy to Vercel (Recommended)

### Option 1: Deploy from GitHub (Recommended)

1. **Create a GitHub repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - eBay Analytics Platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/reseller-numbers.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd /path/to/your/project
   vercel
   ```

## Alternative: Deploy to Netlify

1. **Drag and drop deployment:**
   - Go to [netlify.com](https://netlify.com)
   - Drag your project folder to the deploy area
   - Your site will be live instantly!

2. **GitHub integration:**
   - Connect your GitHub repository
   - Automatic deployments on every push

## After Deployment

1. **Configure Supabase** (for data persistence)
2. **Test your live site**
3. **Set up custom domain** (optional)
4. **Configure Stripe** (for monetization)

## Files Included in Deployment

✅ `index.html` - Main application  
✅ `script.js` - Application logic  
✅ `styles.css` - Styling  
✅ `supabase-config.js` - Database configuration  
✅ `supabase-service.js` - Database service layer  
✅ `vercel.json` - Vercel configuration  

## Files Excluded

❌ `card_cropper.py` - Python files not needed for web  
❌ `requirements.txt` - Python dependencies  
❌ `cropped_cards/` - Test images  
❌ Documentation files (unless you want them public)  

---

Your site will be live at: `https://your-project-name.vercel.app`
