# 2. Requisitos Funcionais e Não Funcionais

> Requisitos com identificadores para rastreabilidade. A coluna **"Implementado em"** liga cada
> requisito ao módulo/endpoint do **front** que o realiza. Itens que dependem de servidor estão
> marcados com `> ⚠️ A confirmar:`.

## 2.1 Requisitos Funcionais (RF)

| ID | Requisito | Ator | Critério de aceitação | Implementado em (front) |
|----|-----------|------|-----------------------|--------------------------|
| RF-01 | Cadastro de usuário | Visitante | Informa nome, e-mail, CPF (válido) e senha; CPF/bairro normalizados; conta criada | `Register.tsx`, `registerUser` (`auth-api.ts`) → `POST /auth/register` |
| RF-02 | Autenticação por CPF + senha | Usuário | Login com CPF válido + senha retorna sessão (access/refresh) e carrega `users/me` | `Login.tsx`, `loginWithCpf` → `POST /auth/login`; `useAuth` |
| RF-03 | Recuperação de senha | Usuário | Solicita reset por e-mail; redefine com token | `ForgotPassword.tsx`, `forgotPassword`/`resetPassword` |
| RF-04 | Onboarding | Usuário | Primeiro acesso exibe orientação de uso | `OnboardingModal.tsx` |
| RF-05 | Registro de ocorrência georreferenciada | Cidadão | Marca ponto no mapa, escolhe categoria/subcategoria, bairro detectado, ≥1 foto, título/descrição mínimos; cria ocorrência | `CreateReportModal.tsx`, `createOccurrence` → `POST /occurrences` |
| RF-06 | Anexo de mídia | Cidadão | Envia 1–5 fotos; 1ª é principal; upload multipart | `uploadOccurrenceMedia` → `POST /occurrences/:id/media` |
| RF-07 | Pré-visualização de ocorrências próximas | Cidadão | No registro, vê ocorrências num raio de 500 m | `listNearbyOccurrences` → `GET /occurrences/nearby` |
| RF-08 | Bloqueio de duplicidade | Sistema | Criação em local muito próximo retorna 409 e é comunicada ao usuário | `CreateReportModal.tsx:159` (trata 409) |
| RF-09 | Detecção de bairro por coordenada (geofencing) | Sistema | Ponto no mapa resolve o bairro automaticamente | `locateNeighborhood` → `GET /neighborhoods/locate` |
| RF-10 | Edição/exclusão da própria ocorrência | Cidadão (autor) | Pode editar/excluir a própria ocorrência (janela informada de 24h) | `updateOccurrence`/`deleteOccurrence` |
| RF-11 | Validação/avaliação comunitária | Cidadão | Vota a favor/contra; remove voto; ocorrência `closed` não aceita voto | `evaluations-api.ts` (`upvote`/`downvote`/`vote`) |
| RF-12 | Acompanhamento de status | Cidadão | Vê status atual e histórico de mudanças | `ReportDetailModal.tsx`, `listStatusHistory` → `GET /occurrences/:id/status-history` |
| RF-13 | Transição de status | Órgão/Admin | Altera status apenas para transições válidas; 409 em inválida | `StatusControl.tsx`, `updateOccurrenceStatus` → `PATCH /occurrences/:id/status` |
| RF-14 | Reabertura/reincidência | Órgão/Admin | Reabre ocorrência terminal com motivo; cria ocorrência encadeada | `reopenOccurrence` → `POST /occurrences/:id/reopen` |
| RF-15 | Mapa interativo com filtros | Visitante | Mapa com ocorrências, legenda por status, contorno de bairros; filtros por bairro/categoria/status | `MapPage.tsx`, `MapView.tsx`, `useNeighborhoodBoundaries` |
| RF-16 | Mapa de calor | Visitante | Camada de heatmap das ocorrências | `Dashboard.tsx` (`leaflet.heat`), `getAnalyticsHeatmap` |
| RF-17 | Visão "Minha Cidade" (por bairro) | Visitante | Indicadores e ocorrências do município/bairro | `Dashboard.tsx`, `useCityOverview`, `useNeighborhoodStats` |
| RF-18 | Painel do cidadão | Cidadão | Lista minhas ocorrências e atividade | `CitizenPanel.tsx`, `useMyOccurrences` |
| RF-19 | Painel de gestão pública | Órgão/Admin | Triagem, mudança de status, órgão atribuído | `GestaoPanel.tsx`, `InstitutionalPanel.tsx` |
| RF-20 | Dashboards analíticos | Órgão/Admin/Visitante | KPIs reais: total, taxa de resolução, tempos médios, recorrência, top categorias | `useAnalyticsOverview` → `GET /analytics/overview` |
| RF-21 | Estatística por bairro | Gestão | Pendências/indicadores por bairro | `getAnalyticsByNeighborhood` → `GET /analytics/by-neighborhood` |
| RF-22 | Estatística por órgão | Gestão (auth) | Eficiência por órgão (backlog, taxa, tempos, reaberturas) | `getAnalyticsByOrganization` → `GET /analytics/by-organization` |
| RF-23 | Tempo médio de resposta/resolução | Gestão | Médias e medianas, série mensal | `getAnalyticsResponseTime` → `GET /analytics/response-time` |
| RF-24 | Suporte / FAQ | Visitante | FAQ navegável e formulário de contato | `Support.tsx`, `support/*`, `useSupportContact` |
| RF-25 | Gestão de usuários (admin) | Admin | Lista usuários do sistema | `AdminPanel.tsx`, `listUsers` → `GET /users` |
| RF-26 | Taxonomia viva (categorias/bairros/órgãos) | Sistema | Categorias, subcategorias, bairros e órgãos vêm da API (não hardcoded) | `useTaxonomy.ts` |

> ✅ **Confirmado no back (RF-11/RF-13/RF-14):** nenhuma dessas rotas usa `requireRole` — só `auth`.
> `PATCH /occurrences/:id/status`, `POST /occurrences/:id/reopen` e os votos
> (`upvote`/`downvote`/`vote`) ficam abertos a **qualquer autenticado**. O gating do front é
> cosmético; **a restrição por papel precisa ser adicionada no backend** (ver
> [01-regras-de-negocio.md](01-regras-de-negocio.md), RN-05/RN-07). Edição/exclusão: a **edição**
> exige autor/admin + janela de 24h; a **exclusão** hoje **não checa autor** (lacuna do back).

> ✅ **Confirmado no back (Notificações):** **não há módulo de notificações no backend** (nenhum
> endpoint/serviço). O requisito está **pendente dos dois lados** — é backlog do back antes de o
> front poder consumi-lo.

## 2.2 Requisitos Não Funcionais (RNF)

| ID | Categoria | Requisito | Como é atendido (front) |
|----|-----------|-----------|--------------------------|
| RNF-01 | Desempenho | Consultas geoespaciais eficientes | Geofencing/nearby/heatmap delegados ao **PostGIS** no backend; front só consome. Cache de servidor-state com **TanStack Query** (`staleTime` de 30s–1h) evita refetch desnecessário |
| RNF-02 | Desempenho | Carga única da taxonomia | Categorias/subcategorias/bairros/órgãos com `staleTime` de 1h em `useTaxonomy` |
| RNF-03 | Segurança | Autenticação por token | **JWT Bearer** injetado em toda chamada autenticada; **refresh automático** em 401 (`api.ts`) |
| RNF-04 | Segurança | Proteção de rotas internas | `ProtectedRoute` redireciona não autenticados e não institucionais |
| RNF-05 | Segurança | Antifraude/duplicidade | Bloqueio por raio (409) e pré-visualização de próximos no registro |
| RNF-06 | Integridade | Consistência geográfica | Localização trafega como **GeoJSON Point `[lng, lat]`**; mapeamento cuidadoso `coordinates[1]=lat`, `coordinates[0]=lng` (`occurrences-api.ts`) |
| RNF-07 | Integridade | Robustez do mapeamento de status | Status desconhecido normaliza para `pending` (`normalizeStatus`) — UI nunca quebra |
| RNF-08 | Usabilidade | Registro guiado | Formulário em 4 passos (Local → Fotos → Detalhes → Revisão) com validação por passo |
| RNF-09 | Usabilidade | Responsividade e acessibilidade | **shadcn/ui + Radix**, `aria-*`, tema claro/escuro, `useTheme` |
| RNF-10 | Usabilidade | SEO básico | `react-helmet-async` (`Seo.tsx`) |
| RNF-11 | Portabilidade/custo | Ferramentas abertas | **OpenStreetMap** (tiles), Leaflet, React/Vite — sem custo de licença |
| RNF-12 | Portabilidade | Configuração por ambiente | `VITE_API_BASE_URL` (nunca URL fixa); container desacoplado via Nginx + `BACKEND_URL` |
| RNF-13 | Manutenibilidade | Camada de integração isolada | `src/lib/*-api.ts` por domínio; hooks (`src/hooks/`) estabilizam o shape para a UI |
| RNF-14 | Manutenibilidade | Documentação de API | Contrato alinhado ao **OpenAPI/Swagger** do backend (referência da fonte da verdade) |
| RNF-15 | Confiabilidade | Tolerância a falhas de UI | `ErrorBoundary` global; falha de upload não perde a ocorrência |

> ⚠️ A confirmar (RNF-11): os tiles usam o **servidor público do OSM**, aceitável **apenas para o
> MVP**. A política de uso do OSM não permite tráfego de produção — **trocar o provedor de tiles
> antes de produção** (`OSM_URL` em `MapView.tsx:85` e a URL em `Dashboard.tsx:65`).
