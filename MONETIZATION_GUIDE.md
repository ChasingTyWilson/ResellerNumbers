# 💰 Monetization & Distribution Guide

## Overview

This guide shows you exactly how to add payments, trials, and user management to your eBay Analytics platform using **Stripe + Supabase**.

---

## 🎯 Recommended Stack

### Components:
1. **Stripe Billing** - Handles payments, subscriptions, trials
2. **Supabase** - User authentication & data (already setup!)
3. **Vercel** - Free hosting with automatic deploys
4. **Stripe Customer Portal** - Self-service billing for users

### Cost:
- **Stripe**: 2.9% + $0.30 per transaction
- **Supabase**: Free up to 500MB, then $25/month
- **Vercel**: Free for hobby projects, $20/month for pro

---

## 🚀 Quick Start (3 Steps)

### Step 1: Create Stripe Account (5 minutes)

1. Go to [stripe.com](https://stripe.com)
2. Sign up for free account
3. Go to Dashboard → Developers → API Keys
4. Copy your **Publishable Key** and **Secret Key**

### Step 2: Create Products & Prices (10 minutes)

1. In Stripe Dashboard → Products
2. Create your pricing tiers:

**Free Tier** (No Stripe product needed)
- 30 days historical data
- Basic analytics
- 500 item limit

**Pro Tier**
- Name: "eBay Analytics Pro"
- Price: $9.99/month (or $99/year with discount)
- Features: 12 months history, unlimited items
- Add 14-day free trial option

**Business Tier**
- Name: "eBay Analytics Business"
- Price: $19.99/month (or $199/year)
- Features: Unlimited history, API access, priority support

3. Copy each **Price ID** (starts with `price_...`)

### Step 3: Add Stripe to Your App (30 minutes)

See implementation code below ↓

---

## 💻 Implementation Code

### 1. Add Stripe to HTML

Add this to your `<head>` in `index.html`:

```html
<!-- Stripe.js -->
<script src="https://js.stripe.com/v3/"></script>
```

### 2. Create Stripe Config File

Create `stripe-config.js`:

```javascript
// ============================================
// STRIPE CONFIGURATION
// ============================================

const STRIPE_CONFIG = {
    publishableKey: 'pk_test_YOUR_PUBLISHABLE_KEY_HERE', // Replace with your key
    prices: {
        pro_monthly: 'price_YOUR_PRO_MONTHLY_ID',
        pro_yearly: 'price_YOUR_PRO_YEARLY_ID',
        business_monthly: 'price_YOUR_BUSINESS_MONTHLY_ID',
        business_yearly: 'price_YOUR_BUSINESS_YEARLY_ID'
    }
};

// Initialize Stripe
const stripe = Stripe(STRIPE_CONFIG.publishableKey);
```

### 3. Add Pricing Page to HTML

Add this after your platform selector in `index.html`:

```html
<!-- Pricing Page -->
<div class="pricing-page" id="pricingPage" style="display: none;">
    <div class="pricing-container">
        <div class="pricing-header">
            <h1>Choose Your Plan</h1>
            <p class="pricing-subtitle">Start your 14-day free trial - no credit card required</p>
            
            <!-- Billing Toggle -->
            <div class="billing-toggle">
                <span class="toggle-label" id="monthlyLabel">Monthly</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="billingToggle">
                    <span class="toggle-slider"></span>
                </label>
                <span class="toggle-label" id="yearlyLabel">Yearly <span class="save-badge">Save 20%</span></span>
            </div>
        </div>

        <div class="pricing-grid">
            <!-- Free Tier -->
            <div class="pricing-card">
                <div class="pricing-card-header">
                    <h3>Free</h3>
                    <div class="price">
                        <span class="price-amount">$0</span>
                        <span class="price-period">/forever</span>
                    </div>
                </div>
                <ul class="pricing-features">
                    <li><span class="feature-check">✓</span> Last 30 days of data</li>
                    <li><span class="feature-check">✓</span> Basic analytics</li>
                    <li><span class="feature-check">✓</span> 500 item limit</li>
                    <li><span class="feature-check">✓</span> CSV uploads</li>
                </ul>
                <button class="btn btn-outline btn-large btn-full" onclick="dashboard.continueWithFreeTier()">
                    Continue with Free
                </button>
            </div>

            <!-- Pro Tier -->
            <div class="pricing-card pricing-card-popular">
                <div class="popular-badge">Most Popular</div>
                <div class="pricing-card-header">
                    <h3>Pro</h3>
                    <div class="price">
                        <span class="price-amount" id="proPrice">$9.99</span>
                        <span class="price-period" id="proPeriod">/month</span>
                    </div>
                    <p class="trial-note">14-day free trial</p>
                </div>
                <ul class="pricing-features">
                    <li><span class="feature-check">✓</span> <strong>12 months</strong> of historical data</li>
                    <li><span class="feature-check">✓</span> <strong>Unlimited</strong> items</li>
                    <li><span class="feature-check">✓</span> Advanced analytics</li>
                    <li><span class="feature-check">✓</span> Customer retention tracking</li>
                    <li><span class="feature-check">✓</span> Month-over-month trends</li>
                    <li><span class="feature-check">✓</span> Priority email support</li>
                </ul>
                <button class="btn btn-primary btn-large btn-full" onclick="dashboard.startProTrial()">
                    Start Free Trial
                </button>
            </div>

            <!-- Business Tier -->
            <div class="pricing-card">
                <div class="pricing-card-header">
                    <h3>Business</h3>
                    <div class="price">
                        <span class="price-amount" id="businessPrice">$19.99</span>
                        <span class="price-period" id="businessPeriod">/month</span>
                    </div>
                    <p class="trial-note">14-day free trial</p>
                </div>
                <ul class="pricing-features">
                    <li><span class="feature-check">✓</span> <strong>Everything in Pro</strong></li>
                    <li><span class="feature-check">✓</span> <strong>Unlimited</strong> historical data</li>
                    <li><span class="feature-check">✓</span> API access</li>
                    <li><span class="feature-check">✓</span> Advanced exports</li>
                    <li><span class="feature-check">✓</span> Multi-store support</li>
                    <li><span class="feature-check">✓</span> Priority phone support</li>
                </ul>
                <button class="btn btn-primary btn-large btn-full" onclick="dashboard.startBusinessTrial()">
                    Start Free Trial
                </button>
            </div>
        </div>

        <div class="pricing-footer">
            <p>✓ Cancel anytime • ✓ No credit card required for trial • ✓ 30-day money-back guarantee</p>
        </div>
    </div>
</div>
```

### 4. Add Stripe Methods to script.js

Add these methods to your `eBayInventoryAnalytics` class:

```javascript
// ============= STRIPE/SUBSCRIPTION METHODS =============

async startProTrial() {
    await this.createCheckoutSession('pro');
}

async startBusinessTrial() {
    await this.createCheckoutSession('business');
}

continueWithFreeTier() {
    // Hide pricing page, show platform selector
    document.getElementById('pricingPage').style.display = 'none';
    this.showPlatformSelector();
}

async createCheckoutSession(tier) {
    try {
        if (!supabaseService || !supabaseService.currentUser) {
            alert('Please log in first');
            return;
        }

        // Determine which price to use based on billing toggle
        const isYearly = document.getElementById('billingToggle').checked;
        const priceKey = tier === 'pro' 
            ? (isYearly ? 'pro_yearly' : 'pro_monthly')
            : (isYearly ? 'business_yearly' : 'business_monthly');
        
        const priceId = STRIPE_CONFIG.prices[priceKey];

        // Create Stripe Checkout Session
        // Note: This requires a serverless function or backend endpoint
        // See "Backend Setup" section below
        
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                priceId: priceId,
                userId: supabaseService.currentUser.id,
                userEmail: supabaseService.currentUser.email,
                tier: tier
            })
        });

        const session = await response.json();

        // Redirect to Stripe Checkout
        const result = await stripe.redirectToCheckout({
            sessionId: session.id
        });

        if (result.error) {
            alert(result.error.message);
        }
    } catch (error) {
        console.error('Error creating checkout session:', error);
        alert('Error starting trial. Please try again.');
    }
}

async checkSubscriptionStatus() {
    // Check user's subscription status from Supabase profile
    if (!supabaseService || !supabaseService.currentUser) return 'free';

    const profile = await supabaseService.getUserProfile();
    if (!profile) return 'free';

    // Check if subscription is active
    const subscriptionStatus = profile.subscription_status || 'free';
    const subscriptionPlan = profile.subscription_plan || 'free';
    
    // Check if trial has expired
    if (subscriptionStatus === 'trial') {
        const trialEndsAt = new Date(profile.trial_ends_at);
        if (trialEndsAt < new Date()) {
            // Trial expired
            return 'free';
        }
    }

    return subscriptionPlan; // 'free', 'pro', or 'business'
}

canAccessFeature(feature) {
    // Feature gating based on subscription
    const tier = this.currentSubscriptionTier || 'free';
    
    const featureAccess = {
        'unlimited_items': ['pro', 'business'],
        'historical_data_12m': ['pro', 'business'],
        'historical_data_unlimited': ['business'],
        'retention_dashboard': ['pro', 'business'],
        'api_access': ['business'],
        'multi_store': ['business'],
        'advanced_exports': ['business']
    };

    return featureAccess[feature]?.includes(tier) || false;
}

showUpgradePrompt(feature) {
    const featureNames = {
        'unlimited_items': 'Unlimited Items',
        'historical_data_12m': '12 Months Historical Data',
        'historical_data_unlimited': 'Unlimited Historical Data',
        'retention_dashboard': 'Customer Retention Dashboard',
        'api_access': 'API Access',
        'multi_store': 'Multi-Store Support'
    };

    const featureName = featureNames[feature] || feature;
    
    if (confirm(`🔒 ${featureName} is a Pro feature.\n\nWould you like to upgrade and start your 14-day free trial?`)) {
        this.showPricingPage();
    }
}

showPricingPage() {
    // Hide all other screens
    if (this.authScreen) this.authScreen.style.display = 'none';
    if (this.landingPage) this.landingPage.style.display = 'none';
    const platformSelector = document.getElementById('platformSelector');
    if (platformSelector) platformSelector.style.display = 'none';
    
    // Show pricing page
    const pricingPage = document.getElementById('pricingPage');
    if (pricingPage) {
        pricingPage.style.display = 'block';
    }

    // Setup billing toggle if not already done
    if (!this.billingToggleSetup) {
        this.setupBillingToggle();
        this.billingToggleSetup = true;
    }
}

setupBillingToggle() {
    const toggle = document.getElementById('billingToggle');
    if (!toggle) return;

    toggle.addEventListener('change', () => {
        const isYearly = toggle.checked;
        
        // Update Pro pricing
        const proPrice = document.getElementById('proPrice');
        const proPeriod = document.getElementById('proPeriod');
        if (proPrice && proPeriod) {
            proPrice.textContent = isYearly ? '$99' : '$9.99';
            proPeriod.textContent = isYearly ? '/year' : '/month';
        }

        // Update Business pricing
        const businessPrice = document.getElementById('businessPrice');
        const businessPeriod = document.getElementById('businessPeriod');
        if (businessPrice && businessPeriod) {
            businessPrice.textContent = isYearly ? '$199' : '$19.99';
            businessPeriod.textContent = isYearly ? '/year' : '/month';
        }
    });
}

// Modify showApp() to check subscription first
async showApp() {
    // Hide auth screen
    if (this.authScreen) {
        this.authScreen.style.display = 'none';
    }

    // Check subscription status
    this.currentSubscriptionTier = await this.checkSubscriptionStatus();
    
    // If free tier and first time, show pricing page
    const hasSeenPricing = localStorage.getItem('hasSeenPricing');
    if (this.currentSubscriptionTier === 'free' && !hasSeenPricing) {
        localStorage.setItem('hasSeenPricing', 'true');
        this.showPricingPage();
    } else {
        // Show platform selector
        this.showPlatformSelector();
    }
}
```

### 5. Add CSS Styles

Add to `styles.css`:

```css
/* ========== PRICING PAGE STYLES ========== */

.pricing-page {
    min-height: 100vh;
    padding: 4rem 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.pricing-container {
    max-width: 1200px;
    width: 100%;
}

.pricing-header {
    text-align: center;
    margin-bottom: 3rem;
}

.pricing-header h1 {
    color: white;
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.pricing-subtitle {
    color: white;
    font-size: 1.1rem;
    opacity: 0.95;
    margin-bottom: 2rem;
}

.billing-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    padding: 0.75rem 1.5rem;
    border-radius: 50px;
    display: inline-flex;
    margin: 0 auto;
}

.toggle-label {
    color: white;
    font-weight: 500;
    font-size: 0.95rem;
}

.toggle-switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 26px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.3);
    transition: 0.3s;
    border-radius: 34px;
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
}

input:checked + .toggle-slider {
    background-color: #10b981;
}

input:checked + .toggle-slider:before {
    transform: translateX(24px);
}

.save-badge {
    background: #10b981;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 0.5rem;
}

.pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}

.pricing-card {
    background: white;
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    position: relative;
    display: flex;
    flex-direction: column;
}

.pricing-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.pricing-card-popular {
    border: 3px solid #667eea;
    transform: scale(1.05);
}

.pricing-card-popular:hover {
    transform: scale(1.08) translateY(-8px);
}

.popular-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(90deg, #667eea, #764ba2);
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.pricing-card-header {
    text-align: center;
    margin-bottom: 2rem;
}

.pricing-card-header h3 {
    color: #1f2937;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
}

.price {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.5rem;
}

.price-amount {
    font-size: 3rem;
    font-weight: 700;
    color: #1f2937;
}

.price-period {
    font-size: 1rem;
    color: #6b7280;
}

.trial-note {
    color: #10b981;
    font-size: 0.9rem;
    font-weight: 500;
    margin-top: 0.5rem;
}

.pricing-features {
    list-style: none;
    padding: 0;
    margin: 0 0 2rem 0;
    flex-grow: 1;
}

.pricing-features li {
    padding: 0.75rem 0;
    color: #374151;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
}

.pricing-features li:last-child {
    border-bottom: none;
}

.feature-check {
    color: #10b981;
    font-weight: 700;
    font-size: 1.2rem;
    flex-shrink: 0;
}

.pricing-footer {
    text-align: center;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    padding: 1.5rem;
    border-radius: 12px;
}

.pricing-footer p {
    color: white;
    margin: 0;
    font-size: 0.95rem;
}

/* Responsive Pricing */
@media (max-width: 768px) {
    .pricing-page {
        padding: 2rem 1rem;
    }
    
    .pricing-header h1 {
        font-size: 2rem;
    }
    
    .pricing-grid {
        grid-template-columns: 1fr;
    }
    
    .pricing-card-popular {
        transform: scale(1);
    }
    
    .pricing-card-popular:hover {
        transform: translateY(-4px);
    }
}
```

---

## 🔧 Backend Setup (Required for Stripe)

### Option A: Vercel Serverless Function (Easiest)

Create `/api/create-checkout-session.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { priceId, userId, userEmail, tier } = req.body;

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer_email: userEmail,
            client_reference_id: userId,
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            subscription_data: {
                trial_period_days: 14,
                metadata: {
                    userId: userId,
                    tier: tier
                }
            },
            success_url: `${process.env.DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.DOMAIN}/pricing`,
            metadata: {
                userId: userId,
                tier: tier
            }
        });

        res.status(200).json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
};
```

Create `/api/stripe-webhook.js` (to handle subscription events):

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            // Update user's subscription in Supabase
            await supabase
                .from('profiles')
                .update({
                    subscription_status: 'trial',
                    subscription_plan: session.metadata.tier,
                    stripe_customer_id: session.customer,
                    stripe_subscription_id: session.subscription,
                    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                })
                .eq('id', session.client_reference_id);
            break;

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            const subscription = event.data.object;
            // Update subscription status
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('stripe_subscription_id', subscription.id)
                .single();

            if (profile) {
                await supabase
                    .from('profiles')
                    .update({
                        subscription_status: subscription.status,
                        subscription_plan: subscription.status === 'active' 
                            ? subscription.metadata.tier 
                            : 'free'
                    })
                    .eq('id', profile.id);
            }
            break;

        case 'invoice.payment_succeeded':
            // Handle successful payment
            break;

        case 'invoice.payment_failed':
            // Handle failed payment
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};
```

### Environment Variables (Add to Vercel)

```
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DOMAIN=https://yourdomain.com
```

---

## 📊 User Flow

### New User Journey:

```
1. User signs up
    ↓
2. See pricing page (first time only)
    ↓
3. Choose:
    a) Continue with Free → Platform Selector
    b) Start Pro/Business Trial → Stripe Checkout
    ↓
4. If trial: Enter payment info
    ↓
5. Redirected back to platform
    ↓
6. Full access for 14 days
    ↓
7. After 14 days:
    - Auto-charge if didn't cancel
    - Downgrade to Free if cancelled
```

### Feature Gating:

```javascript
// Example: Check before showing retention dashboard
if (!dashboard.canAccessFeature('retention_dashboard')) {
    dashboard.showUpgradePrompt('retention_dashboard');
    return;
}

// Show the feature
dashboard.showRetentionDashboard();
```

---

## 💡 Alternative: Simple Gumroad Approach

If you want **even simpler** (no webhooks, no backend):

### Setup:
1. Create products on [Gumroad](https://gumroad.com)
2. Add "Buy" buttons to your pricing page
3. User purchases → receives license key via email
4. User enters license key in your app
5. App validates key against Gumroad API
6. Grant access

**Pros:**
- No backend needed
- No Stripe setup
- Very simple

**Cons:**
- Less professional
- No automatic trials
- Manual license management
- No subscription auto-renewal

---

## 🎯 Recommended Launch Strategy

### Phase 1: Soft Launch (Week 1)
- Deploy to Vercel
- Enable Stripe test mode
- Add 10-20 beta users
- Test checkout flow
- Fix any bugs

### Phase 2: Public Beta (Week 2-4)
- Switch to Stripe live mode
- Launch on Product Hunt
- Post on eBay seller forums
- Offer extended trial (30 days) for early adopters
- Gather feedback

### Phase 3: Full Launch (Month 2)
- Add testimonials to pricing page
- Create landing page with benefits
- Start paid ads (Facebook, Google)
- Partner with eBay influencers
- Scale up support

---

## 📈 Pricing Strategy

### Recommended Pricing:

**Free**: $0
- Good for trying out
- Limited enough to encourage upgrade
- Still useful

**Pro**: $9.99/month or $99/year
- Sweet spot for individual sellers
- Most users will choose this
- 20% yearly discount

**Business**: $19.99/month or $199/year
- For power users
- 10-20% of paid users
- High margin

### Why This Works:
- **$9.99 is impulse-buy territory** - easy to say yes
- **14-day trial converts at 25%+** - industry standard
- **Yearly plans boost LTV** - get 10 months upfront
- **Three tiers = anchoring** - makes Pro look like great deal

---

## ✅ Implementation Checklist

- [ ] Create Stripe account
- [ ] Create products & prices in Stripe
- [ ] Add Stripe.js to your app
- [ ] Create `stripe-config.js` with your keys
- [ ] Add pricing page HTML
- [ ] Add pricing page CSS
- [ ] Add Stripe methods to script.js
- [ ] Create Vercel serverless functions
- [ ] Add environment variables to Vercel
- [ ] Test checkout flow (test mode)
- [ ] Set up Stripe webhook
- [ ] Test trial → paid conversion
- [ ] Switch to live mode
- [ ] Launch! 🚀

---

## 🆘 Support & Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Billing](https://stripe.com/docs/billing)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

---

**Questions?** DM me or check the Stripe docs - their support is excellent!

