-- Kitta Database Initialization Schema
-- This script creates the complete 24-Hour Lazy Cache database structure.

-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-------------------------------------------------------------------------------
-- 1. AUTHENTICATION & PROFILES
-------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to prevent errors on multiple runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-------------------------------------------------------------------------------
-- 2. WATCHLISTS SYSTEM
-------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,  -- Made nullable for MVP
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a default watchlist for MVP (no auth)
INSERT INTO public.watchlists (id, name) 
VALUES ('3abec7be-0a38-46f6-aacb-b7f0d6732ef7', 'Default Watchlist')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(watchlist_id, symbol)
);


-------------------------------------------------------------------------------
-- 3. THE 24-HOUR STOCK CACHE
-------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.stock_cache (
    symbol TEXT PRIMARY KEY,
    company_name TEXT,
    latest_price NUMERIC,
    quant_metrics JSONB,          -- Stores Dashboard Metrics
    pe_ratio NUMERIC,             -- Extracted P/E Ratio
    rsi NUMERIC,                  -- Extracted 14-day RSI
    sparkline JSONB,              -- Stores 30-day close price array
    news_summary JSONB,           -- Stores Real-time News
    chart_storage_path TEXT,      -- References 'scraped_charts' bucket
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_stock_cache_expires ON public.stock_cache(expires_at);


-------------------------------------------------------------------------------
-- 4. CHAT HISTORY & AGENT MEMORY
-------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL,
    content TEXT,
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-------------------------------------------------------------------------------
-- 5. ALERTS SYSTEM
-------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    condition TEXT NOT NULL,  -- e.g., "price_above", "price_below", "rsi_oversold"
    target_value NUMERIC NOT NULL,
    message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON public.alerts(symbol);


-------------------------------------------------------------------------------
-- 5. STORAGE BUCKET CONFIGURATION
-------------------------------------------------------------------------------

-- Please manually create a public storage bucket named "scraped_charts" in the Supabase UI 
-- if you cannot run the following inserts (requires superuser on storage schema).
INSERT INTO storage.buckets (id, name, public) 
VALUES ('scraped_charts', 'scraped_charts', true)
ON CONFLICT (id) DO NOTHING;


-------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS)
-------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Watchlists: Full access to own watchlists OR public access for MVP (no auth)
CREATE POLICY "Users manage own watchlists" ON public.watchlists 
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Watchlist Items: Full access to items in own watchlists OR public access for MVP
CREATE POLICY "Users manage own watchlist items" ON public.watchlist_items 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.watchlists 
            WHERE id = watchlist_items.watchlist_id 
            AND (user_id = auth.uid() OR user_id IS NULL)
        )
    );

-- Stock Cache: Anyone can read. Only Service Role (Backend) can insert/update/delete.
CREATE POLICY "Anyone can read stock cache" ON public.stock_cache FOR SELECT USING (true);
-- Note: Service Role bypasses RLS automatically, so no need for an explicit INSERT policy for the backend.

-- Chat Sessions & Messages: Full access to own sessions
CREATE POLICY "Users manage own sessions" ON public.chat_sessions 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own messages" ON public.chat_messages 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions 
            WHERE id = chat_messages.session_id AND user_id = auth.uid()
        )
    );

-- Alerts: Users can manage their own alerts OR public access for MVP
CREATE POLICY "Users manage own alerts" ON public.alerts 
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);


-------------------------------------------------------------------------------
-- 7. CRON JOBS (THE 24-HOUR AUTO CLEANUP)
-------------------------------------------------------------------------------

-- This function drops expired cache rows.
CREATE OR REPLACE FUNCTION public.delete_expired_stock_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM public.stock_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the cleanup to run every hour at minute 0
-- (pg_cron will automatically create or update the job by name)
SELECT cron.schedule('hourly_cache_sweep', '0 * * * *', 'SELECT public.delete_expired_stock_cache()');

-- Note: To delete the actual files from Supabase Storage when a row is deleted, 
-- you will need to setup a Supabase Edge Function triggered by a Webhook, 
-- OR have your Python backend periodically check and wipe orphaned files.
