# Passo 01: Avaliação Portal Diagnósticos Existente

**Data:** 2026-04-07
**Status:** ✅ Completo
**Portal Avaliado:** https://paula-diagnostics-portal.lovable.app

## 1. Estrutura Técnica

### Stack Confirmado
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** TailwindCSS (design system moderno)
- **Database:** Supabase PostgreSQL
- **Hospedagem:** Vercel (Lovable deployment)
- **Componentes:** KPI cards, data visualizations

### Arquitetura de Rotas
- `/` - Homepage com dashboard de Instagram metrics
- `/roteiros` - Página de estratégia de storytelling (content generation)
- Não há `/diagnostico` ou `/ai-chat` neste portal (não é o mtx-roi-command completo)

## 2. Dados & Métricas Coletadas

### KPIs Encontrados (Instagram)
- **Seguidores:** 15.441
- **Publicações:** 252
- **Taxa de Engajamento:** 0.7%
- **Resultados de Tráfego:** Métricas de campanhas (R$ 12.529,31 gasto, 32.963 clicks, 9.959 conversões)

### Observações sobre Métricas
- Foco primário em **Instagram**
- Engagement rate baixo (0.7%) indica oportunidade de melhoria
- Dados de tráfego parecem ser de campanhas pagas (não orgânico)
- **Gap:** Não há breakdowns por tipo de post (image, video, carousel, text)
- **Gap:** Não há comparativos mês a mês
- **Gap:** Não há análise de narrativas/temas performantes

## 3. Funcionalidades Existentes a Reutilizar

### ✅ Pronto para Adaptar
1. **Layout & Navigation** - AppLayout com header de perfil
2. **KPI Card System** - Cards com métricas e trend indicators
3. **Data Visualization** - Padrão de gráficos e tabelas
4. **Supabase Integration** - Conexão com banco de dados
5. **Authentication** - Login via Supabase já implementado

### ⚠️ Não Encontrado Neste Portal
- AI Chat (traffic manager) - mencionado no plano como funcionalidade do mtx-roi-command
- VSL/Content Generator - apenas storytelling strategy, não full VSL generation
- Multi-platform analytics - foco exclusivo em Instagram
- Historical data (90 dias) - sem visualizações de série temporal
- Agendamento automático (cron jobs)

## 4. Gaps Identificados para Paula Social Dashboard

| Gap | Impacto | Solução |
|-----|---------|---------|
| Apenas Instagram | Alto | Integrar LinkedIn, TikTok, YouTube |
| Sem análise histórica (90d) | Alto | Criar paula_social_daily_snapshot table |
| Sem breakdown por formato | Médio | Adicionar campo content_type em posts |
| Sem análise de narrativas | Médio | Criar paula_social_narratives table |
| Sem recomendações automáticas | Médio | Implementar Content Recommendation Engine |
| Sem agendamento automático | Médio | Setup Apify + N8N weekly cron |

## 5. Estrutura de Dados Recomendada

### Novas Tabelas a Criar no Supabase

```sql
-- paula_social_posts: posts individuais dos últimos 90 dias
CREATE TABLE paula_social_posts (
  id SERIAL PRIMARY KEY,
  platform TEXT,
  post_id VARCHAR(255) UNIQUE,
  content_type TEXT, -- image, video, carousel, text, reel, story
  posted_at TIMESTAMP,
  published_hour INT,
  published_day TEXT,
  caption TEXT,
  caption_length INT,
  hashtags TEXT[],
  metrics JSONB, -- {likes, comments, shares, views, reach}
  engagement_rate FLOAT,
  rank_by_engagement INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- paula_social_daily_snapshot: snapshot diário de crescimento
CREATE TABLE paula_social_daily_snapshot (
  id SERIAL PRIMARY KEY,
  date DATE,
  platform TEXT,
  followers INT,
  following INT,
  posts_published INT,
  avg_engagement_rate FLOAT,
  total_reach INT,
  total_impressions INT,
  growth_vs_yesterday FLOAT,
  growth_vs_7_days_ago FLOAT,
  growth_vs_30_days_ago FLOAT,
  growth_vs_90_days_ago FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- paula_social_narratives: padrões identificados
CREATE TABLE paula_social_narratives (
  id SERIAL PRIMARY KEY,
  theme TEXT,
  platform TEXT,
  frequency_in_top_10 INT,
  avg_engagement_rate FLOAT,
  posts_using INT,
  recommendation TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 6. Edge Functions a Portar/Criar

Com base no plano, precisaremos:

1. **paula-social-sync** - Extrai dados via Apify + calcula métricas
2. **paula-social-recommendations** - Gera recomendações baseadas em padrões
3. **paula-content-engine** - Engine de recomendação de conteúdo

Estes devem ser adaptados do mtx-roi-command:
- `ai-chat` → para Social Media Manager AI Consultant
- `generate-vsl` → para Content Recommendation

## 7. Próximos Passos

✅ **Passo 01 (Este):** Avaliação concluída
→ **Passo 02:** Coleta de dados via Apify (LinkedIn, Instagram, TikTok, YouTube - últimos 90 dias)
→ **Passo 03:** Criar dashboard Vercel com visualizações mês a mês
→ **Passo 04:** Gerar prompt atualizado para implementação

## 8. Recursos Reutilizáveis

- **Padrão de KPI Cards:** `/Antigravity/aquarelas-dashboard/src/components/`
- **Social Media Analyzer:** `/Antigravity/.agents/skills/social-media-analyzer/`
- **Supabase Types:** `/mtx-roi-command/src/integrations/supabase/types.ts`
- **Componentes UI:** shadcn-ui + TailwindCSS (já configurado neste portal)

---

**Conclusão:** Portal existente é uma base sólida. Precisamos expandir para multi-plataforma, adicionar análise histórica e narrativas vencedoras. Apify + N8N usarão este mesmo stack.
