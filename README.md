# 📊 eBay Analytics Pro

> **Professional business intelligence platform for serious eBay sellers**

A comprehensive, multi-user analytics platform that transforms your eBay business data into actionable insights. Track inventory, analyze sales performance, monitor customer retention, and optimize your entire operation.

---

## ✨ What's New

### 🔐 Multi-User Platform
- **User Authentication**: Secure login/signup with Supabase
- **Platform Selection**: Expandable architecture for multiple analytics tools
- **User-Specific Data**: Your data stays private and secure
- **Cloud Sync**: Business settings and collections saved to your account

### 🚀 Professional Features
- **Customer Retention Dashboard**: Track CLV, repeat buyers, and loyalty metrics
- **Geographic Analytics**: Interactive US state map showing sales distribution
- **Advanced Insights**: Competitive metrics, run-rate rankings, and performance trends
- **Collection Management**: Track purchase costs and calculate true profitability

---

## 🎯 Core Features

### **Executive Dashboard**
- 📈 Real-time business metrics
- 💰 Revenue and profit tracking
- 📊 Monthly and weekly performance charts
- 🎯 Active listings and sell-through rates

### **Inventory Analytics**
- 🏷️ Pricing analysis (overpriced, well-priced, underpriced)
- ⏱️ Aging inventory tracking
- 🔍 Smart recommendations engine
- 📦 Category performance breakdown

### **Sales Intelligence**
- 💵 Revenue trends and analysis
- 📅 Monthly/weekly performance tracking
- 🏆 Top-performing items
- 📉 Sales velocity metrics

### **Customer Retention**
- 🔁 Repeat customer analysis
- 💎 Customer Lifetime Value (CLV)
- 📊 Retention rates and trends
- 🗺️ Geographic sales distribution

### **Collection Management**
- 💰 Purchase cost tracking
- 📈 True profitability calculation
- 🎯 Collection performance metrics
- 🔍 Detailed item-level analysis

### **Business Settings**
- ⚙️ Configurable business metrics
- ⏰ Time per item tracking
- 💸 Tax and fee calculations
- 🎯 Ideal hourly rate targets

---

## 🚀 Getting Started

### **Option 1: Local Development**

1. **Clone or Download** this repository
2. **Open** `index.html` in your web browser
3. **Sign Up** for a free account (demo mode works without Supabase)
4. **Upload** your eBay CSV data
5. **Explore** your analytics!

### **Option 2: Production Deployment**

See `DEPLOYMENT_GUIDE.md` for detailed instructions on:
- Deploying to Vercel/Netlify
- Setting up Supabase
- Configuring payment processing
- Implementing subscription tiers

---

## 📊 Required Data Format

### **Inventory CSV** (from eBay Seller Hub)
```csv
Item Title,Current Price,Category,Condition,Days Listed,Views,Watchers,Quantity
```

### **Sales CSV** (from eBay Sold Items Report)
```csv
Item Title,Sold Price,Sold Date,Buyer Username,Quantity
```

### **Unsold CSV** (from eBay Unsold Items Report)
```csv
Item Title,Original Price,Reason,Date Ended
```

---

## 🔧 Technical Stack

### **Frontend**
- HTML5, CSS3, Vanilla JavaScript
- Chart.js for data visualizations
- SVG for interactive maps
- Responsive design for all devices

### **Authentication & Database**
- Supabase (PostgreSQL + Auth)
- Row Level Security (RLS) for data isolation
- JWT-based authentication
- Demo mode for local testing

### **Data Processing**
- Client-side CSV parsing
- In-memory data analysis (fast and secure)
- No server-side CSV storage (privacy-focused)

---

## 💡 Key Metrics Explained

### **Sell-Through Rate**
Percentage of inventory actively selling. Higher is better.
- **Formula**: (Watchers + Views/10) / Days Listed × 100
- **Target**: 30%+ indicates healthy inventory

### **Customer Lifetime Value (CLV)**
Average revenue per customer over their lifetime.
- **Repeat CLV**: Total revenue from repeat customers / # repeat customers
- **One-time CLV**: Revenue from one-time buyers

### **Retention Rate**
Percentage of customers who return to purchase again.
- **Monthly**: % of buyers from Month N who buy in Month N+1
- **Quarterly**: % of buyers who return within 90 days

### **Collection Profitability**
True profit after accounting for purchase costs.
- **Formula**: Total Sales - Purchase Costs - Fees
- **ROI**: (Profit / Purchase Cost) × 100

---

## 🎨 Screenshots & Demo

### Landing Page
Beautiful, modern interface with drag-and-drop CSV upload.

### Platform Selection
Choose from multiple analytics platforms (eBay Analytics, Amazon Analytics*, Multi-Platform Dashboard*).
*Coming soon

### Executive Dashboard
High-level KPIs, monthly trends, and weekly performance charts.

### Customer Retention
Deep insights into repeat buyers, CLV, and geographic distribution.

---

## 📈 Monetization Ready

This platform is **built for commercialization**:

✅ User authentication and management  
✅ Subscription-ready architecture  
✅ Feature gating capabilities  
✅ User-specific data isolation  
✅ Professional UI/UX  
✅ Scalable infrastructure  

See `DEPLOYMENT_GUIDE.md` for monetization strategies and pricing recommendations.

---

## 🗂️ Project Structure

```
ebay-inventory-analytics/
├── index.html                 # Main application UI
├── styles.css                 # Complete styling
├── script.js                  # Analytics engine & logic
├── supabase-config.js         # Supabase configuration
├── supabase-service.js        # Database service layer
├── supabase-schema.sql        # Database schema
├── README.md                  # This file
├── DEPLOYMENT_GUIDE.md        # Deployment & monetization guide
├── SUPABASE_SETUP.md          # Supabase setup instructions
├── ARCHITECTURE.md            # Technical architecture docs
└── QUICK_START.md             # Quick start guide
```

---

## 🔒 Security & Privacy

- **Data Privacy**: CSV data processed client-side only
- **Secure Authentication**: JWT-based with Supabase
- **Row Level Security**: Users only access their own data
- **HTTPS**: Enforced in production
- **No Data Leakage**: Collections and settings are user-specific

---

## 🌟 Pro Tips for eBay Sellers

### **Pricing Strategy**
- Review the **Pricing Analysis** tab weekly
- Adjust overpriced items that have been listed 30+ days
- Don't undervalue popular items - use market data

### **Customer Retention**
- Focus on **repeat buyers** - they're 3x more valuable
- Use the **Say Thanks** feature to build relationships
- Monitor **geographic trends** to target marketing

### **Inventory Management**
- Track **aging inventory** in the Inventory Dashboard
- Use **collection profitability** to guide buying decisions
- Monitor **sell-through rates** by category

### **Business Optimization**
- Set realistic **business metrics** in Settings
- Track your **true hourly rate** including time investment
- Use **monthly rankings** to set goals

---

## 🚀 Roadmap

### **Phase 1: Core Platform** ✅
- Multi-user authentication
- Platform selection interface
- User-specific data persistence

### **Phase 2: Enhanced Analytics** ✅
- Customer retention dashboard
- Geographic sales mapping
- Advanced competitive metrics

### **Phase 3: Monetization** (In Progress)
- Subscription tiers
- Payment processing
- Feature gating

### **Phase 4: Expansion** (Planned)
- Amazon Analytics platform
- Multi-platform dashboard
- API access for developers
- Mobile app

---

## 🤝 Contributing

This is a commercial project, but feedback and feature requests are welcome!

---

## 📞 Support

- **Documentation**: Check the `/docs` folder
- **Setup Help**: See `QUICK_START.md`
- **Deployment**: See `DEPLOYMENT_GUIDE.md`
- **Technical**: See `ARCHITECTURE.md`

---

## 📄 License

Proprietary - All rights reserved.

---

## 🎯 Perfect For

✅ Professional eBay sellers  
✅ Multi-store operators  
✅ Sports card dealers  
✅ Collectibles businesses  
✅ Part-time resellers  
✅ Anyone serious about eBay analytics  

---

**Ready to transform your eBay business?** 

Open `index.html` and get started in minutes! 🚀
