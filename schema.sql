-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ENUMS & TYPES
-- -----------------------------------------------------------------------------

CREATE TYPE project_status AS ENUM ('pending', 'building', 'completed', 'failed');
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'closed');

-- -----------------------------------------------------------------------------
-- 2. TABLES
-- -----------------------------------------------------------------------------

-- PROFILES
-- Linked to auth.users via Trigger
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    preferences JSONB DEFAULT '{"project_emails": true, "newsletter": false}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECTS
-- Main table for user generated sites
CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'landing', 'portfolio', etc.
    status project_status DEFAULT 'pending',
    config_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- Stores wizard data
    url TEXT, -- Deployed URL
    preview_url TEXT, -- Internal preview URL
    thumbnail_url TEXT,
    subdomain TEXT UNIQUE, -- e.g. myproject.webforge.ai
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTIONS
-- Manages user billing state
CREATE TABLE public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_id subscription_plan DEFAULT 'free',
    status subscription_status DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUPPORT TICKETS
-- For contact form
CREATE TABLE public.support_tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable for public contact
    email TEXT NOT NULL,
    name TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status ticket_status DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SHOWCASE PROJECTS
-- Public portfolio items (Admin managed)
CREATE TABLE public.showcase_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    url TEXT,
    category TEXT NOT NULL, -- 'business', 'portfolio', etc.
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_projects ENABLE ROW LEVEL SECURITY;

-- POLICIES: PROFILES
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- POLICIES: PROJECTS
CREATE POLICY "Users can view own projects" 
    ON public.projects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" 
    ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" 
    ON public.projects FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" 
    ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- POLICIES: SUBSCRIPTIONS
CREATE POLICY "Users can view own subscription" 
    ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Only service_role should update subscriptions usually, but for demo/dev:
CREATE POLICY "Users can update own subscription" 
    ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- POLICIES: SUPPORT TICKETS
CREATE POLICY "Anyone can create a ticket" 
    ON public.support_tickets FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own tickets" 
    ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);

-- POLICIES: SHOWCASE PROJECTS
CREATE POLICY "Public can view showcase" 
    ON public.showcase_projects FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- 4. TRIGGERS & FUNCTIONS
-- -----------------------------------------------------------------------------

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    
    -- Initialize free subscription
    INSERT INTO public.subscriptions (user_id, plan_id, status)
    VALUES (new.id, 'free', 'active');

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_timestamp_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER set_timestamp_projects
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- -----------------------------------------------------------------------------
-- 5. REALTIME
-- -----------------------------------------------------------------------------

-- Add projects to supabase_realtime publication to allow dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

-- -----------------------------------------------------------------------------
-- 6. SEED DATA (Optional - For Showcase)
-- -----------------------------------------------------------------------------

INSERT INTO public.showcase_projects (title, category, description, image_url, tags)
VALUES 
('Studio Architecture', 'business', 'Site vitrine minimaliste pour architectes.', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800', ARRAY['Minimalist', 'Corporate']),
('Sarah Designer', 'portfolio', 'Portfolio créatif mode sombre.', 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800', ARRAY['Creative', 'Dark Mode']),
('EcoShop', 'ecommerce', 'Boutique produits écologiques.', 'https://images.unsplash.com/photo-1472851294608-4151713425a5?auto=format&fit=crop&w=800', ARRAY['Shop', 'Green']);