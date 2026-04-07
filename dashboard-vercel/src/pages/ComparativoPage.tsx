import React, { useState } from 'react';
import { usePaulaSocialData } from '../hooks/usePaulaSocialData';
import { TrendingUp, TrendingDown, Loader } from 'lucide-react';

export const ComparativoPage: React.FC = () => {
  const { posts, dailySnapshots, loading, error } = usePaulaSocialData();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>;
  }

  const platforms = ['all', 'linkedin', 'instagram', 'tiktok', 'youtube'];

  const getMetricsForPlatform = (platform: string) => {
    const filtered = platform === 'all' ? posts : posts.filter(p => p.platform === platform);
    const snapshots = platform === 'all'
      ? dailySnapshots
      : dailySnapshots.filter(s => s.platform === platform);

    if (filtered.length === 0) return null;

    const avgEngagement = filtered.reduce((sum, p) => sum + p.engagement_rate, 0) / filtered.length;
    const totalReach = filtered.reduce((sum, p) => sum + p.metrics.reach, 0);
    const totalViews = filtered.reduce((sum, p) => sum + p.metrics.views, 0);

    // Get growth over different periods
    const sortedSnapshots = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latest = sortedSnapshots[sortedSnapshots.length - 1];
    const week7 = sortedSnapshots[sortedSnapshots.length - 8];
    const month30 = sortedSnapshots[sortedSnapshots.length - 31];
    const month90 = sortedSnapshots[0];

    const growthWeek = week7 && latest
      ? ((latest.followers - week7.followers) / week7.followers * 100)
      : 0;
    const growthMonth = month30 && latest
      ? ((latest.followers - month30.followers) / month30.followers * 100)
      : 0;
    const growth90 = month90 && latest
      ? ((latest.followers - month90.followers) / month90.followers * 100)
      : 0;

    return {
      posts: filtered.length,
      avgEngagement,
      totalReach,
      totalViews,
      followers: latest?.followers || 0,
      growthWeek,
      growthMonth,
      growth90,
    };
  };

  const selectedMetrics = getMetricsForPlatform(selectedPlatform);

  const allMetrics = platforms.map((p) => ({
    platform: p,
    metrics: getMetricsForPlatform(p),
  })).filter(m => m.metrics);

  const renderTrend = (value: number) => {
    if (value === 0) return null;
    return value > 0 ? (
      <span className="text-green-600 flex items-center gap-1">
        <TrendingUp size={16} />
        +{value.toFixed(1)}%
      </span>
    ) : (
      <span className="text-red-600 flex items-center gap-1">
        <TrendingDown size={16} />
        {value.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Análise Comparativa</h1>
        <p className="text-gray-600">Comparação entre plataformas e períodos</p>
      </div>

      {/* Platform Selector */}
      <div className="flex gap-2 flex-wrap">
        {platforms.map((platform) => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedPlatform === platform
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-500'
            }`}
          >
            {platform === 'all' ? 'Todas' : platform.charAt(0).toUpperCase() + platform.slice(1)}
          </button>
        ))}
      </div>

      {selectedMetrics && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Posts Publicados</p>
              <p className="text-3xl font-bold text-gray-900">{selectedMetrics.posts}</p>
              <p className="text-xs text-gray-500 mt-2">últimos 90 dias</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Engagement Médio</p>
              <p className="text-3xl font-bold text-purple-600">{selectedMetrics.avgEngagement.toFixed(2)}%</p>
              <p className="text-xs text-gray-500 mt-2">por post</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Alcance Total</p>
              <p className="text-3xl font-bold text-blue-600">
                {(selectedMetrics.totalReach / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-gray-500 mt-2">visualizações</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Seguidores</p>
              <p className="text-3xl font-bold text-green-600">
                {(selectedMetrics.followers / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-gray-500 mt-2">base atual</p>
            </div>
          </div>

          {/* Growth Analysis */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Crescimento de Seguidores</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-4 bg-blue-50">
                <p className="text-sm text-gray-600 mb-2">Última Semana</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-3xl font-bold">{selectedMetrics.growthWeek.toFixed(2)}%</p>
                  {renderTrend(selectedMetrics.growthWeek)}
                </div>
                <p className="text-xs text-gray-600">vs 7 dias atrás</p>
              </div>

              <div className="border rounded-lg p-4 bg-green-50">
                <p className="text-sm text-gray-600 mb-2">Último Mês</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-3xl font-bold">{selectedMetrics.growthMonth.toFixed(2)}%</p>
                  {renderTrend(selectedMetrics.growthMonth)}
                </div>
                <p className="text-xs text-gray-600">vs 30 dias atrás</p>
              </div>

              <div className="border rounded-lg p-4 bg-purple-50">
                <p className="text-sm text-gray-600 mb-2">Últimos 90 Dias</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-3xl font-bold">{selectedMetrics.growth90.toFixed(2)}%</p>
                  {renderTrend(selectedMetrics.growth90)}
                </div>
                <p className="text-xs text-gray-600">vs 90 dias atrás</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cross-Platform Comparison */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Comparação Cross-Plataforma</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Plataforma</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Posts</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Engagement</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Alcance</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Cresc. (7d)</th>
              </tr>
            </thead>
            <tbody>
              {allMetrics.map(({ platform, metrics }) => (
                <tr
                  key={platform}
                  className={`border-b hover:bg-gray-50 ${
                    selectedPlatform === platform ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-medium text-gray-900 capitalize">{platform === 'all' ? 'Todas' : platform}</td>
                  <td className="text-right py-3 px-4 text-gray-700">{metrics?.posts || 0}</td>
                  <td className="text-right py-3 px-4">
                    <span className="font-bold text-purple-600">{(metrics?.avgEngagement || 0).toFixed(2)}%</span>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-700">
                    {((metrics?.totalReach || 0) / 1000000).toFixed(1)}M
                  </td>
                  <td className="text-right py-3 px-4">
                    {renderTrend(metrics?.growthWeek || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Ranking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Melhor Engagement</h3>
          <div className="space-y-3">
            {[...allMetrics]
              .sort((a, b) => (b.metrics?.avgEngagement || 0) - (a.metrics?.avgEngagement || 0))
              .slice(0, 3)
              .map(({ platform, metrics }, index) => (
                <div key={platform} className="flex items-center justify-between bg-white rounded p-3">
                  <span className="font-semibold">
                    #{index + 1} {platform === 'all' ? 'Todas' : platform.toUpperCase()}
                  </span>
                  <span className="text-xl font-bold text-purple-600">
                    {(metrics?.avgEngagement || 0).toFixed(2)}%
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Melhor Crescimento (7d)</h3>
          <div className="space-y-3">
            {[...allMetrics]
              .sort((a, b) => (b.metrics?.growthWeek || 0) - (a.metrics?.growthWeek || 0))
              .slice(0, 3)
              .map(({ platform, metrics }, index) => (
                <div key={platform} className="flex items-center justify-between bg-white rounded p-3">
                  <span className="font-semibold">
                    #{index + 1} {platform === 'all' ? 'Todas' : platform.toUpperCase()}
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    +{(metrics?.growthWeek || 0).toFixed(2)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
