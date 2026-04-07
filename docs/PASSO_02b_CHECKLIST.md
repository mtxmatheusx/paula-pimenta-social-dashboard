# Checklist: Passo 02b - Setup Apify + N8N + Supabase

**Data:** 2026-04-07
**Objetivo:** Validar que todas as integrações estão funcionando antes de executar a primeira coleta

---

## ✅ Fase 1: Preparação (30min)

### Database Setup
- [ ] Acessar Supabase dashboard para projeto Paula
- [ ] Criar 3 novas tabelas executando SQL migration:
  - `paula_social_posts` (posts individuais com métricas)
  - `paula_social_daily_snapshot` (snapshots diários)
  - `paula_social_narratives` (padrões identificados)
- [ ] Validar indexes foram criados:
  - `idx_paula_social_posts_platform_date`
  - `idx_paula_social_posts_engagement`
  - `idx_paula_social_daily_snapshot_platform_date`
- [ ] Habilitar RLS (Row Level Security) nas 3 tabelas
- [ ] Copiar `SUPABASE_PROJECT_ID` e `SUPABASE_ANON_KEY` (salvar em `.env`)

### Environment Setup
- [ ] Criar arquivo `.env.local` com credenciais:
  ```
  APIFY_TOKEN=apk_xxxxxxxxxxxxxxxxxxxxx
  SUPABASE_PROJECT=xxxxx
  SUPABASE_KEY=eyJhbGc...
  N8N_WEBHOOK_URL=https://your-n8n/webhook/paula
  ```
- [ ] NÃO commitar credenciais no Git
- [ ] Adicionar `.env.local` ao `.gitignore`

---

## ✅ Fase 2: Apify Setup (30min)

### Account Creation
- [ ] Acessar https://apify.com/sign-up
- [ ] Criar conta com email
- [ ] Confirmar email
- [ ] Ir para Settings → API Tokens
- [ ] Copiar `default` API Token para `.env` como `APIFY_TOKEN`

### Test API Connection
- [ ] Executar teste de conexão:
  ```bash
  curl -H "Authorization: Bearer ${APIFY_TOKEN}" \
    https://api.apify.com/v2/acts
  ```
- [ ] ✅ Esperado: status 200 com lista de atores
- [ ] ❌ Se falhar: verificar token, expiração, permissões

### Test Individual Actors

#### LinkedIn
- [ ] Acessar https://apify.com/apify/linkedin-profile-scraper
- [ ] Clicar "Run" → "Run locally/API"
- [ ] Copiar input JSON:
  ```json
  {
    "startUrls": [{"url": "https://www.linkedin.com/in/paula-valio-pimenta/"}],
    "maxPosts": 5
  }
  ```
- [ ] Executar teste com curl:
  ```bash
  curl -X POST https://api.apify.com/v2/acts/apify~linkedin-profile-scraper/run-sync \
    -H "Authorization: Bearer ${APIFY_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"startUrls":[{"url":"https://www.linkedin.com/in/paula-valio-pimenta/"}],"maxPosts":5}'
  ```
- [ ] ✅ Esperado: JSON com profileData + posts array
- [ ] ❌ Se falhar: verificar URL, ativar cookies/JavaScript no Apify

#### Instagram
- [ ] Acessar https://apify.com/apify/instagram-scraper
- [ ] Executar teste:
  ```bash
  curl -X POST https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync \
    -H "Authorization: Bearer ${APIFY_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"usernames":["paulavaliopimenta"],"maxPosts":5}'
  ```
- [ ] ✅ Esperado: JSON com userInfo + posts array
- [ ] ❌ Se falhar: verificar username (sem @), configurar delay entre requests

#### TikTok
- [ ] Acessar https://apify.com/apify/tiktok-scraper
- [ ] Executar teste:
  ```bash
  curl -X POST https://api.apify.com/v2/acts/apify~tiktok-scraper/run-sync \
    -H "Authorization: Bearer ${APIFY_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"usernames":["paulavaliopimenta"],"maxVideos":5}'
  ```
- [ ] ✅ Esperado: JSON com userStats + videos array
- [ ] ❌ Se falhar: validar TikTok permite scraping, verificar proxy settings

#### YouTube
- [ ] Acessar https://apify.com/apify/youtube-channel-videos
- [ ] Executar teste:
  ```bash
  curl -X POST https://api.apify.com/v2/acts/apify~youtube-channel-videos/run-sync \
    -H "Authorization: Bearer ${APIFY_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"channelUrl":"https://www.youtube.com/@paulavaliopimenta","maxVideos":5}'
  ```
- [ ] ✅ Esperado: JSON com channelInfo + videos array
- [ ] ❌ Se falhar: copiar URL exata do YouTube (@handle deve estar correto)

---

## ✅ Fase 3: N8N Workflow Setup (1h)

### N8N Instance
- [ ] Self-hosted ou cloud (https://n8n.cloud)
- [ ] Fazer login
- [ ] Criar novo workflow: "Paula Social Weekly Sync"

### Add Credentials
- [ ] Settings → Credentials → New credential
- [ ] Adicionar "HTTP Header Auth" para Apify:
  - Name: "apify_auth"
  - Header: "Authorization"
  - Value: `Bearer ${APIFY_TOKEN}`
- [ ] Adicionar "HTTP Bearer Token" para Supabase:
  - Name: "supabase_auth"
  - Token: `${SUPABASE_KEY}`

### Create Nodes (seguir diagrama em PASSO_02b_SETUP_APIFY_N8N.md)

#### Node 1: Schedule Trigger
- [ ] Add node → Schedule
- [ ] Cron: `0 9 * * 1` (Monday 09:00)
- [ ] Timezone: `America/Sao_Paulo`
- [ ] Salvar

#### Nodes 2-5: Parallel Apify HTTP Calls
- [ ] Add 4 HTTP Request nodes (um para cada platform)
- [ ] Configurar cada node conforme especificado em PASSO_02b_SETUP_APIFY_N8N.md
- [ ] Usar credencial "apify_auth"
- [ ] Testar cada node individualmente (clique "Test")
- [ ] ✅ Esperado: 200 status com JSON response

#### Node 6: Merge Results
- [ ] Add node → Merge
- [ ] Strategy: "Array"
- [ ] Conectar inputs dos 4 nodes Apify

#### Node 7: Transform Data
- [ ] Add node → Code
- [ ] Language: JavaScript
- [ ] Copiar código de transformação em PASSO_02b_SETUP_APIFY_N8N.md
- [ ] Testar com dados de mock
- [ ] ✅ Esperado: Array de posts normalizados

#### Node 8: Calculate Engagement
- [ ] Add node → Code
- [ ] Copiar código de cálculo de engagement rate
- [ ] Testar
- [ ] ✅ Esperado: Posts com `engagement_rate` calculado

#### Node 9: Insert Posts to Supabase
- [ ] Add node → HTTP Request
- [ ] URL: `https://${SUPABASE_PROJECT}.supabase.co/rest/v1/paula_social_posts`
- [ ] Method: POST
- [ ] Usar credencial "supabase_auth"
- [ ] Body: `{{ JSON.stringify(this.input) }}`
- [ ] Testar
- [ ] ✅ Esperado: 201 Created ou 200 OK

#### Nodes 10-11: Daily Snapshot
- [ ] Add node → Code (agregar dados por plataforma)
- [ ] Add node → HTTP Request (insert to `paula_social_daily_snapshot`)
- [ ] Testar
- [ ] ✅ Esperado: 201 Created

#### Node 12: Slack Notification (Optional)
- [ ] Add node → Slack
- [ ] Conectar conta Slack
- [ ] Escolher canal: `#paula-social-analytics`
- [ ] Mensagem template (ver PASSO_02b_SETUP_APIFY_N8N.md)

### Workflow Validation
- [ ] Salvar workflow com nome: "Paula Social Weekly Sync"
- [ ] Verificar que todos os nodes estão conectados
- [ ] Clicar "Execute Workflow" para teste manual
- [ ] ✅ Esperado: Todos os nodes completam sem erro
- [ ] ❌ Se falhar: debugar com "View Details" em cada node
- [ ] Verificar dados em Supabase tabelas (devem ter 1-2 posts de teste)

### Schedule Activation
- [ ] Clique no Schedule Trigger node
- [ ] Habilitar toggle "Active"
- [ ] ✅ Esperado: Mensagem "Workflow will run every Monday at 09:00"
- [ ] Confirmar scheduling com screenshot

---

## ✅ Fase 4: Edge Function Deployment (30min)

### Setup Local Development (se using Supabase Edge Functions)
- [ ] Instalar Supabase CLI:
  ```bash
  npm install -g supabase
  ```
- [ ] Fazer login:
  ```bash
  supabase login
  ```
- [ ] Linkar projeto:
  ```bash
  supabase link --project-ref ${SUPABASE_PROJECT}
  ```

### Deploy paula-social-sync Function
- [ ] Copiar arquivo `edge-functions/paula-social-sync.ts`
- [ ] Criar diretório: `supabase/functions/paula-social-sync/`
- [ ] Colocar arquivo em `supabase/functions/paula-social-sync/index.ts`
- [ ] Deploy:
  ```bash
  supabase functions deploy paula-social-sync
  ```
- [ ] ✅ Esperado: "✓ Deployed paula-social-sync to version XXX"
- [ ] Copiar URL do function para `.env` como `PAULA_SOCIAL_SYNC_URL`

### Test Edge Function
- [ ] Obter URL do function do Supabase dashboard
- [ ] Testar com curl:
  ```bash
  curl -X POST ${PAULA_SOCIAL_SYNC_URL} \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{
      "linkedin": {"posts": [], "profileData": {}},
      "instagram": {"posts": [], "userInfo": {}},
      "tiktok": {"videos": [], "userStats": {}},
      "youtube": {"videos": [], "channelInfo": {}}
    }'
  ```
- [ ] ✅ Esperado: 200 com `{"success": true}`

---

## ✅ Fase 5: Data Validation (30min)

### Database Verification
- [ ] Abrir Supabase SQL Editor
- [ ] Executar queries de validação:

#### Check posts table
```sql
SELECT
  platform,
  COUNT(*) as posts_count,
  AVG(engagement_rate) as avg_engagement,
  MAX(engagement_rate) as max_engagement
FROM paula_social_posts
GROUP BY platform
ORDER BY platform;
```
- [ ] ✅ Esperado: 4 rows (um por plataforma) com posts count > 0

#### Check daily snapshot table
```sql
SELECT
  date,
  platform,
  avg_engagement_rate,
  total_reach,
  posts_published
FROM paula_social_daily_snapshot
ORDER BY date DESC, platform
LIMIT 10;
```
- [ ] ✅ Esperado: Rows com data de hoje, metricas calculadas

#### Check engagement rates
```sql
SELECT
  platform,
  COUNT(*) as total,
  COUNT(CASE WHEN engagement_rate = 0 THEN 1 END) as zero_engagement,
  COUNT(CASE WHEN engagement_rate > 100 THEN 1 END) as invalid_engagement
FROM paula_social_posts
GROUP BY platform;
```
- [ ] ✅ Esperado: Nenhum zero_engagement ou invalid_engagement

### Data Quality Report
- [ ] Contar total de posts coletados: `SELECT COUNT(*) FROM paula_social_posts;`
- [ ] Esperado: > 50 posts (pelo menos 10 por plataforma)
- [ ] Verificar média de engagement rate por plataforma está dentro do esperado
- [ ] Validar posted_at timestamps estão nos últimos 90 dias

---

## ✅ Fase 6: Final Checks & Documentation

### Performance Verification
- [ ] Rodar query com índices:
  ```sql
  EXPLAIN ANALYZE
  SELECT * FROM paula_social_posts
  WHERE platform = 'instagram'
  ORDER BY engagement_rate DESC
  LIMIT 10;
  ```
- [ ] ✅ Esperado: "Index Scan" em vez de "Seq Scan"

### Error Handling Verification
- [ ] Simular erro de rate limit em Apify (desabilitar actor temporariamente)
- [ ] Workflow deve fazer retry ou log erro claramente
- [ ] ✅ Esperado: Slack notification com erro e detalhes

### Documentation
- [ ] Atualizar README com credenciais necessárias
- [ ] Documentar troubleshooting para erros comuns
- [ ] Salvar screenshots de:
  - N8N workflow diagram
  - Supabase table preview
  - Sample Slack notification

### Backup & Security
- [ ] Salvar `.env` em local seguro (password manager)
- [ ] NÃO commitar credenciais no Git
- [ ] Rotar Apify token a cada 90 dias
- [ ] Monitorar custos Apify (Free tier: 100 runs/mês)

---

## ✅ Success Criteria

### Workflow Execution
- [x] N8N workflow executa sem erros
- [x] Todos 4 atores Apify rodam em paralelo
- [x] Dados são normalizados corretamente
- [x] Métricas são calculadas (engagement_rate, etc)
- [x] Posts inseridos em Supabase com sucesso
- [x] Daily snapshots criados
- [x] Slack notificação enviada (opcional)

### Data Quality
- [x] Posts têm platform, post_id, metrics válidos
- [x] Engagement rates estão entre 0-100%
- [x] posted_at timestamps estão em ISO format
- [x] hashtags extraídas corretamente
- [x] content_type detectado corretamente

### Schedule & Automation
- [x] N8N workflow está "Active" no schedule
- [x] Cron expression válido: `0 9 * * 1` (Monday 09:00)
- [x] Timezone está correto: America/Sao_Paulo
- [x] Next run timestamp é próxima segunda-feira

### Monitoring
- [x] Logs disponíveis no N8N para audit trail
- [x] Errors capturados e reportados
- [x] Métricas de execução rastreáveis (posts count, duration, etc)

---

## 📋 Troubleshooting Common Issues

| Erro | Causa | Solução |
|------|-------|---------|
| `APIFY_TOKEN invalid` | Token expirado ou incorreto | Gerar novo token em Apify dashboard |
| `Rate limited` | Muitas requisições | Aumentar delay entre runs ou use paid Apify plan |
| `PRIVATE_ACCOUNT` | Conta Instagram privada | Não aplicável para Paula (pública) |
| `Invalid URL` | LinkedIn/YouTube URL inválida | Validar URLs exatas: /in/ para LinkedIn, @handle para YouTube |
| `Supabase insert failed` | Chave inválida ou RLS bloqueando | Verificar key, tabelas existem, RLS policies |
| `N8N timeout` | Workflow demora > 5min | Aumentar timeout em HTTP nodes |
| `Engagement rate = 0` | Reach = 0 ou métricas vazias | Validar dados Apify, alguns posts podem ter 0 reach |

---

## 📝 Sign-Off

- [ ] **Data Collection Specialist:** Todas as fases completadas e validadas
- [ ] **Data Quality:** Engagement rates calculadas corretamente
- [ ] **DevOps:** Workflow agendado e rodando automaticamente
- [ ] **Manager:** Pronto para Passo 02c (primeira coleta 90 dias)

**Data Conclusão:** _____________
**Assinado por:** _____________

---

**Próximo:** Passo 02c - Primeira Execução & Coleta 90 Dias Históricos
