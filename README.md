# ZUP X — Zeladoria Urbana Participativa

Frontend da plataforma **ZUP (Zeladoria Urbana Participativa)** de Videira/SC. É uma aplicação web onde cidadãos registram problemas urbanos no mapa (iluminação, buracos, vazamentos, vandalismo etc.), acompanham a resolução e a gestão pública trata as ocorrências com transparência.

Este repositório contém **apenas o frontend** (React + Vite + TypeScript). Ele consome a API oficial **ProjetoZup** (Node/Express + PostgreSQL/PostGIS):

> 🔗 **Backend (fonte da verdade):** https://github.com/Grogww/ProjetoZup

O front foi adequado para falar com o contrato real dessa API (status, taxonomia, órgãos, avaliações, analytics e geocoding via bairros). Sempre que houver divergência de contrato, **o backend é a referência**.

---

## 📚 Documentação (para avaliação)

A documentação completa do projeto — **regras de negócio, requisitos, plano de projeto, perfis e
permissões, contrato de API, modelo de dados e diagramas** — está organizada na pasta
**[`docs/`](docs/README.md)**.

> 👉 **Comece pelo índice: [`docs/README.md`](docs/README.md).**

| Documento | Conteúdo |
| --- | --- |
| [1. Regras de Negócio](docs/01-regras-de-negocio.md) | Geofencing, duplicidade, validação comunitária, máquina de estados, reincidência |
| [2. Requisitos (RF/RNF)](docs/02-requisitos.md) | Funcionais e não funcionais, com rastreabilidade ao código |
| [3. Plano de Projeto](docs/03-plano-de-projeto.md) | Escopo, cronograma, marcos, estado atual e roadmap |
| [4. Perfis e Permissões](docs/04-perfis-e-permissoes.md) | Papéis e matriz Perfil × Ação |
| [5. Backend & Contrato de API](docs/05-backend-contrato.md) | Endpoints consumidos, auth, variáveis e decisões técnicas |
| [6. Técnica do Frontend](docs/06-frontend.md) | Componentes, rotas, estado, mapa e identidade visual |
| [7. Modelo de Dados](docs/07-modelo-de-dados.md) | ER do contrato e decisões geoespaciais |
| [8. Diagramas](docs/08-diagramas.md) | Casos de uso, ER, estados, sequência e arquitetura |
| [9. Como rodar](docs/09-como-rodar.md) | Pré-requisitos, `.env`, Docker e Swagger |

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

## 🐳 Docker

O frontend pode rodar em container de forma **totalmente desacoplada do backend**. A imagem é genérica: o bundle chama `/api` (caminho relativo) e um **Nginx** dentro do container faz **proxy reverso** dessas chamadas para o backend real. Vantagens:

- A **mesma imagem** roda em qualquer ambiente — o endereço do back é definido em runtime pela variável `BACKEND_URL`, sem rebuildar.
- **Sem CORS**, pois para o navegador front e API ficam na mesma origem.
- Servir estático com Nginx resolve o **fallback de SPA** (recarregar `/mapa`, `/gestao` etc. não dá 404).

### Subir com docker compose (recomendado)

```bash
docker compose up --build
```
Front em **http://localhost:8080**. Ajuste o backend no `docker-compose.yml` (variável `BACKEND_URL`):

```yaml
environment:
  BACKEND_URL: http://host.docker.internal:3000   # back rodando na máquina host
```

### Subir só com docker

```bash
docker build -t zup-frontend .
docker run -p 8080:80 -e BACKEND_URL=http://host.docker.internal:3000 zup-frontend
```

| Variável (container) | Padrão | Descrição |
| --- | --- | --- |
| `BACKEND_URL` | `http://host.docker.internal:3000` | Origem do backend ProjetoZup (**sem** o `/api` no final). O Nginx repassa `/api/...` para lá. |

> **Importante:** `BACKEND_URL` aponta **sem** o sufixo `/api` (ex.: `http://host.docker.internal:3000`). O Nginx preserva o caminho `/api/...` da requisição ao repassar. Use `host.docker.internal` quando o back roda na sua máquina; use o nome do serviço (ex.: `http://back:3000`) se ambos estiverem no mesmo compose.

**Arquivos relacionados:** [`Dockerfile`](Dockerfile) (build multi-stage Node 20 → Nginx), [`nginx.conf`](nginx.conf) (proxy `/api` + fallback SPA), [`docker-compose.yml`](docker-compose.yml) e [`.dockerignore`](.dockerignore).

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
