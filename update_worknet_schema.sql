/*
  WorkNet DB Expansion: Studio 2.0
  --------------------------------
  Project: WorkNet (Digital Signage MVP)
  Goal: Advanced Ad Management (Payments, Scheduling)

  CHANGES:
  - ALTER wn_ads:
    - ADD payment_status (default 'paid')
    - ADD start_date / end_date
    - ADD week_schedule (days whitelist)
    - ADD promo_code
*/

DO $$
BEGIN
    RAISE NOTICE 'Expanding WorkNet Ads Table...';

    -- 1. Payment Status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wn_ads' AND column_name='payment_status') THEN
        ALTER TABLE public.wn_ads 
        ADD COLUMN payment_status TEXT CHECK (payment_status IN ('paid', 'pending', 'overdue')) DEFAULT 'paid';
    END IF;

    -- 2. Date Range
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wn_ads' AND column_name='start_date') THEN
        ALTER TABLE public.wn_ads 
        ADD COLUMN start_date DATE DEFAULT CURRENT_DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wn_ads' AND column_name='end_date') THEN
        ALTER TABLE public.wn_ads 
        ADD COLUMN end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 year');
    END IF;

    -- 3. Week Schedule
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wn_ads' AND column_name='week_schedule') THEN
        ALTER TABLE public.wn_ads 
        ADD COLUMN week_schedule JSONB DEFAULT '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]'::jsonb;
    END IF;

    -- 4. Promo Code
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wn_ads' AND column_name='promo_code') THEN
        ALTER TABLE public.wn_ads 
        ADD COLUMN promo_code TEXT;
    END IF;

    RAISE NOTICE 'Schema Update Complete.';
END $$;
