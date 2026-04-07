# 🔄 Paula Pimenta Social Data Sync

Coleta dados de LinkedIn, Instagram, TikTok, YouTube automaticamente e envia para Supabase (que alimenta o Lovable).

## ⚡ Quick Start

### 1️⃣ Primeira execução - Criar tabelas no Supabase

Acesse: https://app.supabase.com/project/ljqfhvpfgvngxpaiufmk/editor

Cole este SQL e execute:

```sql
CREATE TABLE IF NOT EXISTS paula_social_posts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  platform TEXT NOT NULL,
  post_id TEXT NOT NULL UNIQUE,
  content_type TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  published_hour INT,
  published_day TEXT,
  caption TEXT,
  caption_length INT,
  hashtags TEXT[],
  metrics JSONB DEFAULT '{}',
  engagement_rate DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paula_social_daily_snapshot (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  followers INT,
  following INT,
  posts_published INT,
  avg_engagement_rate DECIMAL(10, 2),
  total_reach BIGINT,
  total_impressions BIGINT,
  growth_vs_yesterday DECIMAL(10, 2),
  growth_vs_7_days_ago DECIMAL(10, 2),
  growth_vs_30_days_ago DECIMAL(10, 2),
  growth_vs_90_days_ago DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, platform)
);

CREATE INDEX IF NOT EXISTS idx_paula_posts_platform ON paula_social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_paula_posts_posted_at ON paula_social_posts(posted_at);
CREATE INDEX IF NOT EXISTS idx_paula_snapshot_date ON paula_social_daily_snapshot(date);
```

### 2️⃣ Coletar dados (execute de qualquer lugar)

```bash
cd /Users/matheusmartins/Library/CloudStorage/GoogleDrive-mtxagenciacriativa@gmail.com/My\ Drive/Antigravity/paula-pimenta-social-dashboard

node sync-paula-data.js
```

**Ou como alias para executar de qualquer lugar:**

```bash
alias sync-paula='node /Users/matheusmartins/Library/CloudStorage/GoogleDrive-mtxagenciacriativa@gmail.com/My\ Drive/Antigravity/paula-pimenta-social-dashboard/sync-paula-data.js'

sync-paula
```

### 3️⃣ Ver os dados no Lovable

Os dados aparecerão automaticamente em:
👉 **https://paula-diagnostics-portal.lovable.app**

---

## 📊 O que acontece

1. **Coleta**: Apify scrapa LinkedIn, Instagram, TikTok, YouTube
2. **Normaliza**: Padroniza dados de todos os formatos
3. **Calcula**: Engagement rate, horários, dias, etc.
4. **Insere**: Envia para Supabase (`paula_social_posts`)
5. **Lovable**: Portal atualiza automaticamente com os dados

---

## 🔄 Agendamento (N8N) - Próxima etapa

Para rodar **automaticamente toda segunda-feira às 09:00 BRT**:

1. Acesse N8N (em `CLAUDE.md` do projeto)
2. Crie webhook que chama este comando
3. Conecte com Apify via N8N

Ou deixe rodar manualmente conforme precisar.

---

## ⚙️ Variáveis necessárias

Verificar `.env.local`:
- ✅ `APIFY_TOKEN` - Token Apify API
- ✅ `SUPABASE_URL` - URL do Supabase
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Chave de permissão total

---

## 📈 Métricas calculadas automaticamente

- **Engagement Rate** = (likes + comments + shares) / views × 100
- **Published Hour** = hora do dia que foi publicado
- **Published Day** = dia da semana
- **Caption Length** = comprimento do texto
- **Hashtags** = extrae automaticamente

---

## 🚨 Troubleshooting

**"Erro ao coletar LinkedIn"**
- Verificar se Apify token é válido em `.env.local`
- URL do LinkedIn pode estar bloqueada (try again depois)

**"Erro ao inserir em Supabase"**
- Verificar se tabelas foram criadas no SQL Editor
- Verificar `SUPABASE_SERVICE_ROLE_KEY` em `.env.local`

**"Nenhum dado apareceu no Lovable"**
- Aguarde 30s (cache)
- Verificar se dados foram inseridos: `SELECT COUNT(*) FROM paula_social_posts;`

