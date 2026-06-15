// Modelo de domínio do front (tipos, enums, labels e cores) + config fixa do escopo.
//
// FONTE DA VERDADE = BACK-END (ProjetoZup). Aqui só vive estrutura, nunca dado falso:
//  - Tipos/enums do domínio (Report, ReportStatus, ...), alinhados ao openapi.json.
//  - Mapas de label/cor usados pela UI.
//  - currentMunicipality (Videira/SC): escopo fixo do projeto, não vem do banco.
//  - CATEGORY_ORGAN_MAP / organLabels: órgãos HARDCODED (o endpoint de organizations
//    ainda será implementado — item 11; quando existir, troca-se a fonte aqui).
//
// Categorias, subcategorias e bairros NÃO ficam mais hardcoded: vêm da API via
// TaxonomyProvider (ver src/hooks/useTaxonomy.tsx).

// Status reais da máquina de estados do back (occurrence_status no openapi.json).
export type ReportStatus =
  | 'pending'
  | 'awaiting_validation'
  | 'validated'
  | 'in_analysis'
  | 'in_progress'
  | 'resolved'
  | 'resolution_validated'
  | 'resolution_rejected'
  | 'closed';

export type OrganType = 'prefeitura' | 'agua_saneamento' | 'energia_luz';
export type Priority = 'baixa' | 'media' | 'alta' | 'critica';

export interface Municipality {
  id: string;
  name: string;
  state: string;
  center: [number, number];
  zoom: number;
}

export interface Neighborhood {
  id: number;
  name: string;
  populationEstimate?: number | null;
}

// Órgão real do back (GET /organizations). Só leitura — não há cadastro pela API.
export interface Organization {
  id: number;
  name: string;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
}

/** Rótulo padrão para ocorrência ainda sem órgão atribuído (assigned_organization_id = null). */
export const UNASSIGNED_ORGAN_LABEL = "Não atribuído";

export interface Category {
  id: number;
  slug: string;
  name: string;
  organ: OrganType;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: number;
  slug: string;
  name: string;
  categoryId: number;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  /** id numérico (em string) da categoria no back. "" quando ausente. */
  categoryId: string;
  /** id numérico (em string) da subcategoria no back. "" quando ausente. */
  subcategoryId: string;
  status: ReportStatus;
  priority: Priority;
  lat: number;
  lng: number;
  neighborhoodId: number | null;
  /** Nome do bairro resolvido pela taxonomia (pode ficar "" até resolver). */
  neighborhood: string;
  municipalityId: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  // Engajamento real (evaluations / score do back).
  upvotes: number;
  downvotes: number;
  score: number;
  /**
   * Órgão derivado da categoria (legado/hardcoded — ainda usado por painéis
   * institucionais acoplados ao papel do agente, pois o back não vincula
   * agente→organização). Para o órgão REAL responsável use `organizationId`.
   */
  organ: OrganType;
  /** Órgão real atribuído (back: assigned_organization_id). null = sem atribuição. */
  organizationId: number | null;
  /** id do autor no back (para liberar editar/excluir ao próprio cidadão). */
  authorId?: number | null;
  imageUrl: string;
  imageUrls?: string[];
  resolvedAt?: string | null;
  closedAt?: string | null;
  statusHistory: StatusHistoryEntry[];
  // Reincidência (cadeia de reaberturas no back).
  isRecurrence?: boolean;
  recurrenceCount?: number;
  parentReportId?: string | null;
  rootReportId?: string | null;
}

export interface StatusHistoryEntry {
  status: ReportStatus;
  date: string;
  note?: string;
  by?: string;
  reason?: string;
}

export const DUPLICATE_RADIUS_METERS = 7;
export const NEARBY_RADIUS_METERS = 500;

export const rejectionReasons = [
  { id: 'duplicada', label: 'Ocorrência duplicada' },
  { id: 'localizacao_incorreta', label: 'Localização incorreta' },
  { id: 'imagem_insuficiente', label: 'Imagem insuficiente' },
  { id: 'categoria_incorreta', label: 'Categoria incorreta' },
  { id: 'nao_confirmada', label: 'Não foi possível confirmar existência' },
  { id: 'ja_resolvido', label: 'Problema já resolvido' },
  { id: 'conteudo_inadequado', label: 'Conteúdo inadequado' },
];

export const priorityLabels: Record<Priority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export const priorityColors: Record<Priority, string> = {
  baixa: 'hsl(210, 14%, 70%)',
  media: 'hsl(45, 100%, 51%)',
  alta: 'hsl(25, 95%, 53%)',
  critica: 'hsl(0, 84%, 60%)',
};

// Base intencional do projeto (Videira/SC). Não existe no banco — é o escopo fixo.
export const currentMunicipality: Municipality = {
  id: 'videira-sc',
  name: 'Videira',
  state: 'SC',
  center: [-27.0078, -51.1519],
  zoom: 14,
};

// Órgãos HARDCODED (item 11/17): mapeamento slug-da-categoria → órgão responsável.
// O back ainda não expõe o vínculo categoria→órgão; até lá, derivamos pelo slug.
// Slugs não listados caem em 'prefeitura' (zeladoria geral).
export const CATEGORY_ORGAN_MAP: Record<string, OrganType> = {
  agua: 'agua_saneamento',
  'agua-saneamento': 'agua_saneamento',
  saneamento: 'agua_saneamento',
  esgoto: 'agua_saneamento',
  energia: 'energia_luz',
  'energia-iluminacao': 'energia_luz',
  eletrica: 'energia_luz',
};

export const categoryOrganBySlug = (slug?: string | null): OrganType =>
  (slug && CATEGORY_ORGAN_MAP[slug]) || 'prefeitura';

export const organLabels: Record<OrganType, string> = {
  prefeitura: 'Prefeitura Municipal',
  agua_saneamento: 'Água e Saneamento',
  energia_luz: 'Energia e Iluminação',
};

export const statusLabels: Record<ReportStatus, string> = {
  pending: 'Pendente',
  awaiting_validation: 'Aguardando Validação',
  validated: 'Validada pela Comunidade',
  in_analysis: 'Em Análise',
  in_progress: 'Em Execução',
  resolved: 'Resolvido pelo Órgão',
  resolution_validated: 'Resolução Validada',
  resolution_rejected: 'Resolução Rejeitada',
  closed: 'Encerrada',
};

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: '#9CA3AF',
  awaiting_validation: '#A855F7',
  validated: '#8B5CF6',
  in_analysis: '#EAB308',
  in_progress: '#0D9488',
  resolved: '#22C55E',
  resolution_validated: '#16A34A',
  resolution_rejected: '#EF4444',
  closed: '#6B7280',
};

export const getStatusColor = (status: ReportStatus): string =>
  STATUS_COLORS[status] ?? '#9CA3AF';

// Agrupamentos de status para estatísticas (alinhados ao by_status_group do back:
// open / resolved / closed_unresolved).
export const RESOLVED_STATUSES: ReportStatus[] = ['resolved', 'resolution_validated'];
export const OPEN_STATUSES: ReportStatus[] = [
  'pending',
  'awaiting_validation',
  'validated',
  'in_analysis',
  'in_progress',
  'resolution_rejected',
];

export const isResolvedStatus = (s: ReportStatus) => RESOLVED_STATUSES.includes(s);
export const isOpenStatus = (s: ReportStatus) => OPEN_STATUSES.includes(s);
export const ALL_STATUSES: ReportStatus[] = [...OPEN_STATUSES, ...RESOLVED_STATUSES, 'closed'];

// Máquina de estados REAL do back (occurrencesService.js → STATUS_TRANSITIONS).
// Espelho EXATO — não inventar transições: o que não estiver aqui retorna 409
// (`details:{from,to,allowed}`) na rota PATCH /occurrences/:id/status.
// `closed` é terminal; reabertura é feita via POST /occurrences/:id/reopen.
export const STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  pending: ['awaiting_validation', 'closed'],
  awaiting_validation: ['validated', 'closed'],
  validated: ['in_analysis', 'closed'],
  in_analysis: ['in_progress', 'closed'],
  in_progress: ['resolved', 'closed'],
  resolved: ['resolution_validated', 'resolution_rejected'],
  resolution_rejected: ['in_progress', 'closed'],
  resolution_validated: ['closed'],
  closed: [],
};

/** Próximos status válidos a partir de `s` (lista vazia = estado terminal). */
export const nextStatuses = (s: ReportStatus): ReportStatus[] => STATUS_TRANSITIONS[s] ?? [];

/** `closed` é terminal — só sai dele reabrindo (POST /occurrences/:id/reopen). */
export const isTerminalStatus = (s: ReportStatus): boolean => nextStatuses(s).length === 0;
