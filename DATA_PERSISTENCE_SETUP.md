# Data Persistence Setup Guide

## 🎉 What's New

Your eBay Analytics platform now includes **smart incremental data persistence** with automatic deduplication! Users can upload their eBay data multiple times, and the system will:

✅ **Automatically detect** new items  
✅ **Update** changed items (price, views, watchers)  
✅ **Skip** duplicate entries  
✅ **Track** historical trends over time  
✅ **Calculate** true profitability with purchase costs  

---

## 📋 Setup Steps

### Step 1: Apply Database Schema

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Click **"New query"**
4. Open `supabase-schema-v2.sql` and copy the entire contents
5. Paste into the SQL Editor
6. Click **"Run"** to execute

This will create:
- `inventory_history` table
- `sales_history` table
- `unsold_history` table
- `data_sync_status` table
- All necessary indexes and Row Level Security policies
- Helper views for common queries

### Step 2: Verify Tables

1. Go to **Database** > **Tables** in Supabase
2. Confirm you see the new tables:
   - ✅ inventory_history
   - ✅ sales_history
   - ✅ unsold_history
   - ✅ data_sync_status

3. Click on each table to verify structure

### Step 3: Test the System

1. **Open your app** in the browser
2. **Log in** or sign up
3. **Upload a CSV** (inventory, sales, or unsold)
4. **Watch the console** for sync progress:
   ```
   Syncing 500 items...
   ✅ Sync Complete!
   • 500 new items
   • 0 items updated
   • 0 unchanged
   ```

5. **Check file status** message:
   ```
   500 items loaded | 500 new, 0 updated
   ```

### Step 4: Test Deduplication

1. **Upload the same CSV again**
2. **Watch for deduplication**:
   ```
   ✅ Sync Complete!
   • 0 new items
   • 0 items updated
   • 500 unchanged
   ```

3. **Status message**:
   ```
   500 items loaded | 0 new, 0 updated
   ```

### Step 5: Test Updates

1. **Modify your CSV** (change a price or views count)
2. **Upload the modified CSV**
3. **Watch for updates**:
   ```
   ✅ Sync Complete!
   • 0 new items
   • 1 items updated
   • 499 unchanged
   ```

---

## 🔍 How It Works

### Data Flow

```
User uploads CSV
    ↓
Parse CSV data
    ↓
Store in memory (inventoryData, soldData, unsoldData)
    ↓
Sync to Supabase (if available)
    ↓
For each item:
    • Check if exists in database
    • If new → INSERT
    • If exists & changed → UPDATE
    • If exists & unchanged → SKIP
    ↓
Update sync status
    ↓
Show summary to user
```

### Deduplication Logic

#### Inventory Items
**Unique Key**: `user_id + item_title + snapshot_date + status`

- Same item on same day with same status = duplicate (skipped)
- Same item on different day = new snapshot
- Same item with changed metrics = update existing

#### Sales
**Unique Key**: `user_id + item_title + sold_date + buyer_username + sold_price`

- Exact same sale = duplicate (skipped)
- Different buyer or date = new sale

#### Unsold Items
**Unique Key**: `user_id + item_title + ended_date`

- Same item ended on same day = duplicate (skipped)
- Same item ended on different day = new entry

---

## 📊 Database Structure

### inventory_history
Stores current and historical inventory snapshots.

**Key Fields:**
- `item_title` - Item name
- `current_price` - Current listing price
- `views`, `watchers` - Performance metrics
- `days_listed` - How long it's been listed
- `status` - active, sold, ended, relisted
- `snapshot_date` - Date of this snapshot

**Indexes:**
- `user_id + status` - Fast query for active inventory
- `user_id + snapshot_date` - Historical trends
- `user_id + item_title` - Item history

### sales_history
Stores all sales with buyer information.

**Key Fields:**
- `item_title` - What was sold
- `sold_price` - Sale price
- `sold_date` - When it sold
- `buyer_username` - Who bought it
- `buyer_state` - Geographic data
- `net_profit` - Calculated profit (if purchase cost known)

**Indexes:**
- `user_id + sold_date` - Date range queries
- `user_id + buyer_username` - Repeat customer analysis
- `collection_id` - Link to collection purchase costs

### unsold_history
Tracks ended listings that didn't sell.

**Key Fields:**
- `item_title` - What ended
- `original_price` - Listed price
- `reason` - Why it ended (expired, out of stock, etc.)
- `ended_date` - When it ended
- `final_views`, `final_watchers` - Performance before ending

### data_sync_status
Tracks user's sync state.

**Key Fields:**
- `last_inventory_sync` - Last inventory upload time
- `last_sales_sync` - Last sales upload time
- `total_inventory_items` - Total items in database
- `total_sales` - Total sales recorded
- `earliest_data_date` - First data point
- `latest_data_date` - Most recent data point

---

## 🎯 User Experience

### First Upload
```
User: Uploads inventory.csv (500 items)
System: "Syncing 500 items..."
System: "✅ 500 items loaded | 500 new, 0 updated"
Console: "✅ Sync Complete!
         • 500 new items
         • 0 items updated
         • 0 unchanged"
```

### Second Upload (Same Data)
```
User: Uploads same inventory.csv
System: "Syncing 500 items..."
System: "✅ 500 items loaded | 0 new, 0 updated"
Console: "✅ Sync Complete!
         • 0 new items
         • 0 items updated
         • 500 unchanged"
```

### Third Upload (10 New Items, 5 Changed)
```
User: Uploads updated inventory.csv (510 items)
System: "Syncing 510 items..."
System: "✅ 510 items loaded | 10 new, 5 updated"
Console: "✅ Sync Complete!
         • 10 new items
         • 5 items updated
         • 495 unchanged"
```

---

## 🛡️ Fallback Behavior

### If Supabase is Not Available
```javascript
// System automatically falls back to session-only mode
System: "500 items loaded successfully (session only)"
Console: "Supabase not available - skipping data sync"
```

**What This Means:**
- Data still works perfectly in the current session
- Analytics and dashboards function normally
- Data is NOT saved between sessions
- User must re-upload CSV each time they visit

### If Sync Fails
```javascript
System: "500 items loaded (sync failed, using session only)"
Console: "Error syncing to Supabase: [error details]"
```

**What This Means:**
- Data loaded successfully in memory
- All features work for this session
- Data not persisted to database
- Next upload will try again

---

## 🔧 Advanced Features

### View Helpers

The schema includes pre-built views for common queries:

#### Active Inventory View
```sql
SELECT * FROM active_inventory WHERE user_id = 'user-uuid';
```
Returns: Latest snapshot of each active inventory item

#### Monthly Sales Summary View
```sql
SELECT * FROM monthly_sales_summary 
WHERE user_id = 'user-uuid'
ORDER BY month DESC;
```
Returns: Revenue, sales count, avg price by month

#### Repeat Customers View
```sql
SELECT * FROM repeat_customers 
WHERE user_id = 'user-uuid'
ORDER BY purchase_count DESC;
```
Returns: Customers who bought 2+ times with stats

### Manual Queries

#### Get Item History
```sql
SELECT * FROM inventory_history
WHERE user_id = 'user-uuid'
AND item_title = 'Some Item Name'
ORDER BY snapshot_date DESC;
```

#### Calculate Monthly Growth
```sql
SELECT 
  DATE_TRUNC('month', sold_date) as month,
  COUNT(*) as sales,
  SUM(sold_price) as revenue
FROM sales_history
WHERE user_id = 'user-uuid'
GROUP BY month
ORDER BY month DESC;
```

#### Find Top Buyers
```sql
SELECT 
  buyer_username,
  COUNT(*) as purchases,
  SUM(sold_price) as total_spent,
  AVG(sold_price) as avg_order
FROM sales_history
WHERE user_id = 'user-uuid'
AND buyer_username IS NOT NULL
GROUP BY buyer_username
HAVING COUNT(*) > 1
ORDER BY total_spent DESC
LIMIT 20;
```

---

## 📈 Storage Estimates

### Per User (Average Seller)
- **500 inventory items**: ~100 KB
- **1,000 sales/year**: ~200 KB
- **100 unsold items**: ~20 KB
- **Total**: ~320 KB per user per year

### Supabase Free Tier
- **500 MB storage**: ~1,500 users
- **2 GB bandwidth**: ~6,000 page loads/month

### Paid Tier ($25/month)
- **8 GB storage**: ~25,000 users
- **50 GB bandwidth**: ~150,000 page loads/month

**Cost per user**: ~$0.001/month = **$1 per 1,000 users**

---

## 🚀 Next Steps

### Phase 1: Basic Persistence (Complete)
✅ Database schema  
✅ Sync methods  
✅ Deduplication logic  
✅ Status indicators  

### Phase 2: Historical Analytics (Next)
- [ ] Month-over-month trend charts
- [ ] Year-over-year comparisons
- [ ] Historical sell-through rates
- [ ] Price change tracking

### Phase 3: Advanced Features
- [ ] Data export (all historical data)
- [ ] Time-travel (view data from past dates)
- [ ] Automated insights ("Your prices increased 10% this month")
- [ ] Predictive analytics (ML-based forecasting)

---

## 🐛 Troubleshooting

### Issue: Sync Always Shows "0 new, 0 updated"
**Cause**: Data already exists in database  
**Solution**: This is correct behavior - system is working!

### Issue: Sync Shows Error
**Check:**
1. Supabase project is running
2. Database tables exist (run schema SQL)
3. RLS policies are enabled
4. User is authenticated
5. Check browser console for detailed error

### Issue: Duplicate Items Still Created
**Check:**
1. Item titles are exactly the same (case-sensitive)
2. Dates are in correct format
3. Status field matches ('active', not 'Active')

### Issue: Performance Slow with Large CSV
**Optimization:**
- Batch inserts (current: 1 at a time)
- Use transactions
- Increase Supabase connection pool
- Add caching layer

---

## 📝 Migration Notes

### Updating from Old Schema
If you already have `inventory_data` and `sold_data` tables:

1. **Backup existing data**
2. **Run new schema** (creates new tables)
3. **Migrate data** (optional):
   ```sql
   -- Example migration for inventory
   INSERT INTO inventory_history (user_id, item_title, current_price, ...)
   SELECT user_id, data->>'Item Title', (data->>'Current Price')::decimal, ...
   FROM inventory_data;
   ```
4. **Test thoroughly**
5. **Drop old tables** (after confirming)

---

## ✅ Success Checklist

After setup, verify:

- [ ] Database tables created in Supabase
- [ ] RLS policies active (lock icon in Supabase)
- [ ] User can upload CSV
- [ ] Sync status shows in console
- [ ] File status shows "X new, Y updated"
- [ ] Re-uploading same file shows "0 new, 0 updated"
- [ ] Modifying CSV and re-uploading shows updates
- [ ] Data persists between sessions
- [ ] Different users see only their own data

---

**Questions?** Check the console logs for detailed sync information!

