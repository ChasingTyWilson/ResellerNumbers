# Data Retention Strategy

## Current Architecture

### What's Stored Now:
✅ **Supabase (Persistent)**
- User account data (email, name, auth)
- Business metrics (hourly rate, tax bracket, fees, time per item)
- Collection purchase data (what you paid for items)

❌ **NOT Stored (Session Only)**
- CSV inventory data
- CSV sold data  
- CSV unsold data
- All calculated analytics

### Current Flow:
1. User logs in
2. User uploads CSV files
3. Data is parsed and analyzed in memory
4. User views dashboards
5. **User logs out → All CSV data is lost**

---

## Recommended Approach: **Incremental Data Storage**

### Why This is Better:

#### **For Users:**
✅ **Historical Tracking** - See how your business evolves over time  
✅ **Trend Analysis** - Month-over-month, year-over-year comparisons  
✅ **No Re-upload** - Just upload new data, system merges automatically  
✅ **True Profitability** - Calculate actual profit on sold items  
✅ **Customer Insights** - Better repeat customer tracking over time  

#### **For You (Monetization):**
✅ **Sticky Users** - Once they have historical data, they won't leave  
✅ **Premium Feature** - "Historical Data" can be Pro/Business tier only  
✅ **Higher Value** - Data = value, more data = more value  
✅ **Competitive Moat** - Competitors can't replicate historical insights  

---

## Implementation Strategy

### Option 1: **Smart Incremental Storage** (Recommended)

#### How It Works:
```javascript
// On CSV upload
1. Parse new CSV data
2. Check for duplicates using unique identifiers:
   - Inventory: Item Title + Listing ID (if available)
   - Sales: Item Title + Sale Date + Buyer + Price
   - Unsold: Item Title + End Date
3. Add only new records to Supabase
4. Update existing records if changed (e.g., price update)
5. Merge with historical data for display
```

#### Database Schema:
```sql
-- Inventory History Table
CREATE TABLE inventory_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    item_title TEXT NOT NULL,
    listing_id TEXT, -- eBay listing ID if available
    current_price DECIMAL(10,2),
    category TEXT,
    condition TEXT,
    days_listed INTEGER,
    views INTEGER,
    watchers INTEGER,
    quantity INTEGER,
    snapshot_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active', -- active, sold, ended
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, item_title, listing_id, snapshot_date)
);

-- Sales History Table
CREATE TABLE sales_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    item_title TEXT NOT NULL,
    sold_price DECIMAL(10,2) NOT NULL,
    sold_date DATE NOT NULL,
    buyer_username TEXT,
    buyer_location TEXT,
    quantity INTEGER DEFAULT 1,
    fees DECIMAL(10,2),
    shipping_cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, item_title, sold_date, buyer_username, sold_price)
);

-- Unsold History Table
CREATE TABLE unsold_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    item_title TEXT NOT NULL,
    original_price DECIMAL(10,2),
    reason TEXT,
    ended_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, item_title, ended_date)
);
```

#### User Experience:
```
First Upload:
- "Upload your eBay data to get started"
- System: "✅ 500 items imported, 0 duplicates"

Subsequent Uploads:
- "Upload your latest eBay data to update"
- System: "✅ 50 new items added, 450 existing items updated, 0 duplicates skipped"
```

#### Benefits:
✅ No duplicate data  
✅ Always up-to-date  
✅ Historical trends available  
✅ Lower storage costs (incremental only)  
✅ Fast merging with smart deduplication  

---

### Option 2: **Full Snapshot Storage**

#### How It Works:
```javascript
// On CSV upload
1. Parse entire CSV
2. Create a snapshot with timestamp
3. Store entire dataset as a snapshot
4. Allow users to view different time periods
```

#### Database Schema:
```sql
-- Data Snapshots Table
CREATE TABLE data_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    snapshot_date DATE NOT NULL,
    data_type TEXT NOT NULL, -- 'inventory', 'sold', 'unsold'
    data JSONB NOT NULL, -- Entire CSV as JSON
    item_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date, data_type)
);
```

#### Benefits:
✅ Simple implementation  
✅ Easy to view historical snapshots  
✅ No deduplication logic needed  

#### Drawbacks:
❌ Higher storage costs (full data each time)  
❌ Harder to track individual item history  
❌ More complex querying for trends  
❌ Can't easily detect changes to individual items  

---

### Option 3: **Hybrid Approach** (Best of Both)

#### How It Works:
```javascript
// Combines incremental + snapshots
1. Store individual records incrementally (deduped)
2. Also create monthly snapshots for time-travel
3. Users can view:
   - Current data (latest + incremental)
   - Historical snapshots (monthly view)
   - Individual item history (timeline)
```

#### Benefits:
✅ Best data integrity  
✅ Time-travel capabilities  
✅ Individual item tracking  
✅ Monthly snapshots for auditing  

#### Use Case:
- Pro Tier: Last 3 months of data
- Business Tier: Unlimited history + snapshots

---

## Recommended Implementation: **Option 1 (Smart Incremental)**

### Why:
1. **Lower storage costs** - Only store what's new/changed
2. **Better UX** - Automatic deduplication
3. **Scalable** - Works for 100 items or 10,000 items
4. **Fast queries** - Indexed by user + date
5. **Easy to implement** - Clear logic

### Deduplication Logic:

```javascript
async function uploadInventoryCSV(csvData) {
    const parsed = parseCSV(csvData);
    const newItems = [];
    const updatedItems = [];
    const duplicates = [];
    
    for (const item of parsed) {
        // Check if item exists
        const existing = await supabase
            .from('inventory_history')
            .select('*')
            .eq('user_id', userId)
            .eq('item_title', item.title)
            .eq('listing_id', item.listingId)
            .eq('status', 'active')
            .single();
        
        if (existing.data) {
            // Item exists - check if changed
            if (hasChanged(existing.data, item)) {
                updatedItems.push(item);
                // Update existing record
                await supabase
                    .from('inventory_history')
                    .update({
                        current_price: item.price,
                        days_listed: item.daysListed,
                        views: item.views,
                        watchers: item.watchers,
                        updated_at: new Date()
                    })
                    .eq('id', existing.data.id);
            } else {
                duplicates.push(item);
            }
        } else {
            // New item
            newItems.push(item);
            await supabase
                .from('inventory_history')
                .insert({
                    user_id: userId,
                    item_title: item.title,
                    listing_id: item.listingId,
                    current_price: item.price,
                    category: item.category,
                    condition: item.condition,
                    days_listed: item.daysListed,
                    views: item.views,
                    watchers: item.watchers,
                    quantity: item.quantity,
                    status: 'active'
                });
        }
    }
    
    // Show summary
    alert(`
        ✅ Upload Complete!
        • ${newItems.length} new items added
        • ${updatedItems.length} items updated
        • ${duplicates.length} duplicates skipped
    `);
}
```

### Handling Sold Items:

```javascript
// When user uploads sold CSV
// 1. Add to sales_history
// 2. Mark corresponding inventory item as 'sold'

async function uploadSoldCSV(csvData) {
    const parsed = parseCSV(csvData);
    
    for (const sale of parsed) {
        // Add to sales history (deduped)
        await supabase.from('sales_history').insert({
            user_id: userId,
            item_title: sale.title,
            sold_price: sale.price,
            sold_date: sale.date,
            buyer_username: sale.buyer,
            buyer_location: sale.location,
            quantity: sale.quantity
        }).onConflict('user_id,item_title,sold_date,buyer_username,sold_price')
        .ignore(); // Skip if duplicate
        
        // Mark inventory item as sold
        await supabase
            .from('inventory_history')
            .update({ status: 'sold' })
            .eq('user_id', userId)
            .eq('item_title', sale.title)
            .eq('status', 'active');
    }
}
```

---

## Storage Costs Estimation

### Supabase Free Tier:
- 500 MB database storage
- 2 GB bandwidth
- **Estimated capacity**: ~50,000 inventory records + sales

### Paid Tier ($25/month):
- 8 GB database storage
- 50 GB bandwidth
- **Estimated capacity**: ~800,000 records

### Cost per User:
- Average seller: 500 inventory items + 1000 sales/year
- **Storage per user**: ~1-2 MB
- **Cost**: ~$0.05/user/month

---

## Feature Tiering

### Free Tier:
- Last 30 days of data
- Current inventory snapshot only
- Basic analytics

### Pro Tier ($9.99/month):
- Last 12 months of data
- Historical trends
- Month-over-month comparisons
- Unlimited sales history

### Business Tier ($19.99/month):
- Unlimited historical data
- Monthly snapshots (time-travel)
- Advanced trend analysis
- Export all historical data
- API access

---

## Migration Plan

### Phase 1: Add Database Tables
1. Create inventory_history, sales_history, unsold_history tables
2. Add indexes for fast queries
3. Set up Row Level Security (RLS)

### Phase 2: Implement Upload Logic
1. Add deduplication logic to CSV upload
2. Show upload summary to users
3. Store incremental data in Supabase

### Phase 3: Update Analytics
1. Modify dashboards to use Supabase data + session data
2. Add "Historical" toggle for Pro/Business users
3. Show trend charts (month-over-month, etc.)

### Phase 4: Add Premium Features
1. Implement historical data access for Pro tier
2. Add time-travel snapshots for Business tier
3. Create data export functionality

---

## User Messaging

### First-Time Users:
```
"Welcome! Let's get started by uploading your eBay data.
Your data will be securely stored and updated each time you upload.
No need to re-upload everything - we'll track changes automatically!"
```

### Returning Users:
```
"Welcome back! Last upload: 2 days ago
Upload your latest eBay data to see updated analytics.
We'll automatically detect new sales and inventory changes."
```

### Free Tier Limit:
```
"🔒 Historical data is limited to 30 days on the Free tier.
Upgrade to Pro to access 12 months of trends and insights!"
```

---

## Recommendation

**Go with Option 1: Smart Incremental Storage**

### Implementation Order:
1. ✅ Start with incremental storage (Phase 1 & 2)
2. ✅ Test with your own data
3. ✅ Add historical analytics (Phase 3)
4. ✅ Implement feature tiering (Phase 4)
5. ⏳ Later: Add monthly snapshots if needed (Option 3)

### Why This Works:
- **Users love it** - No re-uploading, automatic updates
- **You save money** - Incremental storage is cheap
- **Competitive advantage** - Historical data locks users in
- **Scalable** - Works from 1 to 10,000 users
- **Easy to build** - Clear logic, simple queries

---

## Next Steps

Want me to implement the database schema and upload logic? I can:
1. Create the Supabase migration files
2. Update the CSV upload functions
3. Add deduplication logic
4. Create the upload summary UI
5. Update analytics to use stored data

Let me know and I'll get started! 🚀

