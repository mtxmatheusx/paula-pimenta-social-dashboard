// Types for Paula Social Dashboard

export type Platform = 'linkedin' | 'instagram' | 'tiktok' | 'youtube';

export interface Metrics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  saves?: number;
  reach: number;
}

export interface SocialPost {
  id: number;
  platform: Platform;
  post_id: string;
  content_type: 'image' | 'video' | 'carousel' | 'text' | 'reel' | 'story';
  posted_at: string;
  published_hour: number;
  published_day: string;
  caption: string;
  caption_length: number;
  hashtags: string[];
  media_urls: string[];
  metrics: Metrics;
  engagement_rate: number;
  rank_by_engagement?: number;
  created_at: string;
  updated_at: string;
}

export interface DailySnapshot {
  id: number;
  date: string;
  platform: Platform;
  followers: number;
  following: number;
  posts_published: number;
  avg_engagement_rate: number;
  total_reach: number;
  total_impressions: number;
  total_clicks?: number;
  total_shares?: number;
  growth_vs_yesterday: number;
  growth_vs_7_days_ago: number;
  growth_vs_30_days_ago: number;
  growth_vs_90_days_ago: number;
  created_at: string;
  updated_at: string;
}

export interface NarrativePattern {
  id: number;
  theme: string;
  platform: Platform;
  format: string;
  frequency_in_top_10: number;
  avg_engagement_rate: number;
  posts_using: number;
  sample_posts: any[];
  recommendation: string;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface KPIMetrics {
  totalFollowers: number;
  avgEngagementRate: number;
  totalReach: number;
  totalImpressions: number;
  growthVsWeek: number;
  growthVsMonth: number;
}
