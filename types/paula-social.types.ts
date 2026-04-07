/**
 * Paula Social Analytics - TypeScript Types
 * Shared types for data collection, storage, and dashboard
 */

// ============================================================================
// Platform Types
// ============================================================================

export type SocialPlatform = 'linkedin' | 'instagram' | 'tiktok' | 'youtube';
export type ContentType = 'image' | 'video' | 'carousel' | 'text' | 'reel' | 'story' | 'article';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// ============================================================================
// Core Data Structures
// ============================================================================

/**
 * Engagement metrics common across all platforms
 */
export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  reach: number;
  saves?: number;
  impressions?: number;
  clicks?: number;
}

/**
 * Individual social media post (normalized across platforms)
 */
export interface PaulaSocialPost {
  id?: number;
  platform: SocialPlatform;
  post_id: string; // Unique per platform (e.g., LinkedIn post ID, Instagram media ID)
  content_type: ContentType;
  posted_at: string; // ISO 8601
  published_hour: number; // 0-23
  published_day: DayOfWeek;
  caption: string;
  caption_length: number;
  hashtags: string[];
  media_urls?: string[];
  metrics: EngagementMetrics;
  engagement_rate: number; // (likes + comments + shares + saves) / reach × 100
  rank_by_engagement?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Daily aggregated snapshot for a platform
 */
export interface PaulaSocialDaily {
  id?: number;
  date: string; // YYYY-MM-DD
  platform: SocialPlatform | 'all';
  followers: number;
  following?: number;
  posts_published: number;
  avg_engagement_rate: number;
  total_reach: number;
  total_impressions?: number;
  total_clicks?: number;
  total_shares?: number;
  growth_vs_yesterday?: number; // percentage
  growth_vs_7_days_ago?: number;
  growth_vs_30_days_ago?: number;
  growth_vs_90_days_ago?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Identified narrative pattern from top-performing posts
 */
export interface PaulaSocialNarrative {
  id?: number;
  theme: string; // e.g., "liderança", "empreendedorismo", "carreira", "inovação"
  platform: SocialPlatform | 'all';
  format?: ContentType;
  frequency_in_top_10: number;
  avg_engagement_rate: number;
  posts_using: number;
  sample_posts?: string[]; // Array of top post_ids using this theme
  recommendation: string;
  confidence_score: number; // 0-100
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Apify Raw Output Types
// ============================================================================

/**
 * Raw LinkedIn profile post from Apify linkedin-profile-scraper
 */
export interface ApifyLinkedInPost {
  postId: string;
  timestamp: number;
  content: string;
  likes: number;
  comments: number;
  reposts: number;
  views: number;
  mediaUrls?: string[];
}

/**
 * Raw LinkedIn profile data from Apify
 */
export interface ApifyLinkedInOutput {
  profileData?: {
    name: string;
    headline: string;
    followers: number;
    following: number;
  };
  posts: ApifyLinkedInPost[];
  timestamp: string;
}

/**
 * Raw Instagram post from Apify instagram-scraper
 */
export interface ApifyInstagramPost {
  id: string;
  timestamp: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  videoPlayCount?: number;
  reach?: number;
  saves?: number;
}

/**
 * Raw Instagram profile data from Apify
 */
export interface ApifyInstagramOutput {
  userInfo?: {
    username: string;
    followers: number;
    following: number;
    postsCount: number;
    biography: string;
  };
  posts: ApifyInstagramPost[];
  timestamp: string;
}

/**
 * Raw TikTok video from Apify tiktok-scraper
 */
export interface ApifyTikTokVideo {
  id: string;
  createTime: number; // Unix timestamp
  desc: string;
  playCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

/**
 * Raw TikTok profile data from Apify
 */
export interface ApifyTikTokOutput {
  userStats?: {
    username: string;
    followers: number;
    following: number;
    likes: number;
    videosCount: number;
  };
  videos: ApifyTikTokVideo[];
  timestamp: string;
}

/**
 * Raw YouTube video from Apify youtube-channel-videos
 */
export interface ApifyYouTubeVideo {
  videoId: string;
  publishedAt: string; // ISO 8601
  title: string;
  description: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

/**
 * Raw YouTube channel data from Apify
 */
export interface ApifyYouTubeOutput {
  channelInfo?: {
    channelName: string;
    subscribers: number;
    views: number;
    videosCount: number;
  };
  videos: ApifyYouTubeVideo[];
  timestamp: string;
}

// ============================================================================
// Calculation & Analysis Types
// ============================================================================

/**
 * Analysis of a single post's performance
 */
export interface PostAnalysis {
  post: PaulaSocialPost;
  engagementVsAverage: number; // Multiplier (e.g., 1.5 = 50% above average)
  themes: string[];
  format: ContentType;
  timing: {
    publishedHour: number;
    publishedDay: DayOfWeek;
  };
  insights: string[];
}

/**
 * Analysis of format performance across posts
 */
export interface FormatAnalysis {
  format: ContentType;
  platform: SocialPlatform;
  avgEngagementRate: number;
  postCount: number;
  topPost: PaulaSocialPost;
  recommendation: string;
  confidenceScore: number;
}

/**
 * Timing analysis for content publication
 */
export interface TimingAnalysis {
  hour: number;
  day: DayOfWeek;
  avgEngagementRate: number;
  postCount: number;
  recommendation: string;
  performanceVsAverage: number; // Multiplier
}

/**
 * Content recommendation engine output
 */
export interface ContentRecommendation {
  recommendedFormat: ContentType;
  recommendedTheme: string;
  ideaCaptionLength: {
    min: number;
    max: number;
  };
  bestPublishDay: DayOfWeek;
  bestPublishHour: number;
  confidenceScore: number; // 0-100
  reasoning: string;
  similarTopPosts: number;
  estimatedEngagementRate: number;
}

/**
 * Complete analytics report for a platform
 */
export interface PlatformAnalyticsReport {
  platform: SocialPlatform;
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalPosts: number;
    avgEngagementRate: number;
    topPostEngagementRate: number;
    totalFollowers: number;
    followerGrowth: number;
    totalReach: number;
  };
  topPosts: PaulaSocialPost[];
  narrativePatterns: PaulaSocialNarrative[];
  formatAnalysis: FormatAnalysis[];
  timingAnalysis: TimingAnalysis[];
  recommendations: ContentRecommendation[];
  generatedAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * N8N workflow result
 */
export interface WorkflowResult {
  workflowId: string;
  executionId: string;
  status: 'success' | 'error' | 'running';
  postsProcessed: number;
  platformsProcessed: SocialPlatform[];
  executedAt: string;
  duration: number; // milliseconds
  errors?: Array<{
    platform: SocialPlatform;
    error: string;
  }>;
}

// ============================================================================
// Dashboard Display Types
// ============================================================================

/**
 * KPI Card data for display
 */
export interface KPICard {
  title: string;
  value: number | string;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  icon?: string;
  color?: 'green' | 'blue' | 'orange' | 'red';
}

/**
 * Chart data structure
 */
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }>;
}

/**
 * Comparison data between two periods
 */
export interface PeriodComparison {
  period1: {
    name: string;
    startDate: string;
    endDate: string;
  };
  period2: {
    name: string;
    startDate: string;
    endDate: string;
  };
  metrics: {
    name: string;
    value1: number;
    value2: number;
    change: number; // percentage
    trend: 'up' | 'down' | 'stable';
  }[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Error codes for consistency
 */
export enum ErrorCode {
  APIFY_RATE_LIMIT = 'APIFY_RATE_LIMIT',
  APIFY_INVALID_URL = 'APIFY_INVALID_URL',
  APIFY_PRIVATE_ACCOUNT = 'APIFY_PRIVATE_ACCOUNT',
  SUPABASE_ERROR = 'SUPABASE_ERROR',
  DATA_VALIDATION_ERROR = 'DATA_VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Calculation benchmark thresholds
 */
export const ENGAGEMENT_BENCHMARKS = {
  linkedin: { good: 2, excellent: 5 },
  instagram: { good: 3, excellent: 6 },
  tiktok: { good: 8, excellent: 15 },
  youtube: { good: 4, excellent: 10 },
};

/**
 * Utility function type
 */
export interface CalculationFunction<T, R> {
  (input: T): R;
}
