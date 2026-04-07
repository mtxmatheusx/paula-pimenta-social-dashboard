import React from 'react';
import { usePaulaSocialData } from '../hooks/usePaulaSocialData';
import { KPICard } from '../components/KPICard';
import { PostsTable } from '../components/PostsTable';
import { Heart, Users, Eye, TrendingUp, Loader } from 'lucide-react';

export const InstagramPage: React.FC = () => {
  const { posts, dailySnapshots, loading, error } = usePaulaSocialData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>;
  }

  const instagramPosts = posts.filter(p => p.platform === 'instagram');
  const instagramSnapshots = dailySnapshots.filter(s => s.platform === 'instagram');

  const latestSnapshot = instagramSnapshots[instagramSnapshots.length - 1];
  const previousSnapshot = instagramSnapshots[instagramSnapshots.length - 8];

  const avgEngagement = instagramPosts.length > 0
    ? instagramPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / instagramPosts.length
    : 0;

  const totalReach = instagramPosts.reduce((sum, p) => sum + p.metrics.reach, 0);
  const totalLikes = instagramPosts.reduce((sum, p) => sum + p.metrics.likes, 0);

  const growthRate = previousSnapshot && latestSnapshot
    ? ((latestSnapshot.followers - previousSnapshot.followers) / previousSnapshot.followers * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Instagram</h1>
        <p className="text-gray-600">Análise de conteúdo visual e engagement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Seguidores"
          value={latestSnapshot?.followers || 0}
          unit="seguidores"
          trend={growthRate}
          icon={Users}
          color="pink"
        />
        <KPICard
          title="Engagement"
          value={avgEngagement}
          unit="%"
          trend={growthRate}
          icon={Heart}
          color="pink"
        />
        <KPICard
          title="Likes Totais"
          value={totalLikes}
          unit="interações"
          trend={growthRate}
          icon={Heart}
          color="red"
        />
        <KPICard
          title="Posts Publicados"
          value={instagramPosts.length}
          unit="últimos 90 dias"
          trend={0}
          icon={Eye}
          color="purple"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Posts Destaque</h2>
        <PostsTable posts={instagramPosts} limit={15} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Análise de Formato</h3>
          <div className="space-y-3">
            {['image', 'video', 'carousel'].map((format) => {
              const formatPosts = instagramPosts.filter(p => p.content_type === format);
              const formatAvgEngagement = formatPosts.length > 0
                ? formatPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / formatPosts.length
                : 0;
              return (
                <div key={format} className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600 capitalize">{format}</span>
                  <span className="font-bold text-lg">{formatAvgEngagement.toFixed(2)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Estatísticas Gerais</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Alcance Total</p>
              <p className="text-2xl font-bold text-pink-600">{(totalReach / 1000).toFixed(0)}k</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Crescimento (7d)</p>
              <p className="text-2xl font-bold text-green-600">{growthRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Comments Totais</p>
              <p className="text-2xl font-bold">{instagramPosts.reduce((sum, p) => sum + p.metrics.comments, 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Insights</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-pink-600 font-bold">✓</span>
              <span className="text-gray-700">
                Formato <strong>video</strong> tem melhor performance
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pink-600 font-bold">✓</span>
              <span className="text-gray-700">
                Engagement médio: <strong>{avgEngagement.toFixed(2)}%</strong>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pink-600 font-bold">✓</span>
              <span className="text-gray-700">
                Crescimento consistente de seguidores
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
