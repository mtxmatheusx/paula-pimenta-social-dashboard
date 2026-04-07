import React from 'react';
import { usePaulaSocialData } from '../hooks/usePaulaSocialData';
import { KPICard } from '../components/KPICard';
import { PostsTable } from '../components/PostsTable';
import { Play, Users, Eye, Zap, Loader } from 'lucide-react';

export const TikTokPage: React.FC = () => {
  const { posts, dailySnapshots, loading, error } = usePaulaSocialData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 text-black animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>;
  }

  const tiktokPosts = posts.filter(p => p.platform === 'tiktok');
  const tiktokSnapshots = dailySnapshots.filter(s => s.platform === 'tiktok');

  const latestSnapshot = tiktokSnapshots[tiktokSnapshots.length - 1];
  const previousSnapshot = tiktokSnapshots[tiktokSnapshots.length - 8];

  const avgEngagement = tiktokPosts.length > 0
    ? tiktokPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / tiktokPosts.length
    : 0;

  const totalReach = tiktokPosts.reduce((sum, p) => sum + p.metrics.reach, 0);
  const totalViews = tiktokPosts.reduce((sum, p) => sum + p.metrics.views, 0);

  const growthRate = previousSnapshot && latestSnapshot
    ? ((latestSnapshot.followers - previousSnapshot.followers) / previousSnapshot.followers * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">TikTok</h1>
        <p className="text-gray-600">Análise de vídeos virais e alcance viral</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Seguidores"
          value={latestSnapshot?.followers || 0}
          unit="seguidores"
          trend={growthRate}
          icon={Users}
          color="black"
        />
        <KPICard
          title="Engagement"
          value={avgEngagement}
          unit="%"
          trend={growthRate}
          icon={Zap}
          color="cyan"
        />
        <KPICard
          title="Views Totais"
          value={Math.round(totalViews / 1000)}
          unit="k visualizações"
          trend={growthRate}
          icon={Eye}
          color="purple"
        />
        <KPICard
          title="Vídeos Publicados"
          value={tiktokPosts.length}
          unit="últimos 90 dias"
          trend={0}
          icon={Play}
          color="blue"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Vídeos Destaque</h2>
        <PostsTable posts={tiktokPosts} limit={15} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Performance por Tipo</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Vídeos virais (>100k views)</p>
              <p className="text-2xl font-bold text-cyan-600">
                {tiktokPosts.filter(p => p.metrics.views > 100000).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Vídeos trending (>20k likes)</p>
              <p className="text-2xl font-bold text-blue-600">
                {tiktokPosts.filter(p => p.metrics.likes > 20000).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Alcance Total</p>
              <p className="text-2xl font-bold text-cyan-600">{(totalReach / 1000000).toFixed(1)}M</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Shares Totais</p>
              <p className="text-2xl font-bold">
                {tiktokPosts.reduce((sum, p) => sum + p.metrics.shares, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Crescimento (7d)</p>
              <p className="text-2xl font-bold text-green-600">{growthRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Insights TikTok</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-cyan-600 font-bold">✓</span>
              <span className="text-gray-700">
                Engagement médio: <strong>{avgEngagement.toFixed(2)}%</strong> - Excelente
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-600 font-bold">✓</span>
              <span className="text-gray-700">
                {tiktokPosts.filter(p => p.metrics.views > 100000).length} vídeos com >100k views
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-600 font-bold">✓</span>
              <span className="text-gray-700">
                Crescimento viral consistente na plataforma
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
