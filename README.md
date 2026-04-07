# Paula Pimenta Social Analytics Dashboard

**Status:** 🔄 Passo 02b - Em Execução
**Data Início:** 2026-04-07
**Objetivo:** Dashboard profissional para análise de presença social de Paula Pimenta (LinkedIn, Instagram, TikTok, YouTube)

---

## 📋 Visão Geral

Paula Pimenta é palestrante executiva com forte presença em múltiplas plataformas sociais. Este projeto cria um dashboard consolidado que:

- **Coleta automática** de dados dos últimos 90 dias via Apify (segunda-feira 09:00 BRT)
- **Análise profunda** com engagement rates, growth metrics, narrativas vencedoras
- **Visualizações** mês a mês com comparativos e trending content
- **Recomendações** automáticas de conteúdo baseadas em padrões

**Contas Monitoradas:**
- LinkedIn: https://www.linkedin.com/in/paula-valio-pimenta/
- Instagram: https://www.instagram.com/paulavaliopimenta/
- TikTok: https://www.tiktok.com/@paulavaliopimenta
- YouTube: https://www.youtube.com/@paulavaliopimenta

---

## 📁 Estrutura do Projeto

```
paula-pimenta-social-dashboard/
├── docs/
│   ├── PASSO_01_AVALIACAO_PORTAL.md      # ✅ Avaliação do portal existente
│   ├── PASSO_02_COLETA_DADOS.md          # ✅ Estratégia de coleta
│   ├── PASSO_02b_SETUP_APIFY_N8N.md      # 🔄 Setup Apify + N8N
│   └── PASSO_02b_CHECKLIST.md            # 📋 Checklist de execução
├── migrations/
│   └── 001_create_paula_social_tables.sql # DB schema (3 tabelas)
├── types/
│   └── paula-social.types.ts              # TypeScript interfaces
├── edge-functions/
│   └── paula-social-sync.ts               # Data transformation + insertion
└── README.md                              # Este arquivo
```

---

## 🚀 Quick Start

### 1️⃣ Prerequisites

- Apify account (free tier)
- N8N instance (self-hosted ou cloud)
- Supabase project com credenciais
- Conhecimento básico de Node.js / TypeScript

### 2️⃣ Setup (2h estimadas)

```bash
# 1. Clone migration SQL e execute em Supabase
# Arquivo: migrations/001_create_paula_social_tables.sql

# 2. Criar arquivo .env.local
APIFY_TOKEN=apk_xxxxxxxxxxxxxxxxxxxxx
SUPABASE_PROJECT=xxxxx
SUPABASE_KEY=eyJhbGc...
N8N_WEBHOOK_URL=https://your-n8n/webhook/paula

# 3. Seguir PASSO_02b_CHECKLIST.md para:
# - Setup Apify actors (LinkedIn, Instagram, TikTok, YouTube)
# - Criar N8N workflow
# - Deploy edge function
# - Testar coleta

# 4. Ativar schedule (segunda-feira 09:00 BRT)
```

### 3️⃣ First Data Collection

```bash
# Manual trigger (antes do agendamento automático)
# Pode rodar via N8N interface ou API

# Verificar dados em Supabase:
SELECT COUNT(*) FROM paula_social_posts;
SELECT * FROM paula_social_daily_snapshot ORDER BY date DESC;
```

---

## 📊 Tech Stack

| Componente | Tecnologia |
|-----------|-----------|
| **Data Collection** | Apify (web scraping) |
| **Orchestration** | N8N (workflow automation) |
| **Storage** | Supabase (PostgreSQL) |
| **Processing** | Edge Functions (Deno) |
| **Frontend** | React 18 + TypeScript + TailwindCSS |
| **Deployment** | Vercel |

---

## 🔄 Data Pipeline

```
┌─────────────────────────────────────┐
│ WEEKLY PAULA SOCIAL SYNC             │
│ (Monday 09:00 BRT via N8N)          │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 1. PARALLEL APIFY CALLS             │
├─────────────────────────────────────┤
│ • LinkedIn Scraper                  │
│ • Instagram Scraper                 │
│ • TikTok Scraper                    │
│ • YouTube Scraper                   │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 2. DATA TRANSFORMATION              │
│ • Normalize schema across platforms │
│ • Extract hashtags & themes         │
│ • Detect content type               │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 3. METRICS CALCULATION              │
│ • Engagement Rate = (L+C+S+Sv)/R×100│
│ • Growth Rate vs 7d/30d/90d         │
│ • Top post scoring                  │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 4. SUPABASE INSERTION               │
├─────────────────────────────────────┤
│ • paula_social_posts                │
│ • paula_social_daily_snapshot       │
│ • paula_social_narratives           │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ 5. NOTIFICATION                     │
│ Slack: "Paula Social Sync Complete" │
└─────────────────────────────────────┘
```

---

## 📈 Key Metrics Calculated

### Engagement Rate
```
Engagement Rate = (Likes + Comments + Shares + Saves) / Reach × 100
```

**Industry Benchmarks:**
- LinkedIn: 2-5% (good), 5%+ (excellent)
- Instagram: 3-6% (good), 6%+ (excellent)
- TikTok: 8-15% (good), 15%+ (excellent)
- YouTube: 4-10% (good), 10%+ (excellent)

### Growth Rate
```
Growth Rate = (Current Followers - Previous Followers) / Previous Followers × 100
```

Comparamos: vs yesterday, vs 7 days ago, vs 30 days ago, vs 90 days ago

### Narrative Analysis
- Extração automática de temas em top 10 posts
- Frequência de cada tema vs posts regulares
- Recomendações: "Posts sobre [tema] performam 2.3x melhor"

---

## 🛠️ Core Files

### Database Schema
**File:** `migrations/001_create_paula_social_tables.sql`

**Tables:**
1. `paula_social_posts` - Posts individuais (90 dias)
2. `paula_social_daily_snapshot` - Snapshots diários (180 dias)
3. `paula_social_narratives` - Padrões identificados

### TypeScript Types
**File:** `types/paula-social.types.ts`

Defines all interfaces:
- `PaulaSocialPost` - Post schema
- `PaulaSocialDaily` - Daily snapshot schema
- `PaulaSocialNarrative` - Narrative pattern
- Apify raw output types
- Analysis types

### Data Processing
**File:** `edge-functions/paula-social-sync.ts`

Functions:
- `transformLinkedInData()` - LinkedIn → normalized
- `transformInstagramData()` - Instagram → normalized
- `transformTikTokData()` - TikTok → normalized
- `transformYouTubeData()` - YouTube → normalized
- `calculateEngagementRate()` - Metrics calculation
- `syncPaulaSocialData()` - Main orchestrator

---

## 📝 Passo by Passo

### ✅ Passo 01: Avaliação Portal
**Status:** Completo
**Arquivo:** `docs/PASSO_01_AVALIACAO_PORTAL.md`
- Avaliação do portal Lovable existente
- Identificação de gaps para multi-plataforma
- Recomendações de arquitetura

### 🔄 Passo 02a: Estratégia de Coleta
**Status:** Completo
**Arquivo:** `docs/PASSO_02_COLETA_DADOS.md`
- Seleção de Apify actors
- JSON configurations para cada plataforma
- Schema TypeScript normalizado
- Cálculos de métricas

### 🔄 Passo 02b: Setup Apify + N8N
**Status:** Em Progresso
**Arquivo:** `docs/PASSO_02b_SETUP_APIFY_N8N.md`
**Checklist:** `docs/PASSO_02b_CHECKLIST.md`

**Tarefas:**
1. [ ] Setup Apify account + 4 actors
2. [ ] Criar N8N workflow com 12 nodes
3. [ ] Deploy edge function
4. [ ] Testar pipeline end-to-end
5. [ ] Ativar agendamento segunda-feira 09:00

### ⏳ Passo 02c: Primeira Coleta (90 dias)
**Status:** Pendente
**Próximo Milestone:** Após Passo 02b validado

Executar workflow manualmente para coletar 90 dias históricos.

### ⏳ Passo 03: Dashboard Vercel
**Status:** Pendente
**Deliverables:**
- React components (KPI cards, charts, tables)
- Multi-plataforma tabs
- Comparativos mês a mês
- Análise de narrativas
- Content recommendation engine

### ⏳ Passo 04: Prompt Final
**Status:** Pendente
Gerar prompt estruturado para implementação dashboard em Vercel.

---

## 🔐 Environment Variables

Create `.env.local` (nunca commit no Git):

```env
# Apify
APIFY_TOKEN=apk_xxxxxxxxxxxxxxxxxxxxx

# Supabase
SUPABASE_PROJECT=xxxxx
SUPABASE_KEY=eyJhbGc...
SUPABASE_URL=https://xxxxx.supabase.co

# N8N
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/paula-social-sync

# Slack (opcional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

---

## 📋 Checklist de Execução

Veja `PASSO_02b_CHECKLIST.md` para:
- ✅ Fase 1: Preparação (Supabase + ENV)
- ✅ Fase 2: Apify Setup (4 actors)
- ✅ Fase 3: N8N Workflow (12 nodes)
- ✅ Fase 4: Edge Function Deploy
- ✅ Fase 5: Data Validation
- ✅ Fase 6: Final Checks & Docs

---

## 🐛 Troubleshooting

### Apify Issues
| Erro | Solução |
|------|---------|
| `Authorization invalid` | Verificar APIFY_TOKEN em dashboard |
| `Rate limited` | Usar Free Trial, ou upgrade plano |
| `Private account` | Não aplicável (Paula é pública) |
| `Invalid URL` | Validar exato: `/in/` LinkedIn, `@` TikTok/Instagram |

### N8N Issues
| Erro | Solução |
|------|---------|
| `Cannot find credential` | Adicionar credential em N8N settings |
| `HTTP 401` | Verificar bearer token, SUPABASE_KEY válida |
| `Timeout` | Aumentar timeout HTTP nodes (padrão 30s) |

### Supabase Issues
| Erro | Solução |
|------|---------|
| `RLS policy violation` | Verificar policies em paula_social_posts table |
| `Constraint violation` | Validar post_id é UNIQUE, não duplicado |

---

## 📞 Support & Questions

Veja documentação em `/docs/` para cada passo.

**Status Atual (2026-04-07):**
- Passo 01 ✅ Completo
- Passo 02a ✅ Completo
- Passo 02b 🔄 Em Execução (Setup Apify + N8N)

---

## 📚 Referências

- Apify docs: https://docs.apify.com
- N8N docs: https://docs.n8n.io
- Supabase docs: https://supabase.com/docs
- Paula Pimenta: https://www.paulapimenta.com.br

---

**Last Updated:** 2026-04-07
**Maintained by:** Matheus Martins (MTX Agency)
