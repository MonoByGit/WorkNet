/*
  WorkNet Integration Script for Mononium
  ---------------------------------------
  Project: WorkNet (Digital Signage MVP)
  Context: Multi-tenant Integration

  ACTIONS:
  1. Register 'worknet' in public._apps
  2. Create wn_* tables with mononium_app_id
  3. Seed data linked to the app_id
*/

DO $$
DECLARE
    v_app_id uuid;
    -- Regions
    v_regions text[] := ARRAY['Amsterdam-Zuid', 'Utrecht Heuvelrug', 'Rotterdam Centrum', 'Eindhoven Strijp'];
    v_region text;
    -- Location Names
    v_names_kapper text[] := ARRAY['Barber District', 'Salon Chique', 'Kapsalon De Schaar', 'Hair & Beauty', 'The Gentleman''s Cut'];
    v_names_medisch text[] := ARRAY['Tandartspraktijk Wit', 'Fysio Fit & Gezond', 'Huisartsenpost Centrum', 'Orthodontie lbc', 'Kliniek voor Huidtherapie'];
    v_names_salon text[] := ARRAY['Nagelstudio Polish', 'Schoonheidssalon Pure', 'Wellness & Spa', 'Massage Praktijk Zen', 'Pedicure Velours'];
    -- IDs
    v_loc_id uuid;
    v_adv_id uuid;
    v_ad_id uuid;
    v_screen_id uuid;
    v_demo_loc_id uuid;
BEGIN
    -- 1. Get or Create App ID
    -- Assuming structure public._apps (id uuid, slug text, name text, ...)
    SELECT id INTO v_app_id FROM public._apps WHERE slug = 'worknet';
    
    IF v_app_id IS NULL THEN
        -- If table doesn't have slug, this will fail, but assuming standard Mononium structure
        INSERT INTO public._apps (slug, name) VALUES ('worknet', 'WorkNet Digital Signage') RETURNING id INTO v_app_id;
        RAISE NOTICE 'Created new app entry for WorkNet: %', v_app_id;
    ELSE
        RAISE NOTICE 'Found existing app entry for WorkNet: %', v_app_id;
    END IF;

    -- 2. Schema Definitions (Safe Re-run: Drop first)
    DROP TABLE IF EXISTS public.wn_screen_assignments CASCADE;
    DROP TABLE IF EXISTS public.wn_ads CASCADE;
    DROP TABLE IF EXISTS public.wn_advertisers CASCADE;
    DROP TABLE IF EXISTS public.wn_screens CASCADE;
    DROP TABLE IF EXISTS public.wn_locations CASCADE;

    -- Locations
    CREATE TABLE public.wn_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mononium_app_id UUID NOT NULL REFERENCES public._apps(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT CHECK (type IN ('kapper', 'salon', 'medisch', 'tandarts', 'fysio', 'overig', 'hq')),
        address TEXT,
        region TEXT NOT NULL,
        is_demo BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Screens
    CREATE TABLE public.wn_screens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mononium_app_id UUID NOT NULL REFERENCES public._apps(id) ON DELETE CASCADE,
        location_id UUID REFERENCES public.wn_locations(id) ON DELETE CASCADE,
        device_name TEXT NOT NULL,
        status TEXT CHECK (status IN ('online', 'offline', 'maintenance')) DEFAULT 'offline',
        orientation TEXT CHECK (orientation IN ('landscape', 'portrait')) DEFAULT 'landscape',
        is_demo BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Advertisers
    CREATE TABLE public.wn_advertisers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mononium_app_id UUID NOT NULL REFERENCES public._apps(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT CHECK (type IN ('retail', 'service', 'horeca', 'automotive', 'bouw', 'financieel')),
        status TEXT CHECK (status IN ('active', 'pending', 'archived')) DEFAULT 'pending',
        contact_email TEXT,
        is_host BOOLEAN DEFAULT false,
        related_location_id UUID REFERENCES public.wn_locations(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Ads
    CREATE TABLE public.wn_ads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mononium_app_id UUID NOT NULL REFERENCES public._apps(id) ON DELETE CASCADE,
        advertiser_id UUID REFERENCES public.wn_advertisers(id) ON DELETE CASCADE,
        internal_name TEXT NOT NULL,
        background_image_url TEXT,
        logo_url TEXT,
        headline TEXT NOT NULL,
        subtext TEXT,
        cta_type TEXT CHECK (cta_type IN ('qr', 'url', 'phone', 'none')) DEFAULT 'none',
        cta_value TEXT,
        active BOOLEAN DEFAULT true,
        season_tag TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Assignments
    CREATE TABLE public.wn_screen_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mononium_app_id UUID NOT NULL REFERENCES public._apps(id) ON DELETE CASCADE,
        ad_id UUID REFERENCES public.wn_ads(id) ON DELETE CASCADE,
        region_target TEXT,
        specific_screen_id UUID REFERENCES public.wn_screens(id) ON DELETE CASCADE,
        priority INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT now(),
        CONSTRAINT wn_target_check CHECK (region_target IS NOT NULL OR specific_screen_id IS NOT NULL)
    );

    -- RLS Policies (Simplified for MVP)
    ALTER TABLE public.wn_locations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.wn_screens ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.wn_advertisers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.wn_ads ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.wn_screen_assignments ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Public Read Locations" ON public.wn_locations FOR SELECT USING (true);
    CREATE POLICY "Public Read Screens" ON public.wn_screens FOR SELECT USING (true);
    CREATE POLICY "Public Read Advertisers" ON public.wn_advertisers FOR SELECT USING (true);
    CREATE POLICY "Public Read Ads" ON public.wn_ads FOR SELECT USING (true);
    CREATE POLICY "Public Read Assignments" ON public.wn_screen_assignments FOR SELECT USING (true);

    -- 3. Seed Data (Replicating logic with app_id)
    RAISE NOTICE 'Seeding WorkNet Data...';

    FOR i IN 1..20 LOOP
        v_region := v_regions[1 + floor(random() * array_length(v_regions, 1))::int];
        
        IF i <= 10 THEN
             INSERT INTO public.wn_locations (mononium_app_id, name, type, address, region, is_demo)
             VALUES (v_app_id, v_names_kapper[1 + floor(random() * array_length(v_names_kapper, 1))::int] || ' ' || i, 'kapper', 'Hoofdstraat ' || i, v_region, false) RETURNING id INTO v_loc_id;
        ELSIF i <= 15 THEN
             INSERT INTO public.wn_locations (mononium_app_id, name, type, address, region, is_demo)
             VALUES (v_app_id, v_names_medisch[1 + floor(random() * array_length(v_names_medisch, 1))::int] || ' ' || i, 'medisch', 'Gezondheidslaan ' || i, v_region, false) RETURNING id INTO v_loc_id;
        ELSE
             INSERT INTO public.wn_locations (mononium_app_id, name, type, address, region, is_demo)
             VALUES (v_app_id, v_names_salon[1 + floor(random() * array_length(v_names_salon, 1))::int] || ' ' || i, 'salon', 'Wellnessplein ' || i, v_region, false) RETURNING id INTO v_loc_id;
        END IF;

        INSERT INTO public.wn_screens (mononium_app_id, location_id, device_name, status, orientation)
        VALUES (v_app_id, v_loc_id, 'SCREEN-' || substring(v_loc_id::text from 1 for 4), CASE WHEN random() < 0.9 THEN 'online' ELSE 'offline' END, 'landscape');
        
        -- Cross Promotion
        IF random() < 0.5 THEN
            INSERT INTO public.wn_advertisers (mononium_app_id, name, type, status, is_host, related_location_id)
            SELECT v_app_id, name, 'service', 'active', true, id FROM public.wn_locations WHERE id = v_loc_id RETURNING id INTO v_adv_id;
            
            INSERT INTO public.wn_ads (mononium_app_id, advertiser_id, internal_name, headline, subtext, season_tag, active)
            VALUES (v_app_id, v_adv_id, 'Self Promo', 'Welkom bij ' || (SELECT name FROM public.wn_advertisers WHERE id = v_adv_id), 'Vraag naar de acties.', 'algemeen', true) RETURNING id INTO v_ad_id;
            
            INSERT INTO public.wn_screen_assignments (mononium_app_id, ad_id, region_target) VALUES (v_app_id, v_ad_id, v_region);
        END IF;
    END LOOP;

    -- External Advertisers
    -- Garage
    INSERT INTO public.wn_advertisers (mononium_app_id, name, type, status) VALUES (v_app_id, 'Garage Jansen', 'automotive', 'active') RETURNING id INTO v_adv_id;
    INSERT INTO public.wn_ads (mononium_app_id, advertiser_id, internal_name, headline, subtext, season_tag, cta_type, cta_value) 
    VALUES (v_app_id, v_adv_id, 'Winterbanden', 'Is uw auto winterklaar?', 'Maak een afspraak.', 'winter', 'phone', '020-12345678') RETURNING id INTO v_ad_id;
    INSERT INTO public.wn_screen_assignments (mononium_app_id, ad_id, region_target) 
    SELECT v_app_id, v_ad_id, region FROM unnest(v_regions) AS region;

    -- Hovenier
    INSERT INTO public.wn_advertisers (mononium_app_id, name, type, status) VALUES (v_app_id, 'Hovenier Groen', 'service', 'active') RETURNING id INTO v_adv_id;
    INSERT INTO public.wn_ads (mononium_app_id, advertiser_id, internal_name, headline, subtext, season_tag) 
    VALUES (v_app_id, v_adv_id, 'Winter Snoei', 'Uw tuin winterklaar?', 'Wij snoeien uw bomen en struiken.', 'winter') RETURNING id INTO v_ad_id;
    INSERT INTO public.wn_screen_assignments (mononium_app_id, ad_id, region_target) VALUES (v_app_id, v_ad_id, 'Utrecht Heuvelrug');

    -- Demo Unit
    INSERT INTO public.wn_locations (mononium_app_id, name, type, address, region, is_demo)
    VALUES (v_app_id, 'WorkNet HQ Demo', 'hq', 'Demo Street 1', 'Amsterdam-Zuid', true) RETURNING id INTO v_demo_loc_id;

    FOR j IN 1..6 LOOP
        INSERT INTO public.wn_screens (mononium_app_id, location_id, device_name, status, is_demo)
        VALUES (v_app_id, v_demo_loc_id, 'DEMO UNIT 0' || j, 'online', true) RETURNING id INTO v_screen_id;
        
        IF j = 1 THEN
            INSERT INTO public.wn_advertisers (mononium_app_id, name, type, status) VALUES (v_app_id, 'Targeting Test', 'service', 'active') RETURNING id INTO v_adv_id;
            INSERT INTO public.wn_ads (mononium_app_id, advertiser_id, internal_name, headline, subtext, active)
            VALUES (v_app_id, v_adv_id, 'EXCLUSIVE 01', 'Hallo Demo 1', 'Alleen hier te zien.', true) RETURNING id INTO v_ad_id;
            INSERT INTO public.wn_screen_assignments (mononium_app_id, ad_id, specific_screen_id, priority)
            VALUES (v_app_id, v_ad_id, v_screen_id, 10);
        END IF;
    END LOOP;

    RAISE NOTICE 'Integration & Seeding Complete.';
END $$;
