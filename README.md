# ZUP X — Zeladoria Urbana Participativa

Frontend da plataforma **ZUP (Zeladoria Urbana Participativa)** de Videira/SC. É uma aplicação web onde cidadãos registram problemas urbanos no mapa (iluminação, buracos, vazamentos, vandalismo etc.), acompanham a resolução e a gestão pública trata as ocorrências com transparência.

Este repositório contém **apenas o frontend** (React + Vite + TypeScript). Ele consome a API oficial **ProjetoZup** (Node/Express + PostgreSQL/PostGIS):

> 🔗 **Backend (fonte da verdade):** https://github.com/Grogww/ProjetoZup

O front foi adequado para falar com o contrato real dessa API (status, taxonomia, órgãos, avaliações, analytics e geocoding via bairros). Sempre que houver divergência de contrato, **o backend é a referência**.

---

## ✨ Funcionalidades

- **Mapa interativo** (Leaflet + react-leaflet) com as ocorrências georreferenciadas, mapa de calor (`leaflet.heat`), legenda por status e contorno real dos bairros via GeoJSON.
- **Registro de ocorrências** com foto (upload multipart), categoria/subcategoria, endereço e localização. O geocoding de bairro é resolvido pelo endpoint `/neighborhoods/locate`.
- **Acompanhamento de status** com a máquina de estados real (9 status), histórico de mudanças, reabertura e controle de transições inválidas (HTTP 409).
- **Painéis por perfil:**
  - **Cidadão** — minhas ocorrências, avaliações e validações.
  - **Institucional / Gestão** — triagem, mudança de status, atribuição de órgão e estatísticas.
  - **Admin** — visão geral.
- **Autenticação** por CPF + senha, com **Bearer token** e **refresh automático** em respostas `401`.
- **Estatísticas e analytics** (Recharts) consumindo os endpoints de analytics do back.
- **Suporte/FAQ** com formulário de contato e FAB de suporte.
- **Tema claro/escuro**, SEO básico (`react-helmet-async`) e componentes acessíveis (shadcn/ui + Radix).

## 🧱 Stack

- **React 18** + **TypeScript** + **Vite 5** (`@vitejs/plugin-react-swc`)
- **React Router** para rotas e **TanStack Query** para cache/estado de servidor
- **Tailwind CSS** + **shadcn/ui** (Radix UI) + **lucide-react** + **framer-motion**
- **Leaflet / react-leaflet / leaflet.heat** para o mapa
- **react-hook-form** + **zod** para formulários e validação
- **Recharts** para gráficos

---

## 🚀 Como rodar localmente

### Pré-requisitos
- **Node.js 20+** e npm
- O **backend ProjetoZup** rodando (por padrão em `http://localhost:3000`, rotas sob `/api`) — veja https://github.com/Grogww/ProjetoZup

### Passos

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure a variável de ambiente.** Copie o exemplo e ajuste se necessário:
   ```bash
   cp .env.example .env
   ```
   O arquivo `.env` precisa apontar para a API do backend:
   ```env
   # URL base da API Node/Express (inclua o /api)
   VITE_API_BASE_URL=http://localhost:3000/api
   ```
   > ⚠️ Toda chamada HTTP usa `VITE_API_BASE_URL` — nunca uma URL fixa. Se a variável não estiver definida, o app avisa no console e as requisições falham.

3. **Suba o app em modo desenvolvimento:**
   ```bash
   npm run dev
   ```
   A aplicação fica disponível em **http://localhost:8080**.

### Scripts disponíveis

| Script | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (Vite) na porta `8080` |
| `npm run build` | Build de produção |
| `npm run build:dev` | Build em modo desenvolvimento |
| `npm run preview` | Pré-visualiza o build de produção |
| `npm run lint` | Análise estática com ESLint |

---

## ⚙️ Configuração

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `VITE_API_BASE_URL` | ✅ | URL base da API do backend, **incluindo o sufixo `/api`** (ex.: `http://localhost:3000/api`) |

O cliente HTTP central fica em [`src/lib/api.ts`](src/lib/api.ts) e cuida de:
- injeção do **Bearer token** (`Authorization`);
- **refresh automático** do token em respostas `401` (via `/auth/refresh`);
- **upload multipart** para mídia;
- montagem de query string e tratamento padronizado de erros (`ApiError`).

---

## 🗺️ Rotas principais

| Rota | Página | Acesso |
| --- | --- | --- |
| `/` | Início | Público |
| `/mapa` | Mapa interativo | Público |
| `/dashboard`, `/minha-cidade` | Painel da cidade | Público |
| `/login`, `/cadastro`, `/recuperar-senha` | Autenticação | Público |
| `/painel` | Painel do cidadão | Autenticado |
| `/institucional/:type`, `/admin` | Painéis internos | Institucional |
| `/gestao`, `/gestao/painel`, `/gestao/estatisticas` | Gestão pública | Institucional |
| `/suporte` | Suporte / FAQ | Público |

---

## 📁 Estrutura do projeto

```
src/
├── components/      # UI (shadcn/ui), mapa, cards, modais, suporte
├── data/            # configuração de órgãos, taxonomia, FAQ, modelo de domínio
├── hooks/           # useAuth, useTaxonomy, useOccurrences, useStats, etc.
├── lib/             # cliente da API + módulos por domínio
│   ├── api.ts                # cliente HTTP central (token, refresh, multipart)
│   ├── auth-api.ts           # login/cadastro/usuário
│   ├── occurrences-api.ts    # ocorrências (GeoJSON, status, mídia, histórico)
│   ├── categories-api.ts     # categorias/subcategorias
│   ├── organizations-api.ts  # órgãos responsáveis
│   ├── neighborhoods-api.ts  # bairros e geocoding (/neighborhoods/locate)
│   ├── evaluations-api.ts    # avaliações
│   └── analytics-api.ts      # estatísticas
└── pages/           # rotas (Index, MapPage, Dashboard, painéis, gestão…)
```

## 🔌 Integração com o backend

- **Órgãos responsáveis:** Prefeitura, Água e Saneamento (VISAN) e Energia/Iluminação (CELESC).
- **Localização** trafega como **GeoJSON Point** (`coordinates = [lng, lat]`).
- **Mídia** é enviada via multipart; URLs relativas são prefixadas com a origem do backend.
- **Geocoding de bairro** usa `/neighborhoods/locate`; o contorno dos bairros vem em GeoJSON real.
- **Mapeamento de perfis:** o back usa `citizen | agent | admin`; o front mapeia para `cidadao | prefeitura | … | admin`.

> Os tiles do mapa usam o servidor público do OpenStreetMap apenas para o MVP — **troque por um provedor próprio antes de produção**.
