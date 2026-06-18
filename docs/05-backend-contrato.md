# 5. Backend & Contrato de API (visão do front)

> Este repositório é o **frontend**. Esta seção documenta **o contrato que o front consome** do
> backend ProjetoZup (a documentação canônica de API é o **Swagger/OpenAPI** do backend). Para cada
> endpoint listamos método, rota, autenticação e onde o front o usa.

**Fonte da verdade:** <https://github.com/Grogww/ProjetoZup> · **Swagger:** servido pelo backend
(geralmente em `/api-docs` — confirmar no backend).

## 5.1 Cliente HTTP central

Toda chamada passa por `src/lib/api.ts`:
- Usa `import.meta.env.VITE_API_BASE_URL` (nunca URL fixa). Remove barras finais.
- Injeta `Authorization: Bearer <access>` quando `auth !== false`.
- **Refresh automático em 401:** chama `POST /auth/refresh` com o `refresh_token`, repete a
  requisição **uma vez** (`_noRetry`), e limpa tokens se o refresh falhar.
- Suporta **multipart** (upload de mídia) e montagem de query string.
- Erros não-OK viram `ApiError { message, status, data }` (lê `error`/`message` do corpo).

## 5.2 Endpoints consumidos (por domínio)

### Autenticação e usuários (`auth-api.ts`)

| Método | Rota | Auth | Uso no front |
|--------|------|:----:|--------------|
| POST | `/auth/login` | não | Login por **CPF (11 dígitos) + senha** → sessão |
| POST | `/auth/register` | não | Cadastro (`name`, `email`, `cpf`, `password`, `neighborhood_id?`) |
| POST | `/auth/refresh` | não | Renovação de token (interno ao `api.ts`) |
| POST | `/auth/forgot-password` | não | Solicita reset por e-mail |
| POST | `/auth/reset-password` | não | Redefine senha com `token` |
| GET | `/users/me` | sim | Carrega usuário da sessão |
| PATCH | `/users/me` | sim | Atualiza `name`/`email`/`password`/`avatar_url`/`neighborhood_id` |
| GET | `/users` | sim (admin) | Lista usuários |

### Ocorrências (`occurrences-api.ts`)

| Método | Rota | Auth | Uso |
|--------|------|:----:|-----|
| GET | `/occurrences` | não | Lista (filtros: `status`, `category_id`, `subcategory_id`, `neighborhood_id`, `author_id`, `assigned_organization_id`, `limit`, `offset`) |
| GET | `/occurrences/:id` | não | Detalhe |
| POST | `/occurrences` | sim | Cria ocorrência (pode retornar **409** duplicidade) |
| PATCH | `/occurrences/:id` | sim | Edita (`title`/`description`/`address`/`latitude`/`longitude`) |
| DELETE | `/occurrences/:id` | sim | Exclui |
| PATCH | `/occurrences/:id/status` | sim | Muda status (**409** se transição inválida) |
| POST | `/occurrences/:id/media` | sim | Upload multipart (campo `media`) |
| GET | `/occurrences/:id/media` | não | Lista mídias |
| GET | `/occurrences/:id/status-history` | não | Histórico de status |
| POST | `/occurrences/:id/reopen` | sim | Reabre (cria ocorrência encadeada; exige `reason`) |
| GET | `/occurrences/:id/reopens` | não | Lista de reaberturas |
| GET | `/occurrences/nearby` | não | Próximas (`lat`, `lng`, `radius=500`) |

### Avaliações (`evaluations-api.ts`)

| Método | Rota | Auth | Uso |
|--------|------|:----:|-----|
| GET | `/occurrences/:id/evaluations` | sim | Lista de votos |
| POST | `/occurrences/:id/upvote` | sim | Voto a favor |
| POST | `/occurrences/:id/downvote` | sim | Voto contra |
| DELETE | `/occurrences/:id/vote` | sim | Remove voto |

`closed` não aceita voto (409).

### Taxonomia, bairros e órgãos

| Método | Rota | Auth | Uso |
|--------|------|:----:|-----|
| GET | `/categories` | não | Categorias (`categories-api.ts`) |
| GET | `/subcategories` | não | Subcategorias |
| GET | `/neighborhoods` | não | Lista de bairros (sem geometria) |
| GET | `/neighborhoods/:id` | não | Detalhe **com geometria** (`boundary`, `center_point` em GeoJSON) |
| GET | `/neighborhoods/locate` | não | Geofencing: bairro que contém `lat`/`lng` |
| GET | `/organizations` | não | Órgãos (somente leitura) |

### Analytics (`analytics-api.ts`)

| Método | Rota | Auth | Uso |
|--------|------|:----:|-----|
| GET | `/analytics/overview` | não | KPIs globais (totais, taxa, tempos, recorrência, top categorias) |
| GET | `/analytics/by-neighborhood` | não | Indicadores por bairro |
| GET | `/analytics/by-organization` | **sim** | Eficiência por órgão |
| GET | `/analytics/heatmap` | não | Pontos do mapa de calor |
| GET | `/analytics/response-time` | não | Tempos (médias/medianas; `group_by=category\|neighborhood\|month`) |

## 5.3 Autenticação/autorização

- **Atual.** Login real por **CPF + senha** → **JWT** (`access_token` + `refresh_token`), guardados
  em `localStorage`. Refresh automático em 401.
- **Mock auth (confirmado no back).** O back tem um modo mock ativado **só** pela env
  `USE_MOCK_AUTH=true` (`middlewares/auth.js`); por padrão (e sem essa env no `.env.example`) roda
  **JWT real**. Token expira conforme `JWT_EXPIRES_IN` (ex.: `3h`) e refresh conforme
  `JWT_REFRESH_EXPIRES_IN` (`7d`).
- **Transição preparada.** `normalizeSession()` aceita resposta com ou sem envelope `session`;
  `doRefresh()` aceita `access_token` direto ou sob `session`. Isso torna o front tolerante a
  pequenas variações do contrato de auth.
- **Autorização.** O front aplica gating por papel **no cliente** (ver
  [04-perfis-e-permissoes.md](04-perfis-e-permissoes.md)). A autorização **definitiva** é do
  backend.

> No servidor existe o middleware `requireRole`, mas as rotas de ocorrência não o aplicam:
> `occurrenceRoutes.js` usa apenas `auth` em `POST /occurrences`, `PATCH /occurrences/:id`,
> `PATCH /occurrences/:id/status`, `DELETE /occurrences/:id`, `POST /occurrences/:id/reopen` e nas
> mídias. As restrições efetivas ficam na camada de serviço apenas para edição (autor/admin + janela
> de 24h); mudar status, reabrir e excluir não passam por essa verificação. Aplicar `requireRole` a
> essas rotas é um ponto em aberto no backend.

## 5.4 Variáveis de ambiente

| Variável | Onde | Obrigatória | Função |
|----------|------|:-----------:|--------|
| `VITE_API_BASE_URL` | build/dev (`.env`) | ✅ | URL base da API **incluindo `/api`** (ex.: `http://localhost:3000/api`). Lida em `api.ts`; sem ela, o app avisa no console e as requisições falham |
| `BACKEND_URL` | runtime do container | ✅ (Docker) | Origem do backend **sem** `/api` (ex.: `http://host.docker.internal:3000`). O Nginx do container faz proxy de `/api/...` para lá |

## 5.5 Decisões técnicas (ADR leve)

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Formato de coordenadas | **GeoJSON Point `[lng, lat]`** | Padrão GeoJSON/PostGIS; o front mapeia `coordinates[1]→lat`, `coordinates[0]→lng` para evitar a inversão clássica (`occurrences-api.ts:103`) |
| Identidade de taxonomia | **id numérico** na fronteira da API, **slug** na lógica do front | id é o que o backend espera em `POST/PATCH`; slug é chave estável para mapeamentos (ex.: slug→órgão) |
| Origem de mídia relativa | Prefixar com a **origem do backend** | URLs `/uploads/...` viram absolutas via `resolveMediaUrl` usando `new URL(api.baseUrl).origin` |
| Contorno de bairros | **N+1 deliberado** (lista + detalhe por bairro) | A listagem não traz geometria; só o `GET /:id` traz `boundary`. Para ~15 bairros e cache longo é aceitável. Ideal futuro: backend expor `boundary` na listagem ou um `GET /neighborhoods/boundaries` (FeatureCollection) |
| Tiles do mapa | **OSM público** | Gratuito/aberto — **apenas MVP**; trocar antes de produção |
| Estado de servidor | **TanStack Query** | Cache/dedup/refetch declarativos; `staleTime` por domínio |
| Status desconhecido | Normaliza para `pending` | UI resiliente a status fora do enum conhecido |
| Refresh de token | Single-flight + retry único | Evita tempestade de refresh concorrente (`refreshing` em `api.ts`) |

## 5.6 Estrutura de pastas do front (camadas)

```
src/
├── lib/        # camada de integração com a API (uma responsabilidade por arquivo)
│   ├── api.ts              # cliente HTTP central (token, refresh, multipart, erros)
│   ├── auth-api.ts         # auth + usuários + mapRoles
│   ├── occurrences-api.ts  # ocorrências (GeoJSON, status, mídia, reopen, nearby)
│   ├── categories-api.ts   # categorias/subcategorias
│   ├── organizations-api.ts# órgãos (read-only)
│   ├── neighborhoods-api.ts# bairros + geofencing/boundaries
│   ├── evaluations-api.ts  # votos (up/down)
│   ├── analytics-api.ts    # /analytics/*
│   └── validators.ts       # CPF/CEP/telefone (validação no cliente)
├── hooks/      # adaptam o contrato ao shape estável da UI (react-query)
├── data/       # modelo de domínio + config fixa (município, órgãos, FAQ)
├── components/ # UI (shadcn/ui), mapa, modais, cards, suporte
└── pages/      # telas/rotas
```
