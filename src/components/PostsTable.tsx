import React from 'react';
import { SocialPost } from '../types';
import { ThumbsUp, MessageCircle, Share2, Eye, Flame } from 'lucide-react';

interface PostsTableProps {
  posts: SocialPost[];
  limit?: number;
}

const platformColors = {
  linkedin: 'bg-blue-100 text-blue-800',
  instagram: 'bg-pink-100 text-pink-800',
  tiktok: 'bg-black text-white',
  youtube: 'bg-red-100 text-red-800'
};

export const PostsTable: React.FC<PostsTableProps> = ({ posts, limit = 20 }) => {
  const displayPosts = posts.slice(0, limit);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Plataforma</th>
            <th className="px-4 py-3 text-left font-semibold">Data</th>
            <th className="px-4 py-3 text-left font-semibold">Tipo</th>
            <th className="px-4 py-3 text-left font-semibold">Caption</th>
            <th className="px-4 py-3 text-right font-semibold">Likes</th>
            <th className="px-4 py-3 text-right font-semibold">Comentários</th>
            <th className="px-4 py-3 text-right font-semibold">Views</th>
            <th className="px-4 py-3 text-right font-semibold">Engagement</th>
          </tr>
        </thead>
        <tbody>
          {displayPosts.map((post) => (
            <tr key={post.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${platformColors[post.platform]}`}>
                  {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(post.posted_at).toLocaleDateString('pt-BR', {
                  month: 'short',
                  day: 'numeric',
                  year: '2-digit'
                })}
              </td>
              <td className="px-4 py-3 text-gray-600 capitalize">{post.content_type}</td>
              <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{post.caption}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <ThumbsUp size={14} />
                  {post.metrics.likes.toLocaleString()}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <MessageCircle size={14} />
                  {post.metrics.comments.toLocaleString()}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Eye size={14} />
                  {post.metrics.views.toLocaleString()}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Flame size={14} className="text-orange-500" />
                  <span className="font-semibold">{post.engagement_rate.toFixed(2)}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
