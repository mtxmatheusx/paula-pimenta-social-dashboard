#!/usr/bin/env node

/**
 * Paula Pimenta Social Data Sync
 *
 * Uso:
 * node sync-paula-data.js
 *
 * Coleta dados de LinkedIn, Instagram, TikTok, YouTube via Apify
 * e envia para Supabase (que alimenta o Lovable)
 */

const fs = require('fs');
const path = require('path');

// Carrega .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...values] = line.split('=');
    env[key.trim()] = values.join('=').trim();
  }
});

const APIFY_TOKEN = env.APIFY_TOKEN;
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!APIFY_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Credenciais faltando em .env.local');
  process.exit(1);
}

async function fetchApify(actor, config, platform) {
  console.log(`🔄 Coletando ${platform}...`);

  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/${actor}/run-sync?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      }
    );

    if (!response.ok) {
      console.error(`   ❌ Erro: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log(`   ✅ ${platform}: ${data.length || 0} itens coletados`);
    return data;
  } catch (error) {
    console.error(`   ❌ Erro ao coletar ${platform}:`, error.message);
    return null;
  }
}

async function insertSupabase(table, data) {
  if (!data || data.length === 0) return 0;

  console.log(`   💾 Inserindo ${data.length} registros em ${table}...`);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`   ❌ Erro ao inserir: ${response.status}`);
      console.error(`   Resposta: ${error}`);
      return 0;
    }

    console.log(`   ✅ Inserção bem-sucedida`);
    return data.length;
  } catch (error) {
    console.error(`   ❌ Erro:`, error.message);
    return 0;
  }
}

async function normalizeData(rawData, platform) {
  if (!rawData) return [];

  const normalized = [];

  if (platform === 'linkedin' && rawData.posts) {
    rawData.posts.forEach(post => {
      normalized.push({
        platform: 'linkedin',
        post_id: post.postId || post.id,
        content_type: post.mediaUrls?.length > 1 ? 'carousel' : (post.videoUrl ? 'video' : 'image'),
        posted_at: new Date(post.timestamp * 1000).toISOString(),
        published_hour: new Date(post.timestamp * 1000).getHours(),
        published_day: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
          new Date(post.timestamp * 1000).getDay()
        ],
        caption: post.content || '',
        caption_length: (post.content || '').length,
        hashtags: (post.content || '').match(/#\w+/g) || [],
        metrics: {
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.reposts || 0,
          views: post.views || 0
        },
        engagement_rate: ((post.likes + post.comments + post.reposts) / (post.views || 1)) * 100
      });
    });
  }

  if (platform === 'instagram' && rawData.posts) {
    rawData.posts.forEach(post => {
      normalized.push({
        platform: 'instagram',
        post_id: post.id,
        content_type: post.videoPlayCount ? 'video' : 'image',
        posted_at: new Date(post.timestamp).toISOString(),
        published_hour: new Date(post.timestamp).getHours(),
        published_day: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
          new Date(post.timestamp).getDay()
        ],
        caption: post.caption || '',
        caption_length: (post.caption || '').length,
        hashtags: (post.caption || '').match(/#\w+/g) || [],
        metrics: {
          likes: post.likesCount || 0,
          comments: post.commentsCount || 0,
          shares: 0,
          views: post.videoPlayCount || 0
        },
        engagement_rate: ((post.likesCount + post.commentsCount) / (post.videoPlayCount || post.likesCount || 1)) * 100
      });
    });
  }

  if (platform === 'tiktok' && rawData.videos) {
    rawData.videos.forEach(video => {
      normalized.push({
        platform: 'tiktok',
        post_id: video.id,
        content_type: 'video',
        posted_at: new Date(video.createTime * 1000).toISOString(),
        published_hour: new Date(video.createTime * 1000).getHours(),
        published_day: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
          new Date(video.createTime * 1000).getDay()
        ],
        caption: video.desc || '',
        caption_length: (video.desc || '').length,
        hashtags: (video.desc || '').match(/#\w+/g) || [],
        metrics: {
          likes: video.likeCount || 0,
          comments: video.commentCount || 0,
          shares: video.shareCount || 0,
          views: video.playCount || 0
        },
        engagement_rate: ((video.likeCount + video.commentCount + video.shareCount) / (video.playCount || 1)) * 100
      });
    });
  }

  if (platform === 'youtube' && rawData.videos) {
    rawData.videos.forEach(video => {
      normalized.push({
        platform: 'youtube',
        post_id: video.videoId,
        content_type: 'video',
        posted_at: new Date(video.publishedAt).toISOString(),
        published_hour: new Date(video.publishedAt).getHours(),
        published_day: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
          new Date(video.publishedAt).getDay()
        ],
        caption: video.title || '',
        caption_length: (video.title || '').length,
        hashtags: [],
        metrics: {
          likes: video.likeCount || 0,
          comments: video.commentCount || 0,
          shares: 0,
          views: video.viewCount || 0
        },
        engagement_rate: ((video.likeCount + video.commentCount) / (video.viewCount || 1)) * 100
      });
    });
  }

  return normalized;
}

async function main() {
  console.log('🚀 Paula Pimenta Social Data Sync');
  console.log('📅 ' + new Date().toLocaleString());
  console.log('');

  // Coleta de dados
  const linkedinRaw = await fetchApify(
    'apify~linkedin-profile-scraper',
    {
      startUrls: [{ url: 'https://www.linkedin.com/in/paula-valio-pimenta/' }],
      includeProfile: true,
      getFollowers: true,
      maxPosts: 100,
      timeframe: '90d'
    },
    'LinkedIn'
  );

  const instagramRaw = await fetchApify(
    'apify~instagram-scraper',
    {
      usernames: ['paulavaliopimenta'],
      includeUserInfo: true,
      includePosts: true,
      maxPosts: 100
    },
    'Instagram'
  );

  const tiktokRaw = await fetchApify(
    'apify~tiktok-scraper',
    {
      usernames: ['paulavaliopimenta'],
      maxVideos: 100,
      includeComments: false
    },
    'TikTok'
  );

  const youtubeRaw = await fetchApify(
    'apify~youtube-channel-videos',
    {
      channelUrl: 'https://www.youtube.com/@paulavaliopimenta',
      includeStatistics: true,
      maxVideos: 100
    },
    'YouTube'
  );

  console.log('');
  console.log('📊 Normalizando dados...');

  // Normalização
  const linkedin = await normalizeData(linkedinRaw, 'linkedin');
  const instagram = await normalizeData(instagramRaw, 'instagram');
  const tiktok = await normalizeData(tiktokRaw, 'tiktok');
  const youtube = await normalizeData(youtubeRaw, 'youtube');

  const allPosts = [...linkedin, ...instagram, ...tiktok, ...youtube];

  console.log(`✅ Total de posts: ${allPosts.length}`);
  console.log('');

  // Inserção em Supabase
  console.log('💾 Inserindo em Supabase...');

  let inserted = 0;
  if (allPosts.length > 0) {
    inserted = await insertSupabase('paula_social_posts', allPosts);
  }

  console.log('');
  console.log('✨ Sincronização completa!');
  console.log(`📈 ${inserted} posts inseridos`);
  console.log('');
  console.log('🔗 Os dados estão disponíveis em:');
  console.log(`   https://paula-diagnostics-portal.lovable.app`);
  console.log('');
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
