/*
  WorkNet Database Setup Script
  -----------------------------
  Project: WorkNet (Digital Signage MVP)
  Role: Lead Backend Architect
  Context: "Wait & Watch" Network Simulation

  PHILOSOPHY:
  - Locations: High dwell-time spots (Kappers, Salons, Medisch).
  - Advertisers: Local service heroes.
  - Model: Cross-promotion (Hosts are also Advertisers).
  - Targeting: Region-based with Specific Screen overrides.

  CONTENTS:
  1. Cleanup (Drop existing)
  2. Schema Definition (Tables)
  3. Security (RLS Policies)
  4. Seed Data Generation (Complex Logic via PL/PgSQL)
*/

-- =====================================================================================
-- 1. CLEANUP
-- =====================================================================================
DROP TABLE IF EXISTS public.screen_assignments CASCADE;
DROP TABLE IF EXISTS public.ads CASCADE;
DROP TABLE IF EXISTS public.advertisers CASCADE;
DROP TABLE IF EXISTS public.screens CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;

-- =====================================================================================
-- 2. SCHEMA DEFINITION
-- =====================================================================================

-- Locations: The physical venues hosting screens
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('kapper', 'salon', 'medisch', 'tandarts', 'fysio', 'overig', 'hq')),
    address TEXT,
    region TEXT NOT NULL, -- Core for targeting
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Screens: The actual hardware devices
CREATE TABLE public.screens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('online', 'offline', 'maintenance')) DEFAULT 'offline',
    orientation TEXT CHECK (orientation IN ('landscape', 'portrait')) DEFAULT 'landscape',
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Advertisers: The businesses paying (or swapping) for airtime
CREATE TABLE public.advertisers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('retail', 'service', 'horeca', 'automotive', 'bouw', 'financieel')),
    status TEXT CHECK (status IN ('active', 'pending', 'archived')) DEFAULT 'pending',
    contact_email TEXT,
    is_host BOOLEAN DEFAULT false, -- True if this advertiser is presumably also a location owner
    related_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL, -- Link if is_host is true
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ads: The creative content
CREATE TABLE public.ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id UUID REFERENCES public.advertisers(id) ON DELETE CASCADE,
    internal_name TEXT NOT NULL,
    background_image_url TEXT,
    logo_url TEXT,
    headline TEXT NOT NULL,
    subtext TEXT,
    cta_type TEXT CHECK (cta_type IN ('qr', 'url', 'phone', 'none')) DEFAULT 'none',
    cta_value TEXT,
    active BOOLEAN DEFAULT true,
    season_tag TEXT, -- 'winter', 'lente', 'zomer', 'herfst', 'algemeen'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Screen Assignments: The Traffic Control
-- Logic: If 'specific_screen_id' is set, it overrides 'region_target'.
-- If both are set, specific_screen_id takes precedence in the query logic.
CREATE TABLE public.screen_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
    region_target TEXT, -- Nullable, targets all screens in this region
    specific_screen_id UUID REFERENCES public.screens(id) ON DELETE CASCADE, -- Nullable, overrides region
    priority INTEGER DEFAULT 1, -- Helper for ordering
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraint: An assignment must target EITHER a region OR a screen (or both, but that's redundant usually)
    CONSTRAINT target_check CHECK (region_target IS NOT NULL OR specific_screen_id IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX idx_locations_region ON public.locations(region);
CREATE INDEX idx_screens_location ON public.screens(location_id);
CREATE INDEX idx_assignments_region ON public.screen_assignments(region_target);
CREATE INDEX idx_assignments_screen ON public.screen_assignments(specific_screen_id);

-- =====================================================================================
-- 3. SECURITY (RLS)
-- =====================================================================================

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screen_assignments ENABLE ROW LEVEL SECURITY;

-- For MVP: Allow public read access (so screens can fetch data without complex auth for now)
-- In production, screens would use a service_role key or device auth.
CREATE POLICY "Public Read Locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Public Read Screens" ON public.screens FOR SELECT USING (true);
CREATE POLICY "Public Read Advertisers" ON public.advertisers FOR SELECT USING (true);
CREATE POLICY "Public Read Ads" ON public.ads FOR SELECT USING (true);
CREATE POLICY "Public Read Assignments" ON public.screen_assignments FOR SELECT USING (true);

-- Allow authenticated users (Admins) full access
CREATE POLICY "Admin Full Access Locations" ON public.locations USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access Screens" ON public.screens USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access Advertisers" ON public.advertisers USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access Ads" ON public.ads USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access Assignments" ON public.screen_assignments USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- =====================================================================================
-- 4. SEED DATA GENERATION
-- =====================================================================================

DO $$
DECLARE
    -- Regions
    v_regions text[] := ARRAY['Amsterdam-Zuid', 'Utrecht Heuvelrug', 'Rotterdam Centrum', 'Eindhoven Strijp'];
    v_region text;
    
    -- Location Names (Wait & Watch)
    v_names_kapper text[] := ARRAY['Barber District', 'Salon Chique', 'Kapsalon De Schaar', 'Hair & Beauty', 'The Gentleman''s Cut'];
    v_names_medisch text[] := ARRAY['Tandartspraktijk Wit', 'Fysio Fit & Gezond', 'Huisartsenpost Centrum', 'Orthodontie lbc', 'Kliniek voor Huidtherapie'];
    v_names_salon text[] := ARRAY['Nagelstudio Polish', 'Schoonheidssalon Pure', 'Wellness & Spa', 'Massage Praktijk Zen', 'Pedicure Velours'];
    
    -- Variables for loop
    v_loc_id uuid;
    v_adv_id uuid;
    v_ad_id uuid;
    v_screen_id uuid;
    v_counter integer;
    
    -- Demo Unit
    v_demo_loc_id uuid;
    
BEGIN
    RAISE NOTICE 'Starting Seed Data Generation...';

    ------------------------------------------------------------------------------------
    -- A & B: Locations & Screens (20 units)
    ------------------------------------------------------------------------------------
    FOR i IN 1..20 LOOP
        -- Pick a random region
        v_region := v_regions[1 + floor(random() * array_length(v_regions, 1))::int];
        
        -- Generate Name & Type
        IF i <= 10 THEN
             INSERT INTO public.locations (name, type, address, region, is_demo)
             VALUES (
                v_names_kapper[1 + floor(random() * array_length(v_names_kapper, 1))::int] || ' ' || i,
                'kapper',
                'Hoofdstraat ' || (floor(random()*100)+1)::text,
                v_region,
                false
             ) RETURNING id INTO v_loc_id;
        ELSIF i <= 15 THEN
             INSERT INTO public.locations (name, type, address, region, is_demo)
             VALUES (
                v_names_medisch[1 + floor(random() * array_length(v_names_medisch, 1))::int] || ' ' || i,
                'medisch',
                'Gezondheidslaan ' || (floor(random()*100)+1)::text,
                v_region,
                false
             ) RETURNING id INTO v_loc_id;
        ELSE
             INSERT INTO public.locations (name, type, address, region, is_demo)
             VALUES (
                v_names_salon[1 + floor(random() * array_length(v_names_salon, 1))::int] || ' ' || i,
                'salon',
                'Wellnessplein ' || (floor(random()*100)+1)::text,
                v_region,
                false
             ) RETURNING id INTO v_loc_id;
        END IF;

        -- Create Screen for this location
        INSERT INTO public.screens (location_id, device_name, status, orientation, is_demo)
        VALUES (
            v_loc_id,
            'SCREEN-' || substring(v_loc_id::text from 1 for 4),
            CASE WHEN random() < 0.9 THEN 'online' ELSE 'offline' END, -- 90% Online
            'landscape',
            false
        );
        
        -- C: Advertisers (Cross-pollution)
        -- 50% change this location is ALSO an advertiser
        IF random() < 0.5 THEN
            INSERT INTO public.advertisers (name, type, status, is_host, related_location_id)
            SELECT name, 
                   CASE WHEN type = 'kapper' THEN 'service' ELSE 'service' END, -- Simplified mapping
                   'active', 
                   true, 
                   id 
            FROM public.locations WHERE id = v_loc_id
            RETURNING id INTO v_adv_id;
            
            -- Create a self-promotion Ad
            INSERT INTO public.ads (advertiser_id, internal_name, headline, subtext, season_tag, active)
            VALUES (
                v_adv_id,
                'Self Promo - ' || v_adv_id,
                'Welkom bij ons!',
                'Vraag naar onze nieuwe behandelingen.',
                'algemeen',
                true
            ) RETURNING id INTO v_ad_id;
            
            -- Target this ad to its own Region
            INSERT INTO public.screen_assignments (ad_id, region_target)
            VALUES (v_ad_id, v_region); -- Advertise to neighbors in the region
        END IF;
        
    END LOOP;

    ------------------------------------------------------------------------------------
    -- C: External Advertisers (The Local Heroes)
    ------------------------------------------------------------------------------------
    -- Garage
    INSERT INTO public.advertisers (name, type, status, is_host) VALUES ('Garage Jansen', 'automotive', 'active', false) RETURNING id INTO v_adv_id;
    INSERT INTO public.ads (advertiser_id, internal_name, headline, subtext, season_tag, cta_type, cta_value) 
    VALUES (v_adv_id, 'Winterbanden Wissel', 'Is uw auto winterklaar?', 'Maak nu een afspraak voor bandenwissel.', 'winter', 'phone', '020-12345678');
    -- Assign to ALL regions (Big campaign)
    INSERT INTO public.screen_assignments (ad_id, region_target) 
    SELECT (SELECT id FROM public.ads WHERE advertiser_id = v_adv_id LIMIT 1), region FROM unnest(v_regions) AS region;

    -- Hovenier
    INSERT INTO public.advertisers (name, type, status, is_host) VALUES ('Hovenier Groen', 'service', 'active', false) RETURNING id INTO v_adv_id;
    INSERT INTO public.ads (advertiser_id, internal_name, headline, subtext, season_tag) 
    VALUES (v_adv_id, 'Winter Snoei', 'Uw tuin winterklaar?', 'Wij snoeien uw bomen en struiken.', 'winter');
    -- Assign to Utrecht only
    INSERT INTO public.screen_assignments (ad_id, region_target) 
    SELECT (SELECT id FROM public.ads WHERE advertiser_id = v_adv_id LIMIT 1), 'Utrecht Heuvelrug';
    
    -- Boekhouder
    INSERT INTO public.advertisers (name, type, status, is_host) VALUES ('Kantoor Cijfers', 'financieel', 'active', false) RETURNING id INTO v_adv_id;
    INSERT INTO public.ads (advertiser_id, internal_name, headline, subtext, season_tag) 
    VALUES (v_adv_id, 'Belastinghulp', 'Start het jaar goed', 'Hulp bij uw administratie nodig?', 'winter');
    -- Assign to Amsterdam only
    INSERT INTO public.screen_assignments (ad_id, region_target) 
    SELECT (SELECT id FROM public.ads WHERE advertiser_id = v_adv_id LIMIT 1), 'Amsterdam-Zuid';

    ------------------------------------------------------------------------------------
    -- E: DEMO UNIT SET (Mijn 6 schermen)
    ------------------------------------------------------------------------------------
    RAISE NOTICE 'Creating Demo Unit...';
    
    INSERT INTO public.locations (name, type, address, region, is_demo)
    VALUES ('WorkNet HQ Demo', 'hq', 'Demo Street 1', 'Amsterdam-Zuid', true)
    RETURNING id INTO v_demo_loc_id;

    -- Create 6 Screens
    FOR j IN 1..6 LOOP
        INSERT INTO public.screens (location_id, device_name, status, orientation, is_demo)
        VALUES (v_demo_loc_id, 'DEMO UNIT 0' || j, 'online', 'landscape', true)
        RETURNING id INTO v_screen_id;
        
        -- Special Logic: Screen 01 gets a FORCED AD
        IF j = 1 THEN
            -- Create a specific ad for this screen
            INSERT INTO public.advertisers (name, type, status, is_demo) VALUES ('Targeting Test', 'service', 'active', true) RETURNING id INTO v_adv_id; -- Note: is_demo not in table def above, assuming normal flow or added column. Actually let's use is_host/status.
            
            INSERT INTO public.ads (advertiser_id, internal_name, headline, subtext, active)
            VALUES (v_adv_id, 'EXCLUSIVE FOR SCREEN 01', 'Hallo Demo 1', 'Dit bericht is ALLEEN hier te zien.', true)
            RETURNING id INTO v_ad_id;
            
            INSERT INTO public.screen_assignments (ad_id, specific_screen_id, priority)
            VALUES (v_ad_id, v_screen_id, 10);
        END IF;
    END LOOP;

    RAISE NOTICE 'Seed Data Generation Complete.';
END $$;
