# 7. Modelo de Dados (contrato consumido)

> Este é o **frontend**: não possui banco. O modelo abaixo é o **contrato** que o front consome do
> backend ProjetoZup (PostgreSQL + PostGIS), reconstruído a partir das interfaces TypeScript em
> `src/lib/*-api.ts`. O esquema físico (tabelas, índices, constraints) é definido **no backend** —
> trate este ER como a **visão de domínio** que o front enxerga.

## 7.1 Diagrama ER (visão do contrato)

```mermaid
erDiagram
    USER ||--o{ OCCURRENCE : "cria (author_id)"
    USER }o--|| NEIGHBORHOOD : "reside (neighborhood_id)"
    USER ||--o{ EVALUATION : "vota"
    OCCURRENCE ||--o{ EVALUATION : "recebe votos"
    OCCURRENCE ||--o{ OCCURRENCE_MEDIA : "tem mídia"
    OCCURRENCE ||--o{ STATUS_HISTORY : "tem histórico"
    OCCURRENCE ||--o{ REOPEN : "gera reabertura"
    OCCURRENCE }o--|| CATEGORY : "category_id"
    OCCURRENCE }o--|| SUBCATEGORY : "subcategory_id"
    OCCURRENCE }o--|| NEIGHBORHOOD : "neighborhood_id"
    OCCURRENCE }o--o| ORGANIZATION : "assigned_organization_id"
    CATEGORY ||--o{ SUBCATEGORY : "tem"

    USER {
        int id PK
        string name
        string email
        string cpf
        enum role "citizen|agent|admin"
        int neighborhood_id FK
        bool is_active
    }
    OCCURRENCE {
        int id PK
        string title
        string description
        geometry location "GeoJSON Point [lng,lat]"
        string address
        int category_id FK
        int subcategory_id FK
        int neighborhood_id FK
        int author_id FK
        int assigned_organization_id FK
        string status
        int upvote_count
        int downvote_count
        int score
        int reopen_count
        int parent_occurrence_id
        int root_occurrence_id
        timestamp resolved_at
        timestamp closed_at
        timestamp created_at
    }
    OCCURRENCE_MEDIA {
        int id PK
        int occurrence_id FK
        string url
        string mime_type
        int size_bytes
    }
    STATUS_HISTORY {
        int id PK
        int occurrence_id FK
        string old_status
        string new_status
        int changed_by FK
        string note
        timestamp created_at
    }
    REOPEN {
        int id PK
        int original_occurrence_id FK
        int new_occurrence_id FK
        int root_occurrence_id FK
        int reopened_by FK
        string reason
        string previous_status
        int reopen_sequence
    }
    EVALUATION {
        int id PK
        int occurrence_id FK
        int user_id FK
        enum vote_type "up|down"
    }
    CATEGORY {
        int id PK
        string slug
        string name
        bool is_active
    }
    SUBCATEGORY {
        int id PK
        int category_id FK
        string slug
        string name
        bool is_active
    }
    NEIGHBORHOOD {
        int id PK
        string name
        int population_estimate
        geometry boundary "Polígono (GET /:id)"
        geometry center_point "Ponto (GET /:id)"
    }
    ORGANIZATION {
        int id PK
        string name
        string contact_email
        string contact_phone
        bool is_active
    }
```

## 7.2 Entidades centrais (como o front as consome)

| Entidade | Interface (front) | Observações |
|----------|-------------------|-------------|
| Ocorrência | `BackendOccurrence` (`occurrences-api.ts`) | `location` é GeoJSON Point `[lng, lat]`; `status` é um dos 9 enums; ids são **inteiros** |
| Mídia | `OccurrenceMedia` | `url` pode ser relativa → prefixada com a origem do backend |
| Histórico de status | `BackendStatusHistory` | `old_status`/`new_status`, `changed_by`, `note` |
| Reabertura | `BackendReopen` | Encadeamento por `root_occurrence_id`/`reopen_sequence` |
| Avaliação (voto) | `Evaluation` | `vote_type: up\|down` |
| Categoria/Subcategoria | `BackendCategory`/`BackendSubcategory` | `id` numérico + `slug` |
| Bairro | `NeighborhoodSummary`/`NeighborhoodDetail` | Geometria (`boundary`, `center_point`) **só** no detalhe |
| Órgão | `BackendOrganization` | Somente leitura; referenciado por `assigned_organization_id` |
| Usuário | `BackendUser` | `role: citizen\|agent\|admin`, `neighborhood_id` |

**Modelo de UI (`Report`).** O front converte `BackendOccurrence` → `Report` (`mockData.ts`),
adicionando rótulos, cores, nome do bairro e órgão derivado. `Report.priority` é **sempre `media`**
(o backend não tem prioridade hoje).

## 7.3 Decisões geoespaciais

- **GeoJSON / SRID.** A localização trafega como **GeoJSON Point**, convenção **`[longitude,
  latitude]`**. O front mapeia `coordinates[1]→lat` e `coordinates[0]→lng` (`occurrences-api.ts:103`).
- **Geofencing.** `GET /neighborhoods/locate?lat&lng` resolve o bairro que **contém** o ponto
  (`ST_Contains`, no backend).
- **Geometria de bairros.** `boundary` (polígono) e `center_point` vêm em GeoJSON via
  `ST_AsGeoJSON` **apenas** no `GET /neighborhoods/:id`. O front monta a malha desenhável com N+1
  controlado (`listNeighborhoodBoundaries`).
- **Proximidade/duplicidade.** `GET /occurrences/nearby` (raio em metros) e bloqueio na criação
  (409) — cálculo de distância (`ST_DWithin`/`geography`) **no backend**.
- **Heatmap.** `GET /analytics/heatmap` devolve `{ lat, lng, weight }` já prontos para `leaflet.heat`.

> **No servidor:**
> - SRID 4326 (WGS84) uniforme, em colunas tipadas: `occurrences.location geometry(Point,4326)`,
>   `neighborhoods.boundary geometry(MultiPolygon,4326)`, `neighborhoods.center_point
>   geometry(Point,4326)`.
> - `geometry` para armazenamento e filtro (`ST_Contains`) e cast `::geography` apenas para distância
>   real em metros (`ST_DWithin`/`ST_Distance` em `occurrencesModel.findNearby`).
> - Índices GiST no DDL: `idx_occurrences_location`, `idx_neighborhoods_boundary`,
>   `idx_neighborhoods_center` (+ btree em `status`/`category_id`/`neighborhood_id`/`created_at`).
>
> Dois pontos permanecem em aberto no backend e não afetam o front: a reprojeção SIRGAS 2000
> (EPSG:4674) → WGS84 do ETL de importação dos bairros — os dados já chegam em 4326 no banco, mas o
> SRID de origem e o passo de `ST_Transform` não estão versionados; e a forma de geração do
> `center_point` (`ST_PointOnSurface` ou `ST_Centroid`), já que o seed provém de um backup binário.

## 7.4 Integridade referencial

- A ocorrência referencia `category_id`, `subcategory_id`, `neighborhood_id`,
  `assigned_organization_id` (nulo até a triagem) e `author_id`.
- O front **tolera nulos** nessas FKs (campos opcionais em `Report`; bairro/órgão caem em vazio /
  "Não atribuído").

> **No DDL do servidor:**
> - `occurrences.neighborhood_id` → `ON DELETE SET NULL` (apagar bairro desvincula, não apaga a
>   ocorrência); por isso reimportações da malha de bairros devem ser aditivas (ver RN-14).
> - `occurrences.category_id` / `subcategory_id` → `RESTRICT` (não se apaga categoria em uso).
> - `occurrence_media.*` → `CASCADE` (a mídia some com a ocorrência; os bytes em disco são limpos
>   pelo serviço).
> - `neighborhood_adjacency` existe (PK `(neighborhood_id, neighbor_id)`, CHECK de não-reflexividade,
>   FKs `ON DELETE CASCADE`), modelada mas ainda não usada por código.
> - `occurrence_reopens.new_occurrence_id` é único (cada ocorrência só pode ser fruto de uma
>   reabertura).
