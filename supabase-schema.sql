-- ============================================
-- SUPABASE DATABASE SCHEMA
-- eBay Business Analytics Platform
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (Extended Supabase Auth)
-- ============================================
-- Note: Supabase auth.users table is already created
-- We'll create a public.profiles table for additional user data

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    subscription_status TEXT DEFAULT 'trial', -- trial, active, canceled, expired
    subscription_plan TEXT DEFAULT 'free', -- free, pro, enterprise
    trial_ends_at TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see and update their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- BUSINESS METRICS TABLE
-- ============================================
CREATE TABLE public.business_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    minutes_per_item INTEGER DEFAULT 0,
    ideal_hourly_rate DECIMAL(10,2) DEFAULT 0,
    avg_fee_percent DECIMAL(5,2) DEFAULT 0,
    tax_bracket DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business metrics"
    ON public.business_metrics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business metrics"
    ON public.business_metrics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business metrics"
    ON public.business_metrics FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- COLLECTIONS TABLE
-- ============================================
CREATE TABLE public.collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_collections_user_id ON public.collections(user_id);
CREATE INDEX idx_collections_sku ON public.collections(user_id, sku);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections"
    ON public.collections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
    ON public.collections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
    ON public.collections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
    ON public.collections FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- INVENTORY DATA TABLE
-- ============================================
CREATE TABLE public.inventory_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    data JSONB NOT NULL, -- Store the entire inventory CSV data as JSON
    row_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_user_id ON public.inventory_data(user_id);
CREATE INDEX idx_inventory_upload_date ON public.inventory_data(user_id, upload_date DESC);

ALTER TABLE public.inventory_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory data"
    ON public.inventory_data FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory data"
    ON public.inventory_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory data"
    ON public.inventory_data FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- SOLD DATA TABLE
-- ============================================
CREATE TABLE public.sold_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    data JSONB NOT NULL, -- Store the entire sold orders CSV data as JSON
    row_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sold_user_id ON public.sold_data(user_id);
CREATE INDEX idx_sold_upload_date ON public.sold_data(user_id, upload_date DESC);

ALTER TABLE public.sold_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sold data"
    ON public.sold_data FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sold data"
    ON public.sold_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sold data"
    ON public.sold_data FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_metrics_updated_at
    BEFORE UPDATE ON public.business_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON public.collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKETS (For future CSV file uploads)
-- ============================================
-- Uncomment when ready to use file storage
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('user-data', 'user-data', false);

-- CREATE POLICY "Users can upload own files"
--     ON storage.objects FOR INSERT
--     WITH CHECK (
--         bucket_id = 'user-data' 
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );

-- CREATE POLICY "Users can view own files"
--     ON storage.objects FOR SELECT
--     USING (
--         bucket_id = 'user-data' 
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );


