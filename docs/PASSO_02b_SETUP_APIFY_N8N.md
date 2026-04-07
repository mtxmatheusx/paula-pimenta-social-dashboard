# Passo 02b: Setup Apify + N8N para Coleta Automática

**Data:** 2026-04-07
**Status:** 🔄 Em Execução
**Objetivo:** Configurar Apify actors e N8N workflow para coleta semanal automática (segunda-feira 09:00 BRT)

---

## 1. Setup Apify Account

### 1.1 Criar Conta e Obter Token

1. **Acesse** https://apify.com
2. **Sign Up** com email ou Google Account
3. **Navegar para** Settings → API Tokens
4. **Copiar** o `default` API Token (salvar em `.env` como `APIFY_TOKEN`)

**Formato esperado:**
```
APIFY_TOKEN=apk_xxxxxxxxxxxxxxxxxxxxx
```

### 1.2 Validar Acesso

```bash
curl -H "Authorization: Bearer ${APIFY_TOKEN}" \
  https://api.apify.com/v2/acts
```

Esperado: retorna lista de atores disponíveis (status 200)

---

## 2. Configurar 4 Apify Actors

### 2.1 LinkedIn Profile Scraper

**Actor:** `apify/linkedin-profile-scraper`
**URL:** https://apify.com/apify/linkedin-profile-scraper

**Passos:**
1. Ir para o actor page
2. Click em "Run" → "Run locally/API"
3. Copiar a input abaixo e testar execução

**Input JSON:**
```json
{
  "startUrls": [
    {
      "url": "https://www.linkedin.com/in/paula-valio-pimenta/"
    }
  ],
  "includeProfile": true,
  "getFollowers": true,
  "maxPosts": 100,
  "timeframe": "90d"
}
```

**Output esperado:**
- `profileData`: nome, headline, followers, following, posts count
- `posts`: array de posts com likes, comments, reposts, views
- `timestamp`: data da coleta

**Erros comuns:**
- "Account is private" → Skip (não aplicável para Paula, é pública)
- "Rate limited" → Retry com backoff exponencial
- "Session expired" → Atualizar cookies (Apify lida automaticamente)

---

### 2.2 Instagram Scraper

**Actor:** `apify/instagram-scraper`
**URL:** https://apify.com/apify/instagram-scraper

**Input JSON:**
```json
{
  "usernames": [
    "paulavaliopimenta"
  ],
  "includeUserInfo": true,
  "includePosts": true,
  "maxPosts": 100,
  "timeframe": "90d",
  "maxPostsPerPage": 100
}
```

**Output esperado:**
- `userInfo`: followers, following, posts count, biography
- `posts`: array com id, caption, likesCount, commentsCount, videoPlayCount, reach, saves
- `timestamp`: data da coleta

---

### 2.3 TikTok Scraper

**Actor:** `apify/tiktok-scraper`
**URL:** https://apify.com/apify/tiktok-scraper

**Input JSON:**
```json
{
  "usernames": [
    "paulavaliopimenta"
  ],
  "maxVideos": 100,
  "includeComments": false,
  "timeframe": "90d"
}
```

**Output esperado:**
- `userStats`: followers, following, likes, videos count
- `videos`: array com id, createTime, desc, playCount, likeCount, commentCount, shareCount
- `timestamp`: data da coleta

---

### 2.4 YouTube Channel Scraper

**Actor:** `apify/youtube-channel-videos`
**URL:** https://apify.com/apify/youtube-channel-videos

**Input JSON:**
```json
{
  "channelUrl": "https://www.youtube.com/@paulavaliopimenta",
  "includeStatistics": true,
  "maxVideos": 100,
  "timeframe": "90d"
}
```

**Output esperado:**
- `channelInfo`: subscribers, views, videos count
- `videos`: array com videoId, publishedAt, title, description, viewCount, likeCount, commentCount
- `timestamp`: data da coleta

---

## 3. Setup N8N Workflow

### 3.1 Criar Nova Workflow

1. **Acesse** N8N (ou auto-host em Docker/VPS)
2. **Criar nova workflow** → "Paula Social Weekly Sync"
3. **Adicionar nodes** conforme diagrama abaixo

### 3.2 Node Configuration

#### Node 1: Schedule Trigger
```
Type: Schedule
Cron: "0 9 * * 1"  // Monday 09:00 BRT
Timezone: "America/Sao_Paulo"
```

#### Node 2-5: Parallel Apify Calls (4 nodes)

**LinkedIn Node:**
```
Type: HTTP Request
Method: POST
URL: https://api.apify.com/v2/acts/apify~linkedin-profile-scraper/run-sync

Headers:
- Authorization: Bearer {{ $secrets.APIFY_TOKEN }}

Body (JSON):
{
  "startUrls": [{"url": "https://www.linkedin.com/in/paula-valio-pimenta/"}],
  "includeProfile": true,
  "getFollowers": true,
  "maxPosts": 100,
  "timeframe": "90d"
}
```

**Instagram Node:** (similar structure)
```
URL: https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync
Body: { "usernames": ["paulavaliopimenta"], ... }
```

**TikTok Node:**
```
URL: https://api.apify.com/v2/acts/apify~tiktok-scraper/run-sync
Body: { "usernames": ["paulavaliopimenta"], ... }
```

**YouTube Node:**
```
URL: https://api.apify.com/v2/acts/apify~youtube-channel-videos/run-sync
Body: { "channelUrl": "https://www.youtube.com/@paulavaliopimenta", ... }
```

#### Node 6: Merge Results
```
Type: Merge
Strategy: Array (combine results from all 4 actors)
```

#### Node 7: Transform Data (JavaScript)
```
Type: Code (JavaScript)
Language: JavaScript

Code:
function normalizeData(apifyResults) {
  const normalized = [];

  // Process each platform's data
  apifyResults.forEach(result => {
    if (result.error) {
      console.log(`Platform failed: ${result.platform}`);
      return;
    }

    // LinkedIn
    if (result.platform === 'linkedin') {
      result.posts?.forEach(post => {
        normalized.push({
          platform: 'linkedin',
          post_id: post.postId,
          posted_at: new Date(post.timestamp * 1000).toISOString(),
          content_type: post.mediaUrls?.length > 1 ? 'carousel' : (post.videoUrl ? 'video' : 'image'),
          caption: post.content,
          caption_length: (post.content || '').length,
          hashtags: (post.content || '').match(/#\w+/g) || [],
          metrics: {
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: post.reposts || 0,
            views: post.views || 0,
            reach: post.views || 0
          }
        });
      });
    }

    // Instagram
    if (result.platform === 'instagram') {
      result.posts?.forEach(post => {
        const reach = post.reach || post.videoPlayCount || post.likesCount;
        normalized.push({
          platform: 'instagram',
          post_id: post.id,
          posted_at: new Date(post.timestamp).toISOString(),
          content_type: post.videoPlayCount ? 'video' : 'image',
          caption: post.caption,
          caption_length: (post.caption || '').length,
          hashtags: (post.caption || '').match(/#\w+/g) || [],
          metrics: {
            likes: post.likesCount || 0,
            comments: post.commentsCount || 0,
            shares: 0,
            views: post.videoPlayCount || 0,
            saves: post.saves || 0,
            reach: reach
          }
        });
      });
    }

    // TikTok
    if (result.platform === 'tiktok') {
      result.videos?.forEach(video => {
        normalized.push({
          platform: 'tiktok',
          post_id: video.id,
          posted_at: new Date(video.createTime * 1000).toISOString(),
          content_type: 'video',
          caption: video.desc,
          caption_length: (video.desc || '').length,
          hashtags: (video.desc || '').match(/#\w+/g) || [],
          metrics: {
            likes: video.likeCount || 0,
            comments: video.commentCount || 0,
            shares: video.shareCount || 0,
            views: video.playCount || 0,
            reach: video.playCount || 0
          }
        });
      });
    }

    // YouTube
    if (result.platform === 'youtube') {
      result.videos?.forEach(video => {
        normalized.push({
          platform: 'youtube',
          post_id: video.videoId,
          posted_at: new Date(video.publishedAt).toISOString(),
          content_type: 'video',
          caption: video.title,
          caption_length: (video.title || '').length,
          hashtags: [],
          metrics: {
            likes: video.likeCount || 0,
            comments: video.commentCount || 0,
            shares: 0,
            views: video.viewCount || 0,
            reach: video.viewCount || 0
          }
        });
      });
    }
  });

  return normalized;
}

return normalizeData(this.input);
```

#### Node 8: Calculate Engagement Rate
```
Type: Code (JavaScript)

Code:
function calculateMetrics(posts) {
  return posts.map(post => {
    const totalInteractions = (post.metrics.likes || 0) +
                            (post.metrics.comments || 0) +
                            (post.metrics.shares || 0) +
                            (post.metrics.saves || 0);
    const reach = post.metrics.reach || post.metrics.views || 0;

    const engagementRate = reach > 0
      ? Math.round((totalInteractions / reach) * 100 * 100) / 100
      : 0;

    // Extract hour and day
    const postedDate = new Date(post.posted_at);
    const publishedHour = postedDate.getHours();
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const publishedDay = daysOfWeek[postedDate.getDay()];

    return {
      ...post,
      published_hour: publishedHour,
      published_day: publishedDay,
      engagement_rate: engagementRate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });
}

return calculateMetrics(this.input);
```

#### Node 9: Insert to Supabase
```
Type: HTTP Request
Method: POST
URL: https://{{ $secrets.SUPABASE_PROJECT }}.supabase.co/rest/v1/paula_social_posts

Headers:
- Authorization: Bearer {{ $secrets.SUPABASE_KEY }}
- Content-Type: application/json
- Prefer: return=minimal

Body (JSON):
{{ JSON.stringify(this.input) }}
```

#### Node 10: Create Daily Snapshot
```
Type: Code (JavaScript)

Code:
// Aggregate metrics by platform and create daily snapshot
function createDailySnapshot(posts) {
  const platforms = ['linkedin', 'instagram', 'tiktok', 'youtube'];
  const today = new Date().toISOString().split('T')[0];

  const snapshots = platforms.map(platform => {
    const platformPosts = posts.filter(p => p.platform === platform);
    const avgEngagement = platformPosts.length > 0
      ? platformPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / platformPosts.length
      : 0;

    return {
      date: today,
      platform: platform,
      followers: 0, // Will be populated by Apify userInfo
      following: 0,
      posts_published: platformPosts.length,
      avg_engagement_rate: Math.round(avgEngagement * 100) / 100,
      total_reach: platformPosts.reduce((sum, p) => sum + (p.metrics.reach || 0), 0),
      total_impressions: platformPosts.reduce((sum, p) => sum + (p.metrics.views || 0), 0),
      growth_vs_yesterday: 0,
      growth_vs_7_days_ago: 0,
      growth_vs_30_days_ago: 0,
      growth_vs_90_days_ago: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });

  return snapshots;
}

return createDailySnapshot(this.input);
```

#### Node 11: Insert Daily Snapshot to Supabase
```
Type: HTTP Request
Method: POST
URL: https://{{ $secrets.SUPABASE_PROJECT }}.supabase.co/rest/v1/paula_social_daily_snapshot

Headers:
- Authorization: Bearer {{ $secrets.SUPABASE_KEY }}
- Content-Type: application/json
- Prefer: return=minimal

Body:
{{ JSON.stringify(this.input) }}
```

#### Node 12: Send Slack Notification (Optional)
```
Type: Slack
Channel: #paula-social-analytics
Message:
"✅ Paula Social Sync Completed
🕐 {{ $now.toLocaleString() }}
📊 Posts analyzed: {{ $json.postsCount }}
📈 Platforms: LinkedIn, Instagram, TikTok, YouTube"
```

### 3.3 Workflow Diagram (Text)

```
[Schedule: Monday 09:00 BRT]
           ↓
    [Parallel Apify Calls]
    ├─→ LinkedIn Scraper
    ├─→ Instagram Scraper
    ├─→ TikTok Scraper
    └─→ YouTube Scraper
           ↓
    [Merge Results]
           ↓
    [Transform Data]
           ↓
    [Calculate Engagement]
           ↓
    [Insert Posts to Supabase]
           ↓
    [Create Daily Snapshot]
           ↓
    [Insert Snapshot to Supabase]
           ↓
    [Send Slack Notification]
```

---

## 4. Environment Variables

Create `.env` file (or configure in Vercel/N8N):

```env
# Apify
APIFY_TOKEN=apk_xxxxxxxxxxxxxxxxxxxxx

# Supabase
SUPABASE_PROJECT=your-project-id
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://your-project-id.supabase.co

# N8N
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/paula-social-sync

# Slack (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

---

## 5. Testing & Validation

### 5.1 Test Individual Actors

```bash
# Test LinkedIn
curl -X POST https://api.apify.com/v2/acts/apify~linkedin-profile-scraper/run-sync \
  -H "Authorization: Bearer ${APIFY_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "startUrls": [{"url": "https://www.linkedin.com/in/paula-valio-pimenta/"}],
    "maxPosts": 10
  }'

# Response esperado: JSON com status, output, stats
```

### 5.2 Test N8N Workflow

1. Abrir workflow em draft mode
2. Climar "Test" em cada node individualmente
3. Verificar outputs antes de ativar schedule
4. Fazer um "Manual Trigger" para simular segunda-feira 09:00

### 5.3 Validate Data Quality

```sql
-- After first sync, verify data:
SELECT
  platform,
  COUNT(*) as posts_count,
  AVG(engagement_rate) as avg_engagement,
  MAX(engagement_rate) as max_engagement,
  MIN(posted_at) as oldest_post
FROM paula_social_posts
GROUP BY platform;

-- Expected: 4 rows (one per platform) with posts and engagement rates calculated
```

---

## 6. Error Handling & Monitoring

### 6.1 Apify Error Recovery

| Erro | Ação | Retry |
|------|------|-------|
| `PRIVATE_ACCOUNT` | Log + Skip | Não |
| `RATE_LIMITED` | Backoff exponencial | Sim (3x) |
| `INVALID_URL` | Log + Alert | Não |
| `SESSION_EXPIRED` | Auto-refresh (Apify) | Automático |
| `NETWORK_ERROR` | Retry com delay | Sim (5x) |

### 6.2 N8N Workflow Monitoring

Enable notifications in N8N:
- ✅ On execution success
- 🔴 On execution error
- 📊 On execution completion (with metrics)

---

## 7. Próximos Passos

✅ **Passo 02b (Este):** Setup Apify + N8N configurado
→ **Passo 02c:** Primeira coleta de dados (90 dias históricos)
→ **Passo 02d:** Análise de narrativas (identificar padrões em top posts)
→ **Passo 03:** Dashboard Vercel com visualizações

---

**Tempo estimado:**
- Setup Apify: 30min
- Setup N8N workflow: 1h
- Testes e validação: 30min
- **Total Passo 02b:** ~2h
