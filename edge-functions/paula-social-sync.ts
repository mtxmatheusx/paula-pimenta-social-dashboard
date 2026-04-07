/**
 * Edge Function: paula-social-sync
 * Purpose: Transform Apify raw data → normalized schema → insert to Supabase
 * Trigger: N8N workflow (Monday 09:00 BRT)
 *
 * Environment Variables Required:
 * - SUPABASE_PROJECT
 * - SUPABASE_KEY
 * - APIFY_TOKEN (for direct API calls if needed)
 */

import { createClient } from '@supabase/supabase-js';
import {
  PaulaSocialPost,
  PaulaSocialDaily,
  ApifyLinkedInOutput,
  ApifyInstagramOutput,
  ApifyTikTokOutput,
  ApifyYouTubeOutput,
  SocialPlatform,
  ContentType,
  EngagementMetrics,
  ErrorCode,
  ApiResponse,
} from '../types/paula-social.types';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_PROJECT = Deno.env.get('SUPABASE_PROJECT');
const SUPABASE_KEY = Deno.env.get('SUPABASE_KEY');
const SUPABASE_URL = `https://${SUPABASE_PROJECT}.supabase.co`;

if (!SUPABASE_PROJECT || !SUPABASE_KEY) {
  throw new Error('Missing SUPABASE_PROJECT or SUPABASE_KEY environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================================
// Data Transformation Functions
// ============================================================================

/**
 * Calculate engagement rate: (likes + comments + shares + saves) / reach × 100
 */
function calculateEngagementRate(metrics: EngagementMetrics): number {
  const totalInteractions = (metrics.likes || 0) +
    (metrics.comments || 0) +
    (metrics.shares || 0) +
    (metrics.saves || 0);

  const reach = metrics.reach || metrics.views || 0;

  if (reach === 0) return 0;

  const engagementRate = (totalInteractions / reach) * 100;
  return Math.round(engagementRate * 100) / 100; // 2 decimal places
}

/**
 * Detect content type from post data
 */
function detectContentType(
  platform: SocialPlatform,
  mediaCount?: number,
  hasVideo?: boolean
): ContentType {
  if (platform === 'youtube') return 'video';
  if (platform === 'tiktok') return 'video';

  if (mediaCount === 1) return 'image';
  if (mediaCount && mediaCount > 1) return 'carousel';
  if (hasVideo) return 'video';

  return 'text';
}

/**
 * Extract hashtags from caption
 */
function extractHashtags(caption: string): string[] {
  if (!caption) return [];
  const matches = caption.match(/#\w+/g) || [];
  return matches;
}

/**
 * Get day of week from date
 */
function getDayOfWeek(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

// ============================================================================
// Platform-Specific Transformers
// ============================================================================

/**
 * Transform LinkedIn Apify output to normalized schema
 */
function transformLinkedInData(apifyData: ApifyLinkedInOutput): PaulaSocialPost[] {
  return (apifyData.posts || [])
    .map(post => {
      const postedDate = new Date(post.timestamp * 1000);
      const metrics: EngagementMetrics = {
        likes: post.likes || 0,
        comments: post.comments || 0,
        shares: post.reposts || 0,
        views: post.views || 0,
        reach: post.views || 0,
      };

      const normalized: PaulaSocialPost = {
        platform: 'linkedin',
        post_id: post.postId,
        content_type: detectContentType('linkedin', post.mediaUrls?.length, false),
        posted_at: postedDate.toISOString(),
        published_hour: postedDate.getHours(),
        published_day: getDayOfWeek(postedDate) as any,
        caption: post.content || '',
        caption_length: (post.content || '').length,
        hashtags: extractHashtags(post.content || ''),
        media_urls: post.mediaUrls,
        metrics,
        engagement_rate: calculateEngagementRate(metrics),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return normalized;
    })
    .filter(post => post.posted_at); // Filter out invalid posts
}

/**
 * Transform Instagram Apify output to normalized schema
 */
function transformInstagramData(apifyData: ApifyInstagramOutput): PaulaSocialPost[] {
  return (apifyData.posts || [])
    .map(post => {
      const postedDate = new Date(post.timestamp);
      const reach = post.reach || post.videoPlayCount || post.likesCount || 0;
      const metrics: EngagementMetrics = {
        likes: post.likesCount || 0,
        comments: post.commentsCount || 0,
        shares: 0, // Instagram doesn't expose shares via API
        views: post.videoPlayCount || 0,
        reach: reach,
        saves: post.saves || 0,
      };

      const normalized: PaulaSocialPost = {
        platform: 'instagram',
        post_id: post.id,
        content_type: post.videoPlayCount ? 'video' : 'image',
        posted_at: postedDate.toISOString(),
        published_hour: postedDate.getHours(),
        published_day: getDayOfWeek(postedDate) as any,
        caption: post.caption || '',
        caption_length: (post.caption || '').length,
        hashtags: extractHashtags(post.caption || ''),
        metrics,
        engagement_rate: calculateEngagementRate(metrics),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return normalized;
    })
    .filter(post => post.posted_at);
}

/**
 * Transform TikTok Apify output to normalized schema
 */
function transformTikTokData(apifyData: ApifyTikTokOutput): PaulaSocialPost[] {
  return (apifyData.videos || [])
    .map(video => {
      const postedDate = new Date(video.createTime * 1000);
      const metrics: EngagementMetrics = {
        likes: video.likeCount || 0,
        comments: video.commentCount || 0,
        shares: video.shareCount || 0,
        views: video.playCount || 0,
        reach: video.playCount || 0,
      };

      const normalized: PaulaSocialPost = {
        platform: 'tiktok',
        post_id: video.id,
        content_type: 'video',
        posted_at: postedDate.toISOString(),
        published_hour: postedDate.getHours(),
        published_day: getDayOfWeek(postedDate) as any,
        caption: video.desc || '',
        caption_length: (video.desc || '').length,
        hashtags: extractHashtags(video.desc || ''),
        metrics,
        engagement_rate: calculateEngagementRate(metrics),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return normalized;
    })
    .filter(post => post.posted_at);
}

/**
 * Transform YouTube Apify output to normalized schema
 */
function transformYouTubeData(apifyData: ApifyYouTubeOutput): PaulaSocialPost[] {
  return (apifyData.videos || [])
    .map(video => {
      const postedDate = new Date(video.publishedAt);
      const metrics: EngagementMetrics = {
        likes: video.likeCount || 0,
        comments: video.commentCount || 0,
        shares: 0,
        views: video.viewCount || 0,
        reach: video.viewCount || 0,
      };

      const normalized: PaulaSocialPost = {
        platform: 'youtube',
        post_id: video.videoId,
        content_type: 'video',
        posted_at: postedDate.toISOString(),
        published_hour: postedDate.getHours(),
        published_day: getDayOfWeek(postedDate) as any,
        caption: video.title,
        caption_length: video.title.length,
        hashtags: extractHashtags(video.description || ''),
        metrics,
        engagement_rate: calculateEngagementRate(metrics),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return normalized;
    })
    .filter(post => post.posted_at);
}

// ============================================================================
// Data Validation
// ============================================================================

/**
 * Validate post data before insertion
 */
function validatePost(post: PaulaSocialPost): boolean {
  return !!(
    post.platform &&
    post.post_id &&
    post.posted_at &&
    post.metrics?.likes !== undefined &&
    post.engagement_rate >= 0 &&
    post.engagement_rate <= 100
  );
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Upsert posts to Supabase (insert or update if already exists)
 */
async function upsertPosts(posts: PaulaSocialPost[]): Promise<{
  inserted: number;
  updated: number;
  failed: number;
}> {
  const validPosts = posts.filter(validatePost);
  const result = { inserted: 0, updated: 0, failed: 0 };

  for (const post of validPosts) {
    const { error } = await supabase
      .from('paula_social_posts')
      .upsert({
        platform: post.platform,
        post_id: post.post_id,
        content_type: post.content_type,
        posted_at: post.posted_at,
        published_hour: post.published_hour,
        published_day: post.published_day,
        caption: post.caption,
        caption_length: post.caption_length,
        hashtags: post.hashtags,
        media_urls: post.media_urls || [],
        metrics: post.metrics,
        engagement_rate: post.engagement_rate,
        created_at: post.created_at,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'post_id',
      });

    if (error) {
      console.error(`Failed to upsert post ${post.post_id}:`, error);
      result.failed++;
    } else {
      result.inserted++;
    }
  }

  return result;
}

/**
 * Create daily snapshots from posts
 */
async function createDailySnapshots(posts: PaulaSocialPost[]): Promise<void> {
  const platforms: SocialPlatform[] = ['linkedin', 'instagram', 'tiktok', 'youtube'];
  const today = new Date().toISOString().split('T')[0];

  for (const platform of platforms) {
    const platformPosts = posts.filter(p => p.platform === platform);

    if (platformPosts.length === 0) continue;

    const avgEngagement = platformPosts.length > 0
      ? platformPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / platformPosts.length
      : 0;

    const snapshot: PaulaSocialDaily = {
      date: today,
      platform,
      followers: 0, // Would be populated by Apify userInfo
      posts_published: platformPosts.length,
      avg_engagement_rate: Math.round(avgEngagement * 100) / 100,
      total_reach: platformPosts.reduce((sum, p) => sum + (p.metrics.reach || 0), 0),
      total_impressions: platformPosts.reduce((sum, p) => sum + (p.metrics.views || 0), 0),
      growth_vs_yesterday: 0,
      growth_vs_7_days_ago: 0,
      growth_vs_30_days_ago: 0,
      growth_vs_90_days_ago: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('paula_social_daily_snapshot')
      .upsert(snapshot, {
        onConflict: 'date,platform',
      });

    if (error) {
      console.error(`Failed to create daily snapshot for ${platform}:`, error);
    }
  }
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Main sync function - called by N8N workflow
 */
export async function syncPaulaSocialData(
  apifyResults: {
    linkedin?: ApifyLinkedInOutput;
    instagram?: ApifyInstagramOutput;
    tiktok?: ApifyTikTokOutput;
    youtube?: ApifyYouTubeOutput;
  }
): Promise<ApiResponse<any>> {
  try {
    const allPosts: PaulaSocialPost[] = [];

    // Transform each platform's data
    if (apifyResults.linkedin) {
      console.log('Transforming LinkedIn data...');
      allPosts.push(...transformLinkedInData(apifyResults.linkedin));
    }

    if (apifyResults.instagram) {
      console.log('Transforming Instagram data...');
      allPosts.push(...transformInstagramData(apifyResults.instagram));
    }

    if (apifyResults.tiktok) {
      console.log('Transforming TikTok data...');
      allPosts.push(...transformTikTokData(apifyResults.tiktok));
    }

    if (apifyResults.youtube) {
      console.log('Transforming YouTube data...');
      allPosts.push(...transformYouTubeData(apifyResults.youtube));
    }

    console.log(`Total posts transformed: ${allPosts.length}`);

    // Upsert posts to Supabase
    console.log('Upserting posts to Supabase...');
    const upsertResult = await upsertPosts(allPosts);
    console.log(`Upsert result:`, upsertResult);

    // Create daily snapshots
    console.log('Creating daily snapshots...');
    await createDailySnapshots(allPosts);

    return {
      success: true,
      data: {
        postsProcessed: allPosts.length,
        upsertResult,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in syncPaulaSocialData:', error);

    return {
      success: false,
      error: {
        code: ErrorCode.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// Deno Serve Handler (for direct deployment as Edge Function)
// ============================================================================

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('OK', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const payload = await req.json();
    const result = await syncPaulaSocialData(payload);

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
