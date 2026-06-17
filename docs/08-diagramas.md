# 8. Diagramas (consolidados)

Diagramas em Mermaid, referenciados pelas demais seções.

## 8.1 Casos de uso (atores × funcionalidades)

```mermaid
flowchart LR
    Cidadao([Cidadão])
    Orgao([Órgão / Gestão])
    Admin([Administrador])
    Visitante([Visitante])

    Cidadao --> UC1[Registrar ocorrência + mídia]
    Cidadao --> UC2[Ver ocorrências próximas]
    Cidadao --> UC3[Votar / avaliar]
    Cidadao --> UC4[Acompanhar status]
    Cidadao --> UC5[Editar/excluir a própria ocorrência]

    Visitante --> UC6[Explorar mapa e filtros]
    Visitante --> UC7[Ver Minha Cidade / dashboards públicos]
    Visitante --> UC8[Cadastrar-se / autenticar]
    Visitante --> UC9[Suporte / FAQ]

    Orgao --> UC10[Triagem e mudança de status]
    Orgao --> UC11[Reabrir ocorrência]
    Orgao --> UC12[Dashboards de gestão / por órgão]

    Admin --> UC10
    Admin --> UC12
    Admin --> UC13[Listar usuários]
```

## 8.2 Modelo ER

Ver [07-modelo-de-dados.md](07-modelo-de-dados.md#71-diagrama-er-visão-do-contrato).

## 8.3 Máquina de estados da ocorrência

Ver detalhe e transições em
[01-regras-de-negocio.md](01-regras-de-negocio.md#diagrama-de-estados).

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
```

## 8.4 Sequência — registrar → validação comunitária → mudança de status

```mermaid
sequenceDiagram
    actor C as Cidadão
    participant FE as Front (ZUP X)
    participant API as API (ProjetoZup)
    participant DB as PostgreSQL/PostGIS
    actor Com as Comunidade
    actor Org as Órgão/Gestão

    C->>FE: Marca ponto no mapa
    FE->>API: GET /neighborhoods/locate?lat&lng
    API->>DB: ST_Contains(ponto)
    DB-->>API: bairro
    API-->>FE: bairro detectado
    FE->>API: GET /occurrences/nearby (raio 500m)
    API-->>FE: ocorrências próximas (aviso de duplicidade)
    C->>FE: Preenche dados + fotos e publica
    FE->>API: POST /occurrences
    alt duplicada (muito próxima)
        API-->>FE: 409 {duplicate_id, distance_m}
        FE-->>C: "Ocorrência semelhante já existe"
    else criada
        API-->>FE: 201 ocorrência (status pending)
        FE->>API: POST /occurrences/:id/media (multipart)
    end

    Com->>FE: Upvote/downvote
    FE->>API: POST /occurrences/:id/upvote
    Note over API,DB: Regras de validação comunitária<br/>(elegibilidade, contagem) no backend

    Org->>FE: Alterar status (Avançar para)
    FE->>API: PATCH /occurrences/:id/status
    alt transição inválida
        API-->>FE: 409 {from,to,allowed}
        FE-->>Org: "Transição não permitida"
    else válida
        API-->>FE: ocorrência atualizada
        FE-->>Org: status atualizado + histórico
    end
```

## 8.5 Arquitetura geral

```mermaid
flowchart TB
    subgraph Cliente[Navegador]
        FE["ZUP X — React + Vite<br/>Leaflet/OSM · TanStack Query"]
    end
    subgraph Edge[Container / Deploy]
        NGINX["Nginx<br/>(estático + proxy /api + SPA fallback)"]
    end
    subgraph Backend[ProjetoZup]
        API["Node.js + Express<br/>(controllers/services/models)"]
        DB[("PostgreSQL + PostGIS")]
        FILES[["Armazenamento de mídia<br/>/uploads"]]
    end
    OSM["Tiles OpenStreetMap<br/>(MVP — trocar p/ produção)"]

    FE -- "/api/* (rel.)" --> NGINX
    NGINX -- "BACKEND_URL" --> API
    FE -. "VITE_API_BASE_URL<br/>(dev direto)" .-> API
    FE -- tiles --> OSM
    API --> DB
    API --> FILES
```

> No **desenvolvimento**, o front fala direto com a API por `VITE_API_BASE_URL`. No **container**, o
> bundle chama `/api` (relativo) e o **Nginx** faz proxy para `BACKEND_URL` (sem CORS, com fallback
> de SPA). Ver [09-como-rodar.md](09-como-rodar.md).
