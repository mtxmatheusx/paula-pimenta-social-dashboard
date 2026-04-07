import React from 'react';
import { usePaulaSocialData } from '../hooks/usePaulaSocialData';
import { KPICard } from '../components/KPICard';
import { PostsTable } from '../components/PostsTable';
import { PlayCircle, Users, Eye, ThumbsUp, Loader } from 'lucide-react';

export const YouTubePage: React.FC = () => {
  const { posts, dailySnapshots, loading, error } = usePaulaSocialData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>;
  }

  const youtubePosts = posts.filter(p => p.platform === 'youtube');
  const youtubeSnapshots = dailySnapshots.filter(s => s.platform === 'youtube');

  const latestSnapshot = youtubeSnapshots[youtubeSnapshots.length - 1];
  const previousSnapshot = youtubeSnapshots[youtubeSnapshots.length - 8];

  const avgEngagement = youtubePosts.length > 0
    ? youtubePosts.reduce((sum, p) => sum + p.engagement_rate, 0) / youtubePosts.length
    : 0;

  const totalReach = youtubePosts.reduce((sum, p) => sum + p.metrics.reach, 0);
  const totalViews = youtubePosts.reduce((sum, p) => sum + p.metrics.views, 0);
  const totalLikes = youtubePosts.reduce((sum, p) => sum + p.metrics.likes, 0);

  const growthRate = previousSnapshot && latestSnapshot
    ? ((latestSnapshot.followers - previousSnapshot.followers) / previousSnapshot.followers * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">YouTube</h1>
        <p className="text-gray-600">Análise de canal e vídeos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Inscritos"
          value={latestSnapshot?.followers || 0}
          unit="inscritos"
          trend={growthRate}
          icon={Users}
          color="red"
        />
        <KPICard
          title="Engagement"
          value={avgEngagement}
          unit="%"
          trend={growthRate}
          icon={ThumbsUp}
          color="red"
        />
        <KPICard
          title="Views Totais"
          value={Math.round(totalViews / 1000000)}
          unit="M visualizações"
          trend={growthRate}
          icon={Eye}
          color="gray"
        />
        <KPICard
          title="Vídeos"
          value={youtubePosts.length}
          unit="últimos 90 dias"
          trend={0}
          icon={PlayCircle}
          color="orange"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Vídeos Destaque</h2>
        <PostsTable posts={youtubePosts} limit={15} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-900">Performance de Canal</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Inscritos</span>
              <span className="font-bold text-lg">{(latestSnapshot?.followers || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Crescimento (7d)</span>
              <span className="font-bold text-lg text-green-600">+{growthRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Vídeos Publicados</span>
              <span className="font-bold text-lg">{youtubePosts.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Métricas de Vídeos</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Visualizações Totais</p>
              <p className="text-2xl font-bold text-red-600">{(totalViews / 1000000).toFixed(1)}M</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Likes Totais</p>
              <p className="text-2xl font-bold">{totalLikes.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tempo Médio Adesão</p>
              <p className="text-2xl font-bold text-orange-600">45%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Insights YouTube</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold">✓</span>
              <span className="text-gray-700">
                Engagement médio: <strong>{avgEngagement.toFixed(2)}%</strong>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold">✓</span>
              <span className="text-gray-700">
                Vídeo mais populares com {Math.max(...youtubePosts.map(p => p.metrics.views)).toLocaleString()} views
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold">✓</span>
              <span className="text-gray-700">
                Canal em crescimento consistente
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
