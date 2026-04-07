# Passo 02: Coleta de Dados Redes Sociais (90 dias) via Apify

**Data:** 2026-04-07
**Status:** 📋 Em Planejamento
**Período:** Últimos 90 dias de dados históricos
**Agendamento:** Semanal - segunda-feira às 09:00 BRT (via N8N)

## 1. Fontes de Dados & Contas

| Plataforma | URL | Username | Tipo |
|------------|-----|----------|------|
| **LinkedIn** | https://www.linkedin.com/in/paula-valio-pimenta/ | paula-valio-pimenta | Profile |
| **Instagram** | https://www.instagram.com/paulavaliopimenta/ | @paulavaliopimenta | Business Account |
| **TikTok** | https://www.tiktok.com/@paulavaliopimenta | @paulavaliopimenta | Creator Account |
| **YouTube** | https://www.youtube.com/@paulavaliopimenta | paulavaliopimenta | Channel |

## 2. Apify Actors & Configuration

### 2.1 Actor Selection

Para cada plataforma, usaremos:

| Plataforma | Actor | Apify Link | Dados Coletados |
|------------|-------|-----------|-----------------|
| **LinkedIn** | linkedin-profile-scraper | apify.com/apify/linkedin-profile-scraper | Posts, engagement, follower count |
| **Instagram** | instagram-scraper | apify.com/apify/instagram-scraper | Posts, likes, comments, views, saves |
| **TikTok** | tiktok-scraper | apify.com/apify/tiktok-scraper | Videos, views, likes, comments, shares |
| **YouTube** | youtube-channel-videos | apify.com/apify/youtube-channel-videos | Videos, views, likes, comments, subscribers |

### 2.2 Apify Input Configuration

**LinkedIn Profile Scraper:**
```json
{
  "input": {
    "profileUrls": ["https://www.linkedin.com/in/paula-valio-pimenta/"],
    "includeProfile": true,
    "getFollowers": true,
    "maxPosts": 100,
    "timeframe": "90d"
  }
}
```

**Instagram Scraper:**
```json
{
  "input": {
    "usernames": ["paulavaliopimenta"],
    "includeUserInfo": true,
    "includePosts": true,
    "maxPosts": 100,
    "timeframe": "90d",
    "maxPostsPerPage": 100
  }
}
```

**TikTok Scraper:**
```json
{
  "input": {
    "usernames": ["paulavaliopimenta"],
    "maxVideos": 100,
    "includeComments": true,
    "timeframe": "90d"
  }
}
```

**YouTube Channel Scraper:**
```json
{
  "input": {
    "channelUrl": "https://www.youtube.com/@paulavaliopimenta",
    "includeStatistics": true,
    "maxVideos": 100,
    "timeframe": "90d"
  }
}
```

## 3. Mapeamento de Dados → Schema TypeScript

### 3.1 Raw Apify Output → Normalized Schema

```typescript
// Apify Raw Output (varies by platform)
interface ApifyLinkedInPost {
  postId: string
  timestamp: number
  content: string
  likes: number
  comments: number
  reposts: number
  views: number
  mediaUrls: string[]
}

interface ApifyInstagramPost {
  id: string
  timestamp: string
  caption: string
  likesCount: number
  commentsCount: number
  videoPlayCount: number
  reach: number
  saves: number
}

interface ApifyTikTokVideo {
  id: string
  createTime: number
  desc: string
  playCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  createTime: string
}

interface ApifyYouTubeVideo {
  videoId: string
  publishedAt: string
  title: string
  description: string
  viewCount: number
  likeCount: number
  commentCount: number
}

// NORMALIZED SCHEMA (o que vai para Supabase)
interface PaulaSocialPost {
  platform: 'linkedin' | 'instagram' | 'tiktok' | 'youtube'
  post_id: string // unique per platform
  content_type: 'image' | 'video' | 'carousel' | 'text' | 'reel' | 'story' | 'article'
  posted_at: string // ISO 8601
  published_hour: number // 0-23
  published_day: string // monday-sunday
  caption: string
  caption_length: number
  hashtags: string[] // extracted from caption
  media_urls: string[] // video/image URLs
  metrics: {
    likes: number
    comments: number
    shares: number
    views: number
    reach?: number
    saves?: number
    impressions?: number
  }
  engagement_rate: number // calculated
  rank_by_engagement?: number // filled by analytics
  created_at: string // timestamp da coleta
  updated_at: string
}

interface PaulaSocialDaily {
  date: string // YYYY-MM-DD
  platform: 'linkedin' | 'instagram' | 'tiktok' | 'youtube' | 'all'
  followers: number
  following: number
  posts_published: number
  avg_engagement_rate: number
  total_reach: number
  total_impressions?: number
  growth_vs_yesterday: number // %
  growth_vs_7_days_ago: number // %
  growth_vs_30_days_ago: number // %
  growth_vs_90_days_ago: number // %
  created_at: string
}
```

## 4. Transformação de Dados & Cálculos

### 4.1 Engagement Rate Calculation

```typescript
function calculateEngagementRate(post: ApifyPost): number {
  const totalInteractions = (post.likes || 0) + (post.comments || 0) + (post.shares || 0) + (post.saves || 0)
  const reach = post.reach || post.views || 0

  if (reach === 0) return 0

  const engagementRate = (totalInteractions / reach) * 100
  return Math.round(engagementRate * 100) / 100 // 2 decimal places
}
```

### 4.2 Growth Rate Calculation

```typescript
function calculateGrowthRate(
  currentFollowers: number,
  previousFollowers: number
): number {
  if (previousFollowers === 0) return 0

  const growthRate = ((currentFollowers - previousFollowers) / previousFollowers) * 100
  return Math.round(growthRate * 100) / 100
}
```

### 4.3 Content Type Detection

```typescript
function detectContentType(post: ApifyPost, platform: string): ContentType {
  if (platform === 'youtube') return 'video'
  if (platform === 'tiktok') return 'video'

  if (post.media?.length === 1) return 'image'
  if (post.media?.length > 1) return 'carousel'
  if (post.videoUrl) return 'video'
  if (!post.media?.length) return 'text'

  return 'image' // default
}
```

## 5. N8N Workflow Specification

### 5.1 Workflow Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────────────────┐
│ WEEKLY PAULA SOCIAL SYNC (Monday 09:00 BRT)                         │
└─────────────────────────────────────────────────────────────────────┘

1. TRIGGER (Monday 09:00 BRT)
   └─> Scheduled Trigger

2. PARALLEL APIFY CALLS (4 simultaneous)
   ├─> LinkedIn Scraper
   ├─> Instagram Scraper
   ├─> TikTok Scraper
   └─> YouTube Scraper

3. DATA TRANSFORMATION (sequential)
   ├─> Transform LinkedIn → normalized schema
   ├─> Transform Instagram → normalized schema
   ├─> Transform TikTok → normalized schema
   └─> Transform YouTube → normalized schema

4. METRICS CALCULATION (sequential)
   ├─> Calculate engagement_rate for all posts
   ├─> Calculate growth_rate for each platform
   ├─> Rank posts by engagement_rate
   └─> Identify narrative patterns (themes)

5. SUPABASE INSERT (transaction)
   ├─> INSERT INTO paula_social_posts (90-day data)
   ├─> INSERT INTO paula_social_daily_snapshot (current day)
   └─> INSERT INTO paula_social_narratives (pattern analysis)

6. NOTIFICATION
   └─> Send Slack notification "Paula Social Sync Complete"
```

### 5.2 N8N Node Configuration

```json
{
  "name": "Paula Social Weekly Sync",
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "core:schedule",
      "config": {
        "cron": "0 9 * * 1", // Monday 09:00 BRT
        "timezone": "America/Sao_Paulo"
      }
    },
    {
      "name": "LinkedIn Scraper",
      "type": "core:http",
      "config": {
        "url": "https://api.apify.com/v2/acts/apify~linkedin-profile-scraper/run-sync",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer {{ APIFY_TOKEN }}"
        },
        "body": {
          "startUrls": ["https://www.linkedin.com/in/paula-valio-pimenta/"],
          "maxPosts": 100,
          "timeframe": "90d"
        }
      }
    },
    {
      "name": "Merge Results",
      "type": "core:merge",
      "config": {
        "strategy": "array"
      }
    },
    {
      "name": "Calculate Metrics",
      "type": "core:code",
      "config": {
        "language": "javascript",
        "code": "/* engagement_rate + growth_rate calculations */"
      }
    },
    {
      "name": "Insert to Supabase",
      "type": "core:http",
      "config": {
        "url": "https://{{ SUPABASE_PROJECT }}.supabase.co/rest/v1/paula_social_posts",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer {{ SUPABASE_KEY }}"
        },
        "body": "{{ $json.posts }}"
      }
    }
  ]
}
```

## 6. Métricas & Benchmarks

### 6.1 Industry Benchmarks

| Plataforma | Engagement Rate Bom | Engagement Rate Excelente |
|------------|-------------------|--------------------------|
| **LinkedIn** | 2% - 5% | 5%+ |
| **Instagram** | 3% - 6% | 6%+ |
| **TikTok** | 8% - 15% | 15%+ |
| **YouTube** | 4% - 10% | 10%+ |

### 6.2 Cálculos Implementados

1. **Engagement Rate:** `(likes + comments + shares + saves) / reach × 100`
2. **Growth Rate:** `(current_followers - previous_followers) / previous_followers × 100`
3. **Reach:** Extraído direto do Apify (plataformas que fornecem)
4. **Top Post Score:** `engagement_rate × reach`
5. **Platform Comparison:** ranking por engagement_rate

## 7. Storage & Retrieval

### 7.1 Supabase Indexes (para performance)

```sql
CREATE INDEX idx_paula_social_posts_platform_date ON paula_social_posts(platform, posted_at DESC)
CREATE INDEX idx_paula_social_posts_engagement ON paula_social_posts(engagement_rate DESC)
CREATE INDEX idx_paula_social_daily_platform_date ON paula_social_daily_snapshot(platform, date DESC)
```

### 7.2 Retention Policy

- **paula_social_posts:** Manter últimos 90 dias (auto-delete older records)
- **paula_social_daily_snapshot:** Manter últimos 180 dias (para histórico de 6 meses)
- **paula_social_narratives:** Atualizar semanalmente (top 10 posts)

## 8. Error Handling & Monitoring

### 8.1 Apify Failure Cases

```typescript
// Handle case: Account is private
if (apifyResponse.error?.code === 'PRIVATE_ACCOUNT') {
  logger.warn('Account is private, skipping platform')
  // Skip this platform, continue with others
}

// Handle case: Rate limit
if (apifyResponse.error?.code === 'RATE_LIMIT') {
  // Retry with exponential backoff
  await retryWithBackoff(apifyRequest, maxRetries: 3)
}

// Handle case: Invalid URL
if (apifyResponse.error?.code === 'INVALID_URL') {
  logger.error('Invalid social media URL')
  // Send alert to admin
}
```

### 8.2 Data Quality Checks

```typescript
// Validate collected data
function validatePost(post: PaulaSocialPost): boolean {
  return (
    post.platform &&
    post.post_id &&
    post.posted_at &&
    post.metrics?.likes !== undefined &&
    post.engagement_rate >= 0 &&
    post.engagement_rate <= 100
  )
}
```

## 9. Próximos Passos

✅ **Passo 02 (Este):** Estratégia de coleta definida
→ **Passo 02b:** Setup Apify account + N8N workflow creation
→ **Passo 02c:** Primeira coleta de dados (90 dias)
→ **Passo 03:** Dashboard Vercel com dados coletados

---

**Timeline Estimado:**
- Setup Apify + N8N: 1h
- Primeira execução (90d): 30min
- Validação de dados: 30min
- **Total Passo 02:** ~2h
