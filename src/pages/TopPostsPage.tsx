import React from 'react';
import { usePaulaSocialData } from '../hooks/usePaulaSocialData';
import { Award, TrendingUp, Eye, Heart, Loader } from 'lucide-react';

export const TopPostsPage: React.FC = () => {
  const { posts, loading, error } = usePaulaSocialData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>;
  }

  const topPosts = [...posts]
    .sort((a, b) => b.engagement_rate - a.engagement_rate)
    .slice(0, 10);

  const platformColors = {
    linkedin: 'bg-blue-50 border-blue-200',
    instagram: 'bg-pink-50 border-pink-200',
    tiktok: 'bg-gray-50 border-gray-200',
    youtube: 'bg-red-50 border-red-200',
  };

  const platformBadgeColors = {
    linkedin: 'bg-blue-100 text-blue-800',
    instagram: 'bg-pink-100 text-pink-800',
    tiktok: 'bg-gray-100 text-gray-800',
    youtube: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Top 10 Posts</h1>
        <p className="text-gray-600">Posts com melhor engagement nos últimos 90 dias</p>
      </div>

      <div className="space-y-4">
        {topPosts.map((post, index) => (
          <div
            key={post.post_id}
            className={`border-2 rounded-lg p-6 ${
              platformColors[post.platform as keyof typeof platformColors] || 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-yellow-500 text-white rounded-full font-bold">
                  #{index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      platformBadgeColors[post.platform as keyof typeof platformBadgeColors]
                    }`}>
                      {post.platform.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(post.posted_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 capitalize">
                    {post.content_type} · {post.published_day}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">{post.engagement_rate.toFixed(2)}%</div>
                <p className="text-xs text-gray-600">Engagement Rate</p>
              </div>
            </div>

            <div className="mb-4 pb-4 border-b">
              <p className="text-gray-800 font-medium line-clamp-2">{post.caption || '(Sem caption)'}</p>
              {post.hashtags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {post.hashtags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-xs text-blue-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="flex items-center gap-1 text-red-500 mb-1">
                  <Heart size={16} />
                  <span className="text-xs font-semibold">Likes</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{post.metrics.likes.toLocaleString()}</p>
              </div>

              <div>
                <div className="flex items-center gap-1 text-blue-500 mb-1">
                  <TrendingUp size={16} />
                  <span className="text-xs font-semibold">Comments</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{post.metrics.comments.toLocaleString()}</p>
              </div>

              <div>
                <div className="flex items-center gap-1 text-purple-500 mb-1">
                  <Award size={16} />
                  <span className="text-xs font-semibold">Shares</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{post.metrics.shares.toLocaleString()}</p>
              </div>

              <div>
                <div className="flex items-center gap-1 text-orange-500 mb-1">
                  <Eye size={16} />
                  <span className="text-xs font-semibold">Reach</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{(post.metrics.reach / 1000).toFixed(0)}k</p>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Score</div>
                <p className="text-lg font-bold text-green-600">
                  {(post.metrics.likes + post.metrics.comments + post.metrics.shares).toLocaleString()}
                </p>
              </div>
            </div>

            {index === 0 && (
              <div className="mt-4 pt-4 border-t bg-yellow-100 rounded px-3 py-2">
                <p className="text-sm font-semibold text-yellow-900">🏆 Post Campeão</p>
                <p className="text-xs text-yellow-800 mt-1">
                  Este post superou a média por {(post.engagement_rate / 7).toFixed(1)}x
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Análise dos Top 10</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Engagement Médio (Top 10)</p>
            <p className="text-2xl font-bold text-green-600">
              {(topPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / topPosts.length).toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Plataforma Dominante</p>
            <p className="text-2xl font-bold text-gray-900">
              {(() => {
                const counts = topPosts.reduce((acc, p) => {
                  acc[p.platform] = (acc[p.platform] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);
                return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0].toUpperCase();
              })()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Formato Vencedor</p>
            <p className="text-2xl font-bold text-gray-900">
              {(() => {
                const counts = topPosts.reduce((acc, p) => {
                  acc[p.content_type] = (acc[p.content_type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);
                return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0].toUpperCase();
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
