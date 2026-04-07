-- Passo 02b: Create Paula Social Tables in Supabase
-- Date: 2026-04-07
-- Purpose: Store multi-platform social media data for Paula Pimenta analytics

-- Table 1: paula_social_posts
-- Stores individual posts/videos from all platforms (90-day rolling window)
CREATE TABLE IF NOT EXISTS paula_social_posts (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  post_id VARCHAR(255) NOT NULL UNIQUE,
  content_type VARCHAR(50) NOT NULL, -- image, video, carousel, text, reel, story, article
  posted_at TIMESTAMP NOT NULL,
  published_hour INT NOT NULL, -- 0-23
  published_day VARCHAR(20) NOT NULL, -- monday, tuesday, etc
  caption TEXT,
  caption_length INT,
  hashtags TEXT[] DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}',
  metrics JSONB NOT NULL, -- {likes, comments, shares, views, reach, saves, impressions}
  engagement_rate FLOAT NOT NULL CHECK (engagement_rate >= 0 AND engagement_rate <= 100),
  rank_by_engagement INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 2: paula_social_daily_snapshot
-- Stores daily aggregated metrics for each platform
CREATE TABLE IF NOT EXISTS paula_social_daily_snapshot (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  platform VARCHAR(50) NOT NULL, -- linkedin, instagram, tiktok, youtube, all
  followers INT NOT NULL,
  following INT,
  posts_published INT DEFAULT 0,
  avg_engagement_rate FLOAT,
  total_reach INT,
  total_impressions INT,
  total_clicks INT,
  total_shares INT,
  growth_vs_yesterday FLOAT, -- percentage
  growth_vs_7_days_ago FLOAT,
  growth_vs_30_days_ago FLOAT,
  growth_vs_90_days_ago FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, platform)
);

-- Table 3: paula_social_narratives
-- Stores identified patterns and themes from top-performing posts
CREATE TABLE IF NOT EXISTS paula_social_narratives (
  id SERIAL PRIMARY KEY,
  theme VARCHAR(100) NOT NULL, -- liderança, empreendedorismo, carreira, inovação, bem-estar, etc
  platform VARCHAR(50) NOT NULL, -- specific platform or 'all'
  format VARCHAR(50), -- image, video, carousel, text, reel
  frequency_in_top_10 INT, -- how many of top 10 posts use this theme
  avg_engagement_rate FLOAT,
  posts_using INT, -- total count of posts using this theme
  sample_posts JSONB, -- array of top 3 post_ids with this theme
  recommendation TEXT,
  confidence_score INT CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(theme, platform)
);

-- Create indexes for performance
CREATE INDEX idx_paula_social_posts_platform_date
  ON paula_social_posts(platform, posted_at DESC);

CREATE INDEX idx_paula_social_posts_engagement
  ON paula_social_posts(engagement_rate DESC);

CREATE INDEX idx_paula_social_posts_published_hour
  ON paula_social_posts(published_hour);

CREATE INDEX idx_paula_social_daily_snapshot_platform_date
  ON paula_social_daily_snapshot(platform, date DESC);

CREATE INDEX idx_paula_social_daily_snapshot_date
  ON paula_social_daily_snapshot(date DESC);

CREATE INDEX idx_paula_social_narratives_theme_platform
  ON paula_social_narratives(theme, platform);

-- RLS Policies (if using multi-user setup)
ALTER TABLE paula_social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE paula_social_daily_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE paula_social_narratives ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY "Enable read access for authenticated users"
  ON paula_social_posts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
  ON paula_social_daily_snapshot FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
  ON paula_social_narratives FOR SELECT
  USING (auth.role() = 'authenticated');

-- Service role (N8N/edge functions) can insert/update
CREATE POLICY "Enable insert/update for service role"
  ON paula_social_posts FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for service role"
  ON paula_social_posts FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Enable insert/update for service role"
  ON paula_social_daily_snapshot FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for service role"
  ON paula_social_daily_snapshot FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Enable insert/update for service role"
  ON paula_social_narratives FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for service role"
  ON paula_social_narratives FOR UPDATE
  USING (auth.role() = 'service_role');

-- Retention policies
-- Auto-delete posts older than 90 days (weekly cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_paula_posts()
RETURNS void AS $$
BEGIN
  DELETE FROM paula_social_posts
  WHERE posted_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Auto-delete daily snapshots older than 180 days (6 months)
CREATE OR REPLACE FUNCTION cleanup_old_paula_daily()
RETURNS void AS $$
BEGIN
  DELETE FROM paula_social_daily_snapshot
  WHERE date < (CURRENT_DATE - INTERVAL '180 days');
END;
$$ LANGUAGE plpgsql;
