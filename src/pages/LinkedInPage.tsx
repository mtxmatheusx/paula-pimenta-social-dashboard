import React from 'react';
import { usePaulaSocialData } from '../hooks/usePaulaSocialData';
import { KPICard } from '../components/KPICard';
import { PostsTable } from '../components/PostsTable';
import { TrendingUp, Users, Target, BarChart3, Loader } from 'lucide-react';

export const LinkedInPage: React.FC = () => {
  const { posts, dailySnapshots, loading, error } = usePaulaSocialData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>;
  }

  const linkedinPosts = posts.filter(p => p.platform === 'linkedin');
  const linkedinSnapshots = dailySnapshots.filter(s => s.platform === 'linkedin');

  const latestSnapshot = linkedinSnapshots[linkedinSnapshots.length - 1];
  const previousSnapshot = linkedinSnapshots[linkedinSnapshots.length - 8];

  const avgEngagement = linkedinPosts.length > 0
    ? linkedinPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / linkedinPosts.length
    : 0;

  const totalReach = linkedinPosts.reduce((sum, p) => sum + p.metrics.reach, 0);

  const growthRate = previousSnapshot && latestSnapshot
    ? ((latestSnapshot.followers - previousSnapshot.followers) / previousSnapshot.followers * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">LinkedIn</h1>
        <p className="text-gray-600">Análise de performance profissional</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Seguidores"
          value={latestSnapshot?.followers || 0}
          unit="conexões"
          trend={growthRate}
          icon={Users}
          color="blue"
        />
        <KPICard
          title="Engagement"
          value={avgEngagement}
          unit="%"
          trend={growthRate}
          icon={Target}
          color="purple"
        />
        <KPICard
          title="Alcance Total"
          value={totalReach}
          unit="pessoas"
          trend={growthRate}
          icon={BarChart3}
          color="green"
        />
        <KPICard
          title="Posts Publicados"
          value={linkedinPosts.length}
          unit="últimos 90 dias"
          trend={0}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Posts Destaque</h2>
        <PostsTable posts={linkedinPosts} limit={15} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Insights</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold">✓</span>
            <span className="text-gray-700">
              Engagement rate médio: <strong>{avgEngagement.toFixed(2)}%</strong> - Excelente para plataforma profissional
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold">✓</span>
            <span className="text-gray-700">
              <strong>{linkedinPosts.length}</strong> posts publicados nos últimos 90 dias
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold">✓</span>
            <span className="text-gray-700">
              Crescimento de seguidores: <strong>{growthRate.toFixed(1)}%</strong> vs semana anterior
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
