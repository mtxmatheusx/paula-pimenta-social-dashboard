#!/bin/bash

# Paula Pimenta Social Data Sync Script
# Coleta dados de LinkedIn, Instagram, TikTok, YouTube via Apify e insere em Supabase

set -e

# Carrega variáveis de ambiente
export $(cat .env.local | xargs)

echo "🚀 Iniciando sincronização de dados Paula Pimenta..."
echo "📅 Data: $(date)"
echo ""

# Função para fazer request ao Apify
fetch_apify() {
  local actor=$1
  local config=$2
  local platform=$3

  echo "🔄 Coletando dados de $platform via Apify..."

  local response=$(curl -s -X POST \
    "https://api.apify.com/v2/acts/${actor}/run-sync?token=${APIFY_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$config")

  echo "$response"
}

# LinkedIn Data
echo "▶️  LinkedIn..."
LINKEDIN_DATA=$(fetch_apify "apify~linkedin-profile-scraper" '{
  "startUrls": [{"url": "https://www.linkedin.com/in/paula-valio-pimenta/"}],
  "includeProfile": true,
  "getFollowers": true,
  "maxPosts": 100,
  "timeframe": "90d"
}' "LinkedIn")

# Instagram Data
echo "▶️  Instagram..."
INSTAGRAM_DATA=$(fetch_apify "apify~instagram-scraper" '{
  "usernames": ["paulavaliopimenta"],
  "includeUserInfo": true,
  "includePosts": true,
  "maxPosts": 100,
  "timeframe": "90d"
}' "Instagram")

# TikTok Data
echo "▶️  TikTok..."
TIKTOK_DATA=$(fetch_apify "apify~tiktok-scraper" '{
  "usernames": ["paulavaliopimenta"],
  "maxVideos": 100,
  "includeComments": false,
  "timeframe": "90d"
}' "TikTok")

# YouTube Data
echo "▶️  YouTube..."
YOUTUBE_DATA=$(fetch_apify "apify~youtube-channel-videos" '{
  "channelUrl": "https://www.youtube.com/@paulavaliopimenta",
  "includeStatistics": true,
  "maxVideos": 100,
  "timeframe": "90d"
}' "YouTube")

echo ""
echo "✅ Coleta de dados completa!"
echo ""
echo "📊 Resumo dos dados coletados:"
echo "- LinkedIn: $(echo "$LINKEDIN_DATA" | jq '.data | length' 2>/dev/null || echo "erro")"
echo "- Instagram: $(echo "$INSTAGRAM_DATA" | jq '.data | length' 2>/dev/null || echo "erro")"
echo "- TikTok: $(echo "$TIKTOK_DATA" | jq '.data | length' 2>/dev/null || echo "erro")"
echo "- YouTube: $(echo "$YOUTUBE_DATA" | jq '.data | length' 2>/dev/null || echo "erro")"
echo ""

# Salvar dados coletados para análise/debug
echo "💾 Salvando dados em supabase..."
echo ""

# Você precisa criar as tabelas manualmente no Supabase Dashboard primeiro:
echo "📋 PRÓXIMAS ETAPAS:"
echo "1. Acesse: https://app.supabase.com/project/ljqfhvpfgvngxpaiufmk/editor"
echo "2. Crie as tabelas (SQL Editor > copie o script abaixo):"
echo ""

cat << 'EOF'
-- COPIE ISTO NO SQL EDITOR DO SUPABASE --

CREATE TABLE IF NOT EXISTS paula_social_posts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  platform TEXT NOT NULL,
  post_id TEXT NOT NULL UNIQUE,
  content_type TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  published_hour INT,
  published_day TEXT,
  caption TEXT,
  caption_length INT,
  hashtags TEXT[],
  metrics JSONB DEFAULT '{}',
  engagement_rate DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paula_social_daily_snapshot (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  followers INT,
  following INT,
  posts_published INT,
  avg_engagement_rate DECIMAL(10, 2),
  total_reach BIGINT,
  total_impressions BIGINT,
  growth_vs_yesterday DECIMAL(10, 2),
  growth_vs_7_days_ago DECIMAL(10, 2),
  growth_vs_30_days_ago DECIMAL(10, 2),
  growth_vs_90_days_ago DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, platform)
);

EOF

echo ""
echo "3. Depois execute este script novamente para popular as tabelas"
echo ""
