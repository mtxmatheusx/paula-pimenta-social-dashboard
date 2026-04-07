# N8N Workflow Setup Manual - Paula Pimenta Social Analytics

**Workflow Name:** Paula Pimenta Social Analytics
**Schedule:** Monday 09:00 BRT (Cron: `0 9 * * 1`)
**Purpose:** Automatic weekly data collection from LinkedIn, Instagram, TikTok, YouTube

---

## Overview: 11-Node Workflow Architecture

```
[1. Schedule Trigger]
    ↓ (Monday 09:00)
[Parallel Execution]
├→ [2. LinkedIn Scraper (HTTP)]
├→ [3. Instagram Scraper (HTTP)]
├→ [4. TikTok Scraper (HTTP)]
└→ [5. YouTube Scraper (HTTP)]
    ↓
[6. Merge Results]
    ↓
[7. Transform Data (JavaScript)]
    ↓
[8. Calculate Engagement (JavaScript)]
    ↓
[Branch Split]
├→ [9. Insert Posts to Supabase (HTTP)]
└→ [10. Create Daily Snapshot (JavaScript)]
    ↓
[11. Insert Snapshots to Supabase (HTTP)]
```

---

## Step-by-Step Setup

### 1. Start Workflow Creation

1. Go to: `https://nervousanaconda-n8n.cloudfy.live/workflow/vLwipPXLkhraAi3E`
2. Click **"Add first step"** button in the center
3. Search for **"Schedule"** and select **"Schedule Trigger"** node

### 2. Configure Node 1: Schedule Trigger

**Node Type:** Schedule
**Position:** Top of canvas

**Settings:**
- **Trigger Type:** Cron expression
- **Cron Expression:** `0 9 * * 1`
- **Timezone:** `America/Sao_Paulo`

**Explanation:** Runs every Monday at 09:00 (Brazil time)

---

### 3. Add Node 2: LinkedIn Scraper

**After Node 1, click the "+" button below to add a new node**

1. Search for **"HTTP Request"**
2. Select **"HTTP Request"** node
3. Configure:

**Parameters:**
- **Method:** POST
- **URL:** `https://api.apify.com/v2/acts/apify~linkedin-profile-scraper/run-sync`
- **Authentication:** Bearer Token
- **Token:** Click "+ Add Credentials" → Select "Create new" → Paste: `{{ $secrets.APIFY_TOKEN }}`

**Body (JSON):**
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

**Headers:**
```
Authorization: Bearer {{ $secrets.APIFY_TOKEN }}
```

---

### 4. Add Node 3: Instagram Scraper

**Same process as Node 2, but with different values:**

- **URL:** `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync`
- **Body (JSON):**
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

---

### 5. Add Node 4: TikTok Scraper

- **URL:** `https://api.apify.com/v2/acts/apify~tiktok-scraper/run-sync`
- **Body (JSON):**
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

---

### 6. Add Node 5: YouTube Scraper

- **URL:** `https://api.apify.com/v2/acts/apify~youtube-channel-videos/run-sync`
- **Body (JSON):**
```json
{
  "channelUrl": "https://www.youtube.com/@paulavaliopimenta",
  "includeStatistics": true,
  "maxVideos": 100,
  "timeframe": "90d"
}
```

---

### 7. Add Node 6: Merge Results

1. Click "+" and search for **"Merge"**
2. Select **"Merge"** node
3. Configure:
   - **Mode:** Combine
   - **Output Type:** Array
   - **Combination Mode:** Multiplex

**Connections:** Connect all 4 scrapers (nodes 2-5) to this merge node

---

### 8. Add Node 7: Transform Data (JavaScript)

1. Click "+" after Merge node
2. Search for **"Code"** (or **"Function"**)
3. Select **"Code"** node
4. **Language:** JavaScript
5. **Paste this code:**

```javascript
function normalizeData(apifyResults) {
  const normalized = [];

  apifyResults.forEach(result => {
    if (result.error) {
      console.log(`Platform failed`);
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

---

### 9. Add Node 8: Calculate Engagement (JavaScript)

1. Add another **"Code"** node after Node 7
2. **Paste this code:**

```javascript
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

---

### 10. Add Node 9: Insert Posts to Supabase (HTTP)

1. Add **"HTTP Request"** node after Node 8
2. Configure:

**Parameters:**
- **Method:** POST
- **URL:** `https://{{ $secrets.SUPABASE_PROJECT }}.supabase.co/rest/v1/paula_social_posts`
- **Authentication:** Bearer Token
- **Token:** `{{ $secrets.SUPABASE_SERVICE_ROLE_KEY }}`

**Headers:**
```
Authorization: Bearer {{ $secrets.SUPABASE_SERVICE_ROLE_KEY }}
Content-Type: application/json
Prefer: return=minimal
```

**Body:**
```json
{{ $json }}
```

---

### 11. Add Node 10: Create Daily Snapshot (JavaScript)

1. Add **"Code"** node (connect from Node 8, parallel with Node 9)
2. **Paste this code:**

```javascript
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
      followers: 0,
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

---

### 12. Add Node 11: Insert Snapshots to Supabase (HTTP)

1. Add **"HTTP Request"** node after Node 10
2. Configure (same as Node 9, but different table):

**Parameters:**
- **Method:** POST
- **URL:** `https://{{ $secrets.SUPABASE_PROJECT }}.supabase.co/rest/v1/paula_social_daily_snapshot`
- **Authentication:** Bearer Token
- **Token:** `{{ $secrets.SUPABASE_SERVICE_ROLE_KEY }}`

**Headers:**
```
Authorization: Bearer {{ $secrets.SUPABASE_SERVICE_ROLE_KEY }}
Content-Type: application/json
Prefer: return=minimal
```

**Body:**
```json
{{ $json }}
```

---

## Node Connection Summary

1. **Schedule Trigger** → Connects to nodes 2, 3, 4, 5 (4 parallel inputs)
2. **LinkedIn, Instagram, TikTok, YouTube** → All connect to **Merge** (node 6)
3. **Merge** → **Transform Data** (node 7)
4. **Transform Data** → **Calculate Engagement** (node 8)
5. **Calculate Engagement** → Splits to:
   - **Insert Posts** (node 9)
   - **Create Snapshot** (node 10)
6. **Create Snapshot** → **Insert Snapshots** (node 11)

---

## Environment Variables

Add these credentials in N8N **Settings → Credentials:**

```
APIFY_TOKEN=your_apify_token_here
SUPABASE_PROJECT=your_supabase_project_id
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

---

## Testing the Workflow

### Test Individual Nodes:
1. Open each node
2. Click **"Test"** button
3. Verify output before moving to next node

### Full Workflow Test:
1. Click **"Execute Workflow"** button (play icon)
2. Check **"Executions"** tab for results
3. Verify data in Supabase:

```sql
SELECT COUNT(*) as total_posts, platform FROM paula_social_posts GROUP BY platform;
SELECT COUNT(*) as total_snapshots, platform FROM paula_social_daily_snapshot GROUP BY platform;
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Credentials not found" | Add credentials in N8N Settings before referencing `$secrets` |
| "HTTP 401 Unauthorized" | Verify tokens in `.env.local` are correct |
| "Apify rate limited" | Add retry logic in HTTP request configuration |
| "Supabase 403 Forbidden" | Ensure RLS policies allow service_role access |
| "JavaScript syntax error" | Copy code exactly, check for typos in variable names |

---

## Next Steps

Once workflow is running and data is collected:

1. ✅ **Passo 02c:** First data collection complete
2. ✅ **Passo 02d:** Analyze narratives from collected data
3. 🔄 **Passo 03:** Create React dashboard with KPI visualization
4. 📊 **Passo 04:** Generate final Vercel deployment guide

---

**Estimated Setup Time:** 2-3 hours for first-time configuration
**Status:** Manual setup required
**Last Updated:** 2026-04-07
