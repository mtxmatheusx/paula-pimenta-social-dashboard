import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SocialPost, DailySnapshot, KPIMetrics, Platform } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function usePaulaSocialData() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);
  const [kpis, setKpis] = useState<KPIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch posts
        const { data: postsData, error: postsError } = await supabase
          .from('paula_social_posts')
          .select('*')
          .order('posted_at', { ascending: false });
        
        if (postsError) throw postsError;
        setPosts(postsData || []);

        // Fetch daily snapshots
        const { data: snapshotsData, error: snapshotsError } = await supabase
          .from('paula_social_daily_snapshot')
          .select('*')
          .order('date', { ascending: false });
        
        if (snapshotsError) throw snapshotsError;
        setSnapshots(snapshotsData || []);

        // Calculate KPIs
        if (postsData && snapshotsData) {
          const latestSnapshots = snapshotsData.slice(0, 4); // Last snapshot per platform
          const avgEngagement = postsData.reduce((sum, post) => sum + post.engagement_rate, 0) / postsData.length;
          const totalReach = snapshotsData.reduce((sum, snap) => sum + snap.total_reach, 0);
          const totalFollowers = latestSnapshots.reduce((sum, snap) => sum + snap.followers, 0);
          const avgGrowthWeek = snapshotsData
            .slice(0, 28)
            .reduce((sum, snap) => sum + snap.growth_vs_7_days_ago, 0) / Math.min(28, snapshotsData.length);

          setKpis({
            totalFollowers,
            avgEngagementRate: avgEngagement,
            totalReach,
            totalImpressions: snapshotsData.reduce((sum, snap) => sum + snap.total_impressions, 0),
            growthVsWeek: avgGrowthWeek,
            growthVsMonth: snapshotsData[0]?.growth_vs_30_days_ago || 0
          });
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching Paula social data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPostsByPlatform = (platform: Platform) => 
    posts.filter(post => post.platform === platform);

  const getTopPosts = (limit: number = 10) =>
    posts.sort((a, b) => b.engagement_rate - a.engagement_rate).slice(0, limit);

  const getAverageEngagementByPlatform = (platform: Platform) => {
    const platformPosts = getPostsByPlatform(platform);
    if (platformPosts.length === 0) return 0;
    return platformPosts.reduce((sum, post) => sum + post.engagement_rate, 0) / platformPosts.length;
  };

  return {
    posts,
    snapshots,
    kpis,
    loading,
    error,
    getPostsByPlatform,
    getTopPosts,
    getAverageEngagementByPlatform
  };
}
