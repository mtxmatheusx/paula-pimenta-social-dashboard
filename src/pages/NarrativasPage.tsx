import React from 'react';
import { usePaulaSocialData } from '../hooks/usePaulaSocialData';
import { Lightbulb, Zap, Target, TrendingUp, Loader } from 'lucide-react';

export const NarrativasPage: React.FC = () => {
  const { posts, narratives, loading, error } = usePaulaSocialData();

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

  const topPosts = [...posts]
    .sort((a, b) => b.engagement_rate - a.engagement_rate)
    .slice(0, 10);

  // Analyze formats
  const formatAnalysis = ['image', 'video', 'carousel', 'text'].map((format) => {
    const formatPosts = posts.filter(p => p.content_type === format);
    const avgEngagement = formatPosts.length > 0
      ? formatPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / formatPosts.length
      : 0;
    const topPostFormat = formatPosts.sort((a, b) => b.engagement_rate - a.engagement_rate)[0];
    return {
      format,
      count: formatPosts.length,
      avgEngagement,
      topPost: topPostFormat,
    };
  }).sort((a, b) => b.avgEngagement - a.avgEngagement);

  // Analyze publishing times
  const timeAnalysis = Array.from({ length: 24 }, (_, i) => i).map((hour) => {
    const hourPosts = posts.filter(p => p.published_hour === hour);
    const avgEngagement = hourPosts.length > 0
      ? hourPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / hourPosts.length
      : 0;
    return { hour, count: hourPosts.length, avgEngagement };
  }).filter(t => t.count > 0).sort((a, b) => b.avgEngagement - a.avgEngagement);

  const bestHour = timeAnalysis[0];
  const bestDay = Array.from({ length: 7 }, (_, i) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[i];
    const dayPosts = posts.filter(p => p.published_day === dayName);
    const avgEngagement = dayPosts.length > 0
      ? dayPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / dayPosts.length
      : 0;
    return { day: dayName, count: dayPosts.length, avgEngagement };
  }).filter(d => d.count > 0).sort((a, b) => b.avgEngagement - a.avgEngagement)[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Narrativas & Recomendações</h1>
        <p className="text-gray-600">Padrões vencedores e análise de conteúdo</p>
      </div>

      {/* Format Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="text-blue-600" />
          Análise de Formatos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formatAnalysis.map((fmt) => (
            <div key={fmt.format} className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 capitalize">{fmt.format}</h3>
                  <p className="text-sm text-gray-600">{fmt.count} posts</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-purple-600">{fmt.avgEngagement.toFixed(2)}%</p>
                  <p className="text-xs text-gray-600">engagement médio</p>
                </div>
              </div>
              <div className="bg-white rounded p-3 mb-3">
                <p className="text-xs font-semibold text-gray-600 mb-1">Top post</p>
                <p className="text-sm text-gray-800 line-clamp-2">
                  {fmt.topPost?.caption?.substring(0, 80) || 'N/A'}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min((fmt.avgEngagement / 15) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timing Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="text-yellow-500" />
            Melhor Horário para Publicar
          </h2>
          {bestHour ? (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-4xl font-bold text-yellow-600 mb-2">
                {bestHour.hour.toString().padStart(2, '0')}:00
              </p>
              <p className="text-gray-700 mb-3">
                <strong>{bestHour.avgEngagement.toFixed(2)}%</strong> engagement médio
              </p>
              <p className="text-sm text-gray-600">
                {bestHour.count} posts publicados neste horário
              </p>
              <div className="mt-4 p-3 bg-white rounded border-l-4 border-yellow-500">
                <p className="text-xs font-semibold text-gray-700">💡 Recomendação</p>
                <p className="text-sm text-gray-700 mt-1">
                  Publique seus posts principais às {bestHour.hour.toString().padStart(2, '0')}:00 para melhor performance
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Dados insuficientes</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="text-green-500" />
            Melhor Dia da Semana
          </h2>
          {bestDay ? (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-4xl font-bold text-green-600 mb-2 capitalize">
                {bestDay.day}
              </p>
              <p className="text-gray-700 mb-3">
                <strong>{bestDay.avgEngagement.toFixed(2)}%</strong> engagement médio
              </p>
              <p className="text-sm text-gray-600">
                {bestDay.count} posts publicados neste dia
              </p>
              <div className="mt-4 p-3 bg-white rounded border-l-4 border-green-500">
                <p className="text-xs font-semibold text-gray-700">💡 Recomendação</p>
                <p className="text-sm text-gray-700 mt-1">
                  Priorize conteúdo de alto valor para {bestDay.day} às {bestHour?.hour.toString().padStart(2, '0') || '09'}:00
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Dados insuficientes</p>
          )}
        </div>
      </div>

      {/* Themes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Lightbulb className="text-orange-500" />
          Temas Vencedores
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {narratives && narratives.length > 0 ? (
            narratives.slice(0, 4).map((narrative) => (
              <div key={narrative.id} className="border-2 border-orange-200 rounded-lg p-5 bg-orange-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 capitalize">{narrative.theme}</h3>
                    <p className="text-sm text-gray-600">Plataforma: {narrative.platform}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">{narrative.frequency_in_top_10}</p>
                    <p className="text-xs text-gray-600">em top 10</p>
                  </div>
                </div>
                <div className="bg-white rounded p-3 mb-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Recomendação</p>
                  <p className="text-sm text-gray-800">{narrative.recommendation}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Confiança:</span>
                  <span className="font-bold text-orange-600">{narrative.confidence_score}%</span>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-2 text-gray-600">Analisando padrões de conteúdo...</p>
          )}
        </div>
      </div>

      {/* Content Recommendations */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">🚀 Próximo Post Recomendado</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <p className="text-sm font-semibold text-purple-100 mb-2">Formato Ideal</p>
            <p className="text-3xl font-bold capitalize">
              {formatAnalysis[0]?.format || 'video'}
            </p>
            <p className="text-sm text-purple-100 mt-1">Melhor engagement</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <p className="text-sm font-semibold text-purple-100 mb-2">Melhor Horário</p>
            <p className="text-3xl font-bold">
              {bestHour?.hour.toString().padStart(2, '0') || '09'}:00
            </p>
            <p className="text-sm text-purple-100 mt-1">
              {bestDay?.day && `${bestDay.day.charAt(0).toUpperCase() + bestDay.day.slice(1)}`}
            </p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <p className="text-sm font-semibold text-purple-100 mb-2">Tema Recomendado</p>
            <p className="text-2xl font-bold capitalize">
              {narratives && narratives[0]?.theme || 'liderança'}
            </p>
            <p className="text-sm text-purple-100 mt-1">Alto potencial viral</p>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-white border-opacity-20">
          <p className="text-sm text-purple-100 mb-3">
            📋 <strong>Checklist:</strong> Use um {formatAnalysis[0]?.format || 'vídeo'} sobre {narratives?.[0]?.theme || 'liderança'},
            publique às {bestHour?.hour.toString().padStart(2, '0') || '09'}:00 de {bestDay?.day || 'terça'} e espere 3-5x melhor engagement!
          </p>
        </div>
      </div>
    </div>
  );
};
