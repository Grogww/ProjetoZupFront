# 1. Regras de Negócio

> **Como ler.** Cada regra traz um identificador (`RN-xx`), descrição, gatilho, comportamento e a
> referência ao código que a implementa no front. As regras são definidas pela API ProjetoZup, que
> esta aplicação consome; o texto descreve como a interface as reflete e aplica. Quando o
> comportamento do servidor difere do que a UI sugere — ou quando uma regra ainda não existe no
> backend — isso é apontado de forma objetiva ao final da regra correspondente.

## Índice de regras

| ID | Regra | Onde vive (front) |
|----|-------|-------------------|
| RN-01 | Escopo municipal fixo (Videira/SC) | `src/data/mockData.ts` |
| RN-02 | Geofencing — bairro pela coordenada | `src/lib/neighborhoods-api.ts` |
| RN-03 | Prevenção de duplicidade por raio | `src/lib/occurrences-api.ts`, `CreateReportModal.tsx` |
| RN-04 | Pré-visualização de ocorrências próximas | `CreateReportModal.tsx` |
| RN-05 | Máquina de estados da ocorrência (9 status) | `src/data/mockData.ts` |
| RN-06 | Transições restritas + 409 | `StatusControl.tsx`, `useOccurrences.ts` |
| RN-07 | Validação comunitária (estados + votos) | `src/lib/evaluations-api.ts` |
| RN-08 | Reincidência e reabertura | `src/lib/occurrences-api.ts`, `StatusControl.tsx` |
| RN-09 | Votação/priorização | `src/lib/evaluations-api.ts` |
| RN-10 | Janela de edição/exclusão pós-registro | `CreateReportModal.tsx` (texto da UI) |
| RN-11 | Mídia obrigatória no registro | `CreateReportModal.tsx` |
| RN-12 | Órgão responsável (atribuição real + derivação legada) | `mockData.ts`, `useTaxonomy.ts` |
| RN-13 | Identidade do cidadão / anonimato | `auth-api.ts`, `CreateReportModal.tsx` |
| RN-14 | Integridade referencial de bairros | contrato (`neighborhood_id`) |
| RN-15 | Validação de CPF na entrada | `src/lib/validators.ts` |

---

## RN-01 — Escopo municipal fixo (Videira/SC)

- **Descrição.** Todo o sistema opera dentro do município de **Videira/SC**. O município é escopo
  fixo do projeto, **não** um dado de banco.
- **Comportamento.** O mapa centraliza em `[-27.0078, -51.1519]` (zoom 14) e os textos da UI
  ("Registrar Ocorrência em Videira/SC") reforçam o escopo.
- **Código.** `currentMunicipality` em `src/data/mockData.ts:151`.

## RN-02 — Geofencing: bairro resolvido pela coordenada

- **Descrição.** Uma ocorrência é amarrada a um **bairro de Videira**. O front não usa
  autocomplete de endereço: o usuário marca o ponto no mapa e o **bairro é descoberto pela
  coordenada**.
- **Gatilho.** Clique no mapa em `CreateReportModal` → `handleMapClick` → `detectNeighborhood`.
- **Comportamento.** Chamada `GET /api/neighborhoods/locate?lat=&lng=`. O backend resolve via
  PostGIS (`ST_Contains`) qual polígono de bairro contém o ponto. Retorno `null` (404 ou rede)
  significa "ponto fora dos bairros" — o campo de bairro fica vazio para o usuário corrigir.
- **Código.** `locateNeighborhood()` em `src/lib/neighborhoods-api.ts:73`.
- **Contorno dos bairros.** O mapa desenha o polígono real de cada bairro (GeoJSON `boundary`),
  obtido em `GET /api/neighborhoods/:id` (a listagem não traz geometria).
  Ver `listNeighborhoodBoundaries()` em `neighborhoods-api.ts:53`.

> **No servidor** (`occurrencesService.createOccurrence`, `neighborhoodsModel.findByPoint`) não há
> bloqueio rígido de pontos fora do município. Quando o bairro não é informado, ele é derivado por
> `ST_Contains` (point-in-polygon, SRID 4326); se o ponto não cai em nenhum bairro, `neighborhood_id`
> fica nulo e a ocorrência é criada mesmo assim. O geofencing serve para resolver o bairro, não para
> recusar a ocorrência.

## RN-03 — Prevenção de duplicidade por raio

- **Descrição.** Antes de aceitar uma nova ocorrência, o sistema impede **duplicatas próximas**.
- **Comportamento (front).** Na criação (`POST /api/occurrences`), o backend pode responder
  **HTTP 409** com `details: { duplicate_id, distance_m }`. O front trata esse 409 mostrando ao
  usuário que já existe ocorrência aberta semelhante e a que distância (`#id` e `~Xm`).
- **Raios no front.** `DUPLICATE_RADIUS_METERS = 7` e `NEARBY_RADIUS_METERS = 500`
  (`src/data/mockData.ts:123-124`).
- **Código.** Tratamento do 409 em `CreateReportModal.tsx:159`.

> **No servidor** (`occurrencesService.js:12,110-125`), o raio de bloqueio é de 500 m
> (`ANTIDUPLICITY_RADIUS_M`). O 409 `OCCURRENCE_DUPLICATE` é emitido quando existe outra ocorrência
> dentro de 500 m (`ST_DWithin` sobre `::geography`), na mesma `category_id` e com status ainda não
> finalizado (diferente de `resolved`/`closed`). O raio de aviso da pré-visualização (RN-04) é o
> mesmo.
>
> O texto exibido em `CreateReportModal.tsx:280` usa `DUPLICATE_RADIUS_METERS` (7 m), valor que não
> corresponde ao critério aplicado pelo servidor (500 m, mesma categoria, ocorrência aberta). Trata-se
> de uma divergência conhecida entre a mensagem da interface e a regra efetiva.

## RN-04 — Pré-visualização de ocorrências próximas

- **Descrição.** Ao marcar o ponto, o usuário vê quantas ocorrências já existem por perto, para
  evitar registro duplicado consciente.
- **Comportamento.** `GET /api/occurrences/nearby?lat=&lng=&radius=500` retorna ocorrências no raio
  (ordenadas por distância), renderizadas no mini-mapa do passo 1 com um aviso
  ("N ocorrência(s) num raio de 500m").
- **Código.** `listNearbyOccurrences()` em `occurrences-api.ts:256`; uso em `CreateReportModal.tsx:55`.

## RN-05 — Máquina de estados da ocorrência (9 status)

- **Descrição.** A ocorrência percorre um ciclo de vida com **9 estados** que distinguem a
  **validação da comunidade** do **tratamento formal pelo órgão**.
- **Estados** (`ReportStatus`, `statusLabels` em `mockData.ts`):

  | Status (API) | Rótulo (UI) | Natureza |
  |--------------|-------------|----------|
  | `pending` | Pendente | inicial |
  | `awaiting_validation` | Aguardando Validação | comunidade |
  | `validated` | Validada pela Comunidade | comunidade |
  | `in_analysis` | Em Análise | órgão |
  | `in_progress` | Em Execução | órgão |
  | `resolved` | Resolvido pelo Órgão | órgão |
  | `resolution_validated` | Resolução Validada | comunidade |
  | `resolution_rejected` | Resolução Rejeitada | comunidade |
  | `closed` | Encerrada | terminal |

- **Transições permitidas** (`STATUS_TRANSITIONS` em `mockData.ts:228` — espelho exato do
  `occurrencesService.js` do backend):

  | De | Para |
  |----|------|
  | `pending` | `awaiting_validation`, `closed` |
  | `awaiting_validation` | `validated`, `closed` |
  | `validated` | `in_analysis`, `closed` |
  | `in_analysis` | `in_progress`, `closed` |
  | `in_progress` | `resolved`, `closed` |
  | `resolved` | `resolution_validated`, `resolution_rejected` |
  | `resolution_rejected` | `in_progress`, `closed` |
  | `resolution_validated` | `closed` |
  | `closed` | — (terminal) |

### Diagrama de estados

```mermaid
stateDiagram-v2
    [*] --> pending
    pending --> awaiting_validation
    pending --> closed
    awaiting_validation --> validated
    awaiting_validation --> closed
    validated --> in_analysis
    validated --> closed
    in_analysis --> in_progress
    in_analysis --> closed
    in_progress --> resolved
    in_progress --> closed
    resolved --> resolution_validated
    resolved --> resolution_rejected
    resolution_rejected --> in_progress
    resolution_rejected --> closed
    resolution_validated --> closed
    closed --> [*]

    note right of awaiting_validation
        Transições da COMUNIDADE
        (validação / votos)
    end note
    note right of in_analysis
        Transições do ÓRGÃO / gestão
        (triagem e execução)
    end note
    note right of closed
        Terminal. Reabertura cria uma
        NOVA ocorrência encadeada
        (POST /occurrences/:id/reopen)
    end note
```

- **Quem dispara.** Pela lógica do front, os estados de **validação/resolução validada/rejeitada**
  pertencem à comunidade e os estados **em análise / em execução / resolvido** ao órgão. A UI de
  mudança de status (`StatusControl`) só é exibida para perfis institucionais.

> **No servidor** (`occurrenceRoutes.js:13`, `occurrencesController.updateStatus`,
> `occurrencesService.STATUS_TRANSITIONS`), a tabela de transições espelha a do front. A rota
> `PATCH /occurrences/:id/status` exige apenas autenticação (`auth`), sem `requireRole`: qualquer
> usuário autenticado pode mudar o status desde que a transição seja válida (caso contrário, 409). A
> restrição por perfil no front é, portanto, apenas visual; uma restrição efetiva por papel
> (`agent`/`admin`) depende do backend. O servidor também define automaticamente `resolved_at` e
> `closed_at` ao entrar nesses estados (`occurrencesModel.updateStatus`).

## RN-06 — Transições restritas e resposta 409

- **Descrição.** Só são oferecidas as transições válidas a partir do estado atual; transição
  inválida é rejeitada.
- **Comportamento.** `nextStatuses(status)` alimenta o menu de "Avançar para". Se ainda assim uma
  transição inválida chegar ao backend, ele responde **409** com `details: { from, to, allowed }`,
  e o front mostra um toast "Transição não permitida".
- **Código.** `StatusControl.tsx:84` (tratamento do 409); `useUpdateOccurrenceStatus` em
  `useOccurrences.ts:66`.

## RN-07 — Validação comunitária

- **Descrição.** Uma ocorrência passa por **confirmação da comunidade** (estados
  `awaiting_validation` → `validated`) antes de avançar ao tratamento do órgão. O engajamento é
  registrado por **votos** (avaliações).
- **Comportamento (front).** Avaliações via `evaluations-api`:
  - `POST /occurrences/:id/upvote` — voto a favor (confirma);
  - `POST /occurrences/:id/downvote` — voto contra;
  - `DELETE /occurrences/:id/vote` — remove o voto;
  - `GET /occurrences/:id/evaluations` — lista de votos.
  - Ocorrências `closed` **não** aceitam voto (409).
- **Código.** `src/lib/evaluations-api.ts`.

> **No servidor** (`evaluationsService.js`, `occurrenceRoutes.js`), a validação comunitária com
> elegibilidade e limiar de votos que avança o estado automaticamente ainda não existe. Hoje:
> - votar é livre para qualquer usuário autenticado (`POST /upvote`/`/downvote`), barrado apenas em
>   ocorrência `closed` (409); não há checagem de bairro ou elegibilidade. O voto recalcula
>   `upvote_count`/`downvote_count`/`score`, mas não altera o status.
> - `awaiting_validation → validated` é uma transição manual de status (mesma rota `PATCH /status`),
>   não disparada por contagem de votos.
> - a tabela `neighborhood_adjacency` existe no schema (PK `(neighborhood_id, neighbor_id)`, CHECK de
>   não-reflexividade, FKs `ON DELETE CASCADE`), mas nenhum código a utiliza — é a base reservada
>   para a futura seleção de validadores.
>
> A lógica de seleção/elegibilidade de validadores sobre `neighborhood_adjacency` e o limiar de
> votos permanecem como evolução prevista do backend.

## RN-08 — Reincidência e reabertura

- **Descrição.** Um problema **encerrado/resolvido** que volta a ocorrer é **reaberto**, criando
  uma **nova ocorrência encadeada** (reincidência) ligada à original.
- **Gatilho.** Em estado terminal (`closed`), `StatusControl` oferece "Reabrir" (exige motivo,
  mínimo 5 caracteres).
- **Comportamento.** `POST /api/occurrences/:id/reopen` com `{ reason }`. O backend cria a nova
  ocorrência e preenche o encadeamento: `reopen_count`, `parent_occurrence_id`,
  `root_occurrence_id`. O front marca `isRecurrence` quando `reopen_count > 0` ou há
  `parent_occurrence_id`.
- **Código.** `reopenOccurrence()` em `occurrences-api.ts:242`; `mapOccurrenceToReport` (campos de
  reincidência) em `occurrences-api.ts:124`; UI de reabertura em `StatusControl.tsx:135`.
- **Tabela de reaberturas (contrato).** `GET /occurrences/:id/reopens` → `BackendReopen[]`
  (`original_occurrence_id`, `new_occurrence_id`, `root_occurrence_id`, `reason`,
  `previous_status`, `reopen_sequence`).

## RN-09 — Votação / priorização

- **Descrição.** A votação comunitária (upvote/downvote → `score`) sinaliza a relevância da
  demanda.
- **Comportamento (front).** O front exibe `upvotes`, `downvotes` e `score` vindos do backend e os
  agrega em estatísticas (`useValidationStats`).
- **Código.** `evaluations-api.ts`; `score`/`upvotes`/`downvotes` em `mapOccurrenceToReport`.

> **No servidor** não existe campo `priority` nem lógica de priorização por votos. O `score`
> (upvotes − downvotes) é calculado e exposto, mas não ordena nem prioriza o tratamento. O front fixa
> `priority: "media"` (`occurrences-api.ts:133`) e mantém o enum `Priority` apenas como estrutura de
> UI. A priorização por votação é uma evolução prevista, caso entre no escopo.

## RN-10 — Janela de edição/exclusão pós-registro

- **Descrição.** Após registrar, o autor tem uma **janela de tempo** para editar ou excluir a
  própria ocorrência.
- **Comportamento (front).** A UI informa explicitamente: *"Você tem 24h para editar ou excluir a
  ocorrência após o registro."* (toast de sucesso e tela de revisão).
- **Código.** `CreateReportModal.tsx:154` e `:407`. Operações: `updateOccurrence` /
  `deleteOccurrence` (`occurrences-api.ts:213,227`).

> **No servidor** (`utils/occurrenceEditWindow.js`, `occurrencesService.updateOccurrence`), a janela
> é de 24 horas a partir de `created_at`, configurável por env `OCCURRENCE_EDIT_WINDOW_HOURS`
> (default 24). Vale para editar campos (`PATCH /occurrences/:id`) e gerenciar mídias
> (`POST`/`DELETE .../media`); fora do prazo, retorna 403 `EDIT_WINDOW_EXPIRED`. A edição também
> exige ser autor ou admin (403 `FORBIDDEN` via `assertCanEdit`). O texto de "24h" da interface,
> portanto, está correto para edição.
>
> A exclusão (`DELETE /occurrences/:id`, `occurrencesController.remove`) usa apenas `auth`, sem
> checagem de autor/admin nem da janela de edição: na prática, qualquer usuário autenticado pode
> excluir uma ocorrência (barrada apenas por integridade referencial, 409 `OCCURRENCE_IN_USE`).
> Aplicar a mesma verificação de autoria e janela ao delete é um ponto em aberto no backend.

## RN-11 — Mídia obrigatória no registro

- **Descrição.** O registro exige **ao menos uma foto** (até 5) do problema.
- **Comportamento.** O passo 2 do formulário só avança com `imagePreviews.length > 0`
  (`canProceedStep2`). A primeira imagem é a "principal". Upload via `POST
  /occurrences/:id/media` (multipart, campo `media`), após criar a ocorrência.
- **Código.** `CreateReportModal.tsx:177`; `uploadOccurrenceMedia()` em `occurrences-api.ts:180`.
- **Resiliência.** Se o upload falhar, a ocorrência **não é perdida**: o front avisa que as fotos
  não subiram e sugere reenvio em "Meu Painel".

## RN-12 — Órgão responsável

- **Descrição.** Cada ocorrência é tratada por um **órgão**. Existem dois mecanismos:
  1. **Atribuição real (autoritativa):** `assigned_organization_id` na ocorrência (nulo até a
     triagem atribuir). Os órgãos vêm de `GET /api/organizations` (somente leitura).
  2. **Derivação legada (hardcoded):** quando não há atribuição, o front deriva um órgão a partir
     do **slug da categoria** (`CATEGORY_ORGAN_MAP`): água/saneamento/esgoto → `agua_saneamento`,
     energia/iluminação/elétrica → `energia_luz`, demais → `prefeitura`.
- **Órgãos do escopo:** Prefeitura Municipal, **VISAN** (Água e Saneamento), **CELESC** (Energia e
  Iluminação) — ver `src/data/organConfig.ts`.
- **Código.** `CATEGORY_ORGAN_MAP`/`categoryOrganBySlug` em `mockData.ts:162`; órgãos reais em
  `useTaxonomy.ts` (`organizationName`, "Não atribuído" quando nulo).

> **No servidor**, o papel do usuário é apenas `citizen|agent|admin` (sem vínculo agente→organização)
> e não há vínculo categoria→organização. O `assigned_organization_id` só pode ser definido na
> criação (`occurrencesController.create` aceita o campo) e é zerado na reabertura (re-triagem). Não
> existe endpoint de atribuição/triagem pós-criação: o `PATCH /occurrences/:id` não permite alterar
> `assigned_organization_id`. Por isso, hoje a derivação por slug feita no front é, na prática, o
> único mecanismo de "órgão responsável" visível ao usuário. Um endpoint de triagem para
> atribuir/alterar o órgão após a criação é uma evolução prevista do backend.

## RN-13 — Identidade do cidadão e anonimato

- **Descrição.** O cidadão se autentica por **CPF + senha**; a UI comunica **anonimato** na
  publicação ("Sua identidade é protegida").
- **Código.** Login por CPF em `auth-api.ts:45`; aviso de anonimato em `CreateReportModal.tsx:391`.

> **No servidor** não existe flag `is_anonymous` nem campo equivalente: a ocorrência sempre grava
> `author_id` (o controller exige usuário autenticado). O texto "Anonimato garantido" exibido na
> interface (`CreateReportModal.tsx:391`), portanto, não corresponde a um anonimato no dado — a
> autoria é sempre registrada. Alinhar essa mensagem ao comportamento real (por exemplo, indicando
> que os dados pessoais não aparecem publicamente na ocorrência) é uma divergência conhecida.

## RN-14 — Integridade referencial de bairros

- **Descrição.** A ocorrência referencia o bairro por `neighborhood_id`. Reimportações da malha de
  bairros precisam ser **aditivas** para não órfãs as ocorrências.
- **Reflexo no front.** O front tolera `neighborhood_id` nulo (campo opcional em `Report`,
  resolvido para nome pela taxonomia; cai em vazio quando ausente).

> **No servidor**, `occurrences.neighborhood_id` usa `ON DELETE SET NULL`: apagar um bairro
> desvincula as ocorrências em vez de removê-las, o que torna essencial reimportar a malha de bairros
> de forma aditiva para não perder o vínculo. Em contraste, `category_id`/`subcategory_id` usam
> `RESTRICT` e as mídias usam `CASCADE`. Ver [07-modelo-de-dados.md](07-modelo-de-dados.md).

## RN-15 — Validação de CPF na entrada

- **Descrição.** CPF é validado no cliente (formato + dígitos verificadores) antes do envio; o
  envio normaliza para 11 dígitos (sem máscara).
- **Código.** `validateCPF`/`formatCPF` em `src/lib/validators.ts`; normalização no login/cadastro
  (`auth-api.ts`).
