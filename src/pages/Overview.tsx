import React from 'react';
import { usePaulaSocialData } from '../hooks/usePaulaSocialData';
import { KPICard } from '../components/KPICard';
import { PostsTable } from '../components/PostsTable';
import { Users, TrendingUp, Eye, Zap, Loader } from 'lucide-react';

export const Overview: React.FC = () => {
  const { kpis, posts, getTopPosts, loading, error } = usePaulaSocialData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin" size={32} />
          <p>Carregando dados de Paula Pimenta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Erro ao carregar dados</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const topPosts = getTopPosts(10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Paula Pimenta - Social Analytics</h1>
        <p className="text-gray-600 mt-2">Dashboard de análise multi-plataforma (90 dias)</p>
      </div>

      {/* Main Content */}
      <div className="p-8 max-w-7xl mx-auto">
        {/* KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Followers Totais"
              value={kpis.totalFollowers}
              icon={<Users />}
              color="blue"
              trend={kpis.growthVsWeek}
            />
            <KPICard
              title="Engagement Médio"
              value={kpis.avgEngagementRate.toFixed(2)}
              unit="%"
              icon={<Zap />}
              color="purple"
            />
            <KPICard
              title="Total Reach"
              value={Math.round(kpis.totalReach / 1000)}
              unit="k"
              icon={<Eye />}
              color="green"
              trend={kpis.growthVsMonth}
            />
            <KPICard
              title="Crescimento (30d)"
              value={kpis.growthVsMonth.toFixed(2)}
              unit="%"
              icon={<TrendingUp />}
              color="orange"
            />
          </div>
        )}

        {/* Posts Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Top 10 Posts por Engagement</h2>
            <p className="text-gray-600 text-sm mt-1">{posts.length} posts nos últimos 90 dias</p>
          </div>
          <PostsTable posts={topPosts} limit={10} />
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-3 gap-6">
          {['linkedin', 'instagram', 'tiktok', 'youtube'].map((platform) => {
            const platformPosts = posts.filter(p => p.platform === platform);
            const avgEngagement = platformPosts.length > 0
              ? platformPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / platformPosts.length
              : 0;
            const totalReach = platformPosts.reduce((sum, p) => sum + p.metrics.reach, 0);

            return (
              <div key={platform} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold capitalize text-gray-900 mb-4">{platform}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Posts</p>
                    <p className="text-2xl font-bold">{platformPosts.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Engagement Médio</p>
                    <p className="text-2xl font-bold">{avgEngagement.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reach Total</p>
                    <p className="text-2xl font-bold">{(totalReach / 1000).toFixed(0)}k</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
