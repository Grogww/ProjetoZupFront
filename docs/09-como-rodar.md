# 9. Como rodar o projeto

> Resumo operacional do **frontend**. A versão canônica/expandida (com Docker) está no
> [`../README.md`](../README.md). O **backend ProjetoZup** precisa estar rodando para a aplicação
> funcionar de ponta a ponta.

## 9.1 Pré-requisitos

- **Node.js 20+** e **npm**.
- **Backend ProjetoZup** acessível (por padrão `http://localhost:3000`, rotas sob `/api`) —
  <https://github.com/Grogww/ProjetoZup>. O backend exige **PostgreSQL + PostGIS** (ver o README do
  backend para versões e seed).

## 9.2 Configuração de ambiente

Copie o exemplo e ajuste:

```bash
cp .env.example .env
```

```env
# URL base da API Node/Express (inclua o /api)
VITE_API_BASE_URL=http://localhost:3000/api
```

> Toda chamada HTTP usa `VITE_API_BASE_URL` — nunca uma URL fixa. Sem a variável, o app avisa no
> console e as requisições falham.

## 9.3 Instalação e execução (dev)

```bash
npm install
npm run dev
```

Aplicação em **http://localhost:8080**.

### Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Vite), porta `8080` |
| `npm run build` | Build de produção |
| `npm run build:dev` | Build em modo desenvolvimento |
| `npm run preview` | Pré-visualiza o build |
| `npm run lint` | Análise estática (ESLint) |

## 9.4 Docker (deploy desacoplado)

A imagem é genérica: o bundle chama `/api` (relativo) e o **Nginx** do container faz **proxy
reverso** para o backend definido em runtime por `BACKEND_URL` (sem CORS; com fallback de SPA).

```bash
# recomendado
docker compose up --build           # front em http://localhost:8080

# ou só docker
docker build -t zup-frontend .
docker run -p 8080:80 -e BACKEND_URL=http://host.docker.internal:3000 zup-frontend
```

| Variável (container) | Padrão | Descrição |
|----------------------|--------|-----------|
| `BACKEND_URL` | `http://host.docker.internal:3000` | Origem do backend **sem** `/api`. O Nginx repassa `/api/...` para lá |

Arquivos: [`../Dockerfile`](../Dockerfile), [`../nginx.conf`](../nginx.conf),
[`../docker-compose.yml`](../docker-compose.yml).

## 9.5 Documentação Swagger / OpenAPI

A documentação interativa de API é servida pelo **backend** (não pelo front). Com o backend
rodando, acesse o Swagger do ProjetoZup.

> ⚠️ A confirmar: a rota exata do Swagger no backend (comumente `http://localhost:3000/api-docs`).
> Verificar no repositório do backend.

## 9.6 Banco de dados / seed

O front **não** possui banco nem migrations. A criação do schema (PostGIS), as migrations e o
**seed** (bairros de Videira com geometria, categorias, órgãos) são executados no **backend**.
Siga as instruções do repositório ProjetoZup. Sem bairros com geometria carregados, o geofencing
(`/neighborhoods/locate`) e o contorno do mapa ficam vazios.
