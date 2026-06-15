# ZUP X — Front-end

Front-end (React + Vite + TypeScript) da plataforma ZUP de gestão de
infraestrutura urbana. Consome a API oficial **ProjetoZup** (Node/Express +
PostgreSQL/PostGIS).

## Requisitos

- Node.js 20+
- npm

## Configuração

Crie um `.env` a partir de `.env.example` e ajuste a URL da API:

```
VITE_API_BASE_URL=http://localhost:3000/api
```

> A API ProjetoZup roda por padrão em `http://localhost:3000` com as rotas sob `/api`.

## Scripts

| Script | Ação |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (porta 8080) |
| `npm run build` | Build de produção |
| `npm run preview` | Pré-visualiza o build |
| `npm run lint` | ESLint |

## Estrutura

- `src/lib/` — cliente HTTP e contratos da API (`api.ts`, `*-api.ts`)
- `src/hooks/` — hooks de dados (react-query)
- `src/pages/` — páginas/rotas
- `src/components/` — componentes de UI
- `src/data/mockData.ts` — modelo de domínio (tipos/labels) + config temporária
  de categorias/bairros (a migrar para a API)
