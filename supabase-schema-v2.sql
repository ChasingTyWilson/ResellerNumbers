-- ============================================
-- eBay Analytics Pro - Data Persistence Schema
-- Version 2.0 - Incremental Storage with Deduplication
-- ============================================

-- ============================================
-- INVENTORY HISTORY TABLE
-- Stores historical inventory snapshots with deduplication
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Item Identifiers
    item_title TEXT NOT NULL,
    listing_id TEXT, -- eBay listing ID if available
    custom_sku TEXT, -- User's custom SKU if any
    
    -- Pricing & Details
    current_price DECIMAL(10,2),
    category TEXT,
    condition TEXT,
    quantity INTEGER DEFAULT 1,
    
    -- Performance Metrics
    days_listed INTEGER,
    views INTEGER DEFAULT 0,
    watchers INTEGER DEFAULT 0,
    
    -- Status Tracking
    status TEXT DEFAULT 'active', -- active, sold, ended, relisted
    snapshot_date DATE DEFAULT CURRENT_DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for fast queries
    CONSTRAINT unique_inventory_snapshot UNIQUE(user_id, item_title, snapshot_date, status)
);

-- Indexes for inventory_history
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory_history(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_history(user_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_snapshot_date ON inventory_history(user_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_title ON inventory_history(user_id, item_title);

-- ============================================
-- SALES HISTORY TABLE
-- Stores all sales with deduplication
-- ============================================
CREATE TABLE IF NOT EXISTS sales_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Item Details
    item_title TEXT NOT NULL,
    listing_id TEXT,
    
    -- Sale Information
    sold_price DECIMAL(10,2) NOT NULL,
    sold_date DATE NOT NULL,
    quantity INTEGER DEFAULT 1,
    
    -- Buyer Information
    buyer_username TEXT,
    buyer_location TEXT,
    buyer_state TEXT,
    
    -- Financial Details
    fees DECIMAL(10,2),
    shipping_cost DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    net_profit DECIMAL(10,2), -- Calculated: sold_price - fees - shipping - purchase_cost
    
    -- Link to collection (if item was from a collection)
    collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    purchase_cost DECIMAL(10,2), -- From collection or manual entry
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate sales
    CONSTRAINT unique_sale UNIQUE(user_id, item_title, sold_date, buyer_username, sold_price)
);

-- Indexes for sales_history
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_history(user_id, sold_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_buyer ON sales_history(user_id, buyer_username);
CREATE INDEX IF NOT EXISTS idx_sales_title ON sales_history(user_id, item_title);
CREATE INDEX IF NOT EXISTS idx_sales_collection ON sales_history(collection_id);

-- ============================================
-- UNSOLD HISTORY TABLE
-- Tracks ended/unsold listings
-- ============================================
CREATE TABLE IF NOT EXISTS unsold_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Item Details
    item_title TEXT NOT NULL,
    listing_id TEXT,
    
    -- Unsold Information
    original_price DECIMAL(10,2),
    reason TEXT, -- ended, out_of_stock, error, etc.
    ended_date DATE NOT NULL,
    
    -- Performance Before Ending
    final_views INTEGER DEFAULT 0,
    final_watchers INTEGER DEFAULT 0,
    days_active INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicates
    CONSTRAINT unique_unsold UNIQUE(user_id, item_title, ended_date)
);

-- Indexes for unsold_history
CREATE INDEX IF NOT EXISTS idx_unsold_user_id ON unsold_history(user_id);
CREATE INDEX IF NOT EXISTS idx_unsold_date ON unsold_history(user_id, ended_date DESC);
CREATE INDEX IF NOT EXISTS idx_unsold_title ON unsold_history(user_id, item_title);

-- ============================================
-- DATA SYNC STATUS TABLE
-- Tracks user's data sync status
-- ============================================
CREATE TABLE IF NOT EXISTS data_sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Sync Statistics
    last_inventory_sync TIMESTAMP WITH TIME ZONE,
    last_sales_sync TIMESTAMP WITH TIME ZONE,
    last_unsold_sync TIMESTAMP WITH TIME ZONE,
    
    total_inventory_items INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    total_unsold INTEGER DEFAULT 0,
    
    -- Data Range
    earliest_data_date DATE,
    latest_data_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Index for data_sync_status
CREATE INDEX IF NOT EXISTS idx_sync_user_id ON data_sync_status(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Ensure users can only access their own data
-- ============================================

-- Enable RLS on all tables
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsold_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sync_status ENABLE ROW LEVEL SECURITY;

-- Policies for inventory_history
CREATE POLICY "Users can view own inventory history"
    ON inventory_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory history"
    ON inventory_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory history"
    ON inventory_history FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory history"
    ON inventory_history FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for sales_history
CREATE POLICY "Users can view own sales history"
    ON sales_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales history"
    ON sales_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales history"
    ON sales_history FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales history"
    ON sales_history FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for unsold_history
CREATE POLICY "Users can view own unsold history"
    ON unsold_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own unsold history"
    ON unsold_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own unsold history"
    ON unsold_history FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own unsold history"
    ON unsold_history FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for data_sync_status
CREATE POLICY "Users can view own sync status"
    ON data_sync_status FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync status"
    ON data_sync_status FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync status"
    ON data_sync_status FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_inventory_history_updated_at BEFORE UPDATE ON inventory_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_sync_status_updated_at BEFORE UPDATE ON data_sync_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Active inventory view
CREATE OR REPLACE VIEW active_inventory AS
SELECT DISTINCT ON (user_id, item_title)
    id,
    user_id,
    item_title,
    listing_id,
    current_price,
    category,
    condition,
    quantity,
    days_listed,
    views,
    watchers,
    status,
    snapshot_date,
    updated_at
FROM inventory_history
WHERE status = 'active'
ORDER BY user_id, item_title, snapshot_date DESC;

-- Monthly sales summary view
CREATE OR REPLACE VIEW monthly_sales_summary AS
SELECT
    user_id,
    DATE_TRUNC('month', sold_date) as month,
    COUNT(*) as total_sales,
    SUM(sold_price) as total_revenue,
    AVG(sold_price) as avg_sale_price,
    SUM(net_profit) as total_profit
FROM sales_history
GROUP BY user_id, DATE_TRUNC('month', sold_date)
ORDER BY month DESC;

-- Repeat customers view
CREATE OR REPLACE VIEW repeat_customers AS
SELECT
    user_id,
    buyer_username,
    COUNT(*) as purchase_count,
    SUM(sold_price) as total_spent,
    MIN(sold_date) as first_purchase,
    MAX(sold_date) as last_purchase,
    AVG(sold_price) as avg_order_value
FROM sales_history
WHERE buyer_username IS NOT NULL
GROUP BY user_id, buyer_username
HAVING COUNT(*) > 1
ORDER BY purchase_count DESC;

-- ============================================
-- MIGRATION NOTES
-- ============================================
-- 
-- To apply this schema:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Create new query
-- 3. Paste this entire file
-- 4. Run query
-- 5. Verify tables are created in Database section
--
-- To rollback:
-- DROP TABLE IF EXISTS inventory_history CASCADE;
-- DROP TABLE IF EXISTS sales_history CASCADE;
-- DROP TABLE IF EXISTS unsold_history CASCADE;
-- DROP TABLE IF EXISTS data_sync_status CASCADE;
-- DROP VIEW IF EXISTS active_inventory;
-- DROP VIEW IF EXISTS monthly_sales_summary;
-- DROP VIEW IF EXISTS repeat_customers;
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
-- ============================================

