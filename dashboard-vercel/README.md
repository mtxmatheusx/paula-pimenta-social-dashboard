# Paula Pimenta Social Analytics Dashboard

Dashboard profissional de análise de redes sociais para Paula Pimenta, consolidando dados de LinkedIn, Instagram, TikTok e YouTube com visualizações avançadas de engagement, alcance e narrativas vencedoras.

## 🚀 Status

- ✅ **Dados coletados**: 188 posts + 360 snapshots diários (90 dias)
- ✅ **Banco Supabase**: Pronto e populado
- 🔄 **Dashboard React**: Em desenvolvimento
- 📅 **Agendamento N8N**: Configurado para segunda-feira 09:00 BRT

## 📋 Funcionalidades

### Implementadas (MVP)
- [x] KPI Cards (Followers, Engagement Rate, Reach, Growth)
- [x] Tabela de Top 10 Posts
- [x] Cards de resumo por plataforma

### Em Desenvolvimento
- [ ] LinkedIn Analytics
- [ ] Instagram Analytics
- [ ] TikTok Analytics
- [ ] YouTube Analytics
- [ ] Análise Comparativa
- [ ] Posts Campeões (Top 10)
- [ ] Análise de Narrativas Vencedoras
- [ ] Engine de Recomendações de Conteúdo
- [ ] Gráficos avançados (Recharts)
- [ ] Filtros por período

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Data**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Deployment**: Vercel
- **Icons**: Lucide React

## 📦 Instalação

### Prerequisites
- Node.js 18+
- npm ou yarn
- Git

### Setup Inicial

```bash
# Clone ou navegue até o projeto
cd dashboard-vercel

# Instale dependências
npm install

# Crie arquivo .env.local a partir do template
cp .env.example .env.local

# Inicie servidor de desenvolvimento
npm run dev
```

O dashboard estará disponível em `http://localhost:3000`

## 🔐 Variáveis de Ambiente

Crie `.env.local` com:

```env
VITE_SUPABASE_URL=https://ljqfhvpfgvngxpaiufmk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 Dados Disponíveis

### Tabelas Supabase

**paula_social_posts** (188 registros)
- platform, post_id, content_type, posted_at, published_hour, published_day
- caption, caption_length, hashtags
- metrics (likes, comments, shares, views, saves, reach)
- engagement_rate (0-100%)

**paula_social_daily_snapshot** (360 registros)
- date, platform, followers, following, posts_published
- avg_engagement_rate, total_reach, total_impressions
- growth_vs_yesterday, growth_vs_7_days_ago, growth_vs_30_days_ago, growth_vs_90_days_ago

## 🚀 Deploy em Vercel

### Opção 1: Via Vercel CLI

```bash
# Instale Vercel CLI
npm i -g vercel

# Deploy
vercel

# Com variáveis de ambiente
vercel --env-file .env.local
```

### Opção 2: Via GitHub + Vercel Dashboard

1. Faça push do código para GitHub
2. Conecte repositório em [vercel.com](https://vercel.com)
3. Configure variáveis de ambiente no Vercel Settings
4. Deploy automático em cada push

### Opção 3: Git Commands

```bash
git add .
git commit -m "Deploy: Paula Social Dashboard MVP"
git push origin main
```

## 📈 Estrutura de Componentes

```
src/
├── components/
│   ├── KPICard.tsx          # Card de métrica com trend
│   └── PostsTable.tsx       # Tabela de posts
├── pages/
│   └── Overview.tsx         # Página principal
├── hooks/
│   └── usePaulaSocialData.ts # Hook de data fetching
├── types/
│   └── index.ts             # TypeScript interfaces
├── App.tsx                  # Main app component
├── main.tsx                 # Entry point
└── index.css                # Global styles
```

## 🎯 KPIs Calculados

- **Engagement Rate**: (Likes + Comments + Shares + Saves) / Reach × 100
- **Growth Rate**: (Current Followers - Previous Followers) / Previous Followers × 100
- **Average Engagement**: Média de engagement rate de todos os posts
- **Total Reach**: Soma do reach de todos os posts
- **Top Performer**: Post com maior engagement rate

## 📅 Próximos Passos

1. Adicionar mais views (LinkedIn, Instagram, TikTok, YouTube)
2. Implementar gráficos com Recharts
3. Análise de narrativas vencedoras
4. Engine de recomendações
5. Filtros por período
6. Export de relatórios

## 🔄 Agendamento de Sincronização

Agendado via N8N para **segunda-feira às 09:00 BRT**:

```
[Schedule] → [Apify Scraping] → [Transform Data] → [Insert Supabase]
```

Veja `/N8N_WORKFLOW_SETUP_GUIDE.md` para configuração completa.

## 📞 Suporte

Dúvidas ou issues? Verifique:
- `/migrations/001_create_paula_social_tables.sql` - Schema Supabase
- `/scripts/` - Utilitários
- `/docs/` - Documentação

---

**Última atualização**: 2026-04-07
**Status**: Em desenvolvimento
