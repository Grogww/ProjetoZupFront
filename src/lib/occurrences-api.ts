// Contratos de ocorrências do backend Node (ProjetoZup) — alinhados ao openapi.json.
// Mapeia a Occurrence real para o tipo Report usado pelo front.
//
// Diferenças que este arquivo resolve frente ao contrato antigo (imaginário):
//  - localização vem como GeoJSON Point: location.coordinates = [lng, lat] (item 3)
//  - status são os 9 reais da máquina de estados (item 4)
//  - category_id/subcategory_id/neighborhood_id são INTEGER (itens 2, 12)
//  - mídia: media[].url (item 6); upload em /media campo `media` (item 5)
//  - URL de mídia pode ser relativa → prefixa com a origem do back (item 20)
//  - endereço é string única `address` (item 15); sem is_anonymous (item 23)
//  - paginação limit/offset (item 14); status-history (item 16); reopen (item 24);
//    nearby/antiduplicidade (item 25).

import { api } from "@/lib/api";
import type { Report, ReportStatus, StatusHistoryEntry } from "@/data/mockData";
import { ALL_STATUSES, statusLabels } from "@/data/mockData";

// Origem do back (sem o /api) para servir /uploads/... quando a URL vier relativa.
const API_ORIGIN = (() => {
  try {
    return new URL(api.baseUrl).origin;
  } catch {
    return "";
  }
})();

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface OccurrenceMedia {
  id: number;
  occurrence_id: number;
  url: string;
  storage_key?: string;
  original_name?: string | null;
  mime_type?: string;
  size_bytes?: number;
  uploaded_by?: number | null;
  created_at?: string;
}

export interface BackendOccurrence {
  id: number;
  title: string;
  description: string;
  location: GeoJSONPoint | null;
  address?: string | null;
  category_id?: number | null;
  subcategory_id?: number | null;
  neighborhood_id?: number | null;
  author_id?: number;
  assigned_organization_id?: number | null;
  status: string;
  upvote_count?: number;
  downvote_count?: number;
  score?: number;
  reopen_count?: number;
  parent_occurrence_id?: number | null;
  root_occurrence_id?: number | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  media?: OccurrenceMedia[];
  distance_m?: number;
}

export interface BackendStatusHistory {
  id: number;
  occurrence_id: number;
  old_status: string | null;
  new_status: string;
  changed_by?: number | null;
  note?: string | null;
  created_at: string;
}

export interface BackendReopen {
  id: number;
  original_occurrence_id?: number | null;
  new_occurrence_id: number;
  root_occurrence_id?: number | null;
  reopened_by?: number | null;
  reason: string;
  previous_status: string;
  reopen_sequence: number;
  created_at: string;
}

const STATUS_SET = new Set<string>(ALL_STATUSES);
function normalizeStatus(s: string): ReportStatus {
  return (STATUS_SET.has(s) ? s : "pending") as ReportStatus;
}

function coords(o: BackendOccurrence): { lat: number; lng: number } {
  const c = o.location?.coordinates;
  if (Array.isArray(c) && c.length >= 2) return { lat: c[1], lng: c[0] };
  return { lat: 0, lng: 0 };
}

export function mapStatusHistory(h: BackendStatusHistory): StatusHistoryEntry {
  return {
    status: normalizeStatus(h.new_status),
    date: h.created_at,
    note: h.note ?? undefined,
    by: h.changed_by != null ? `Usuário #${h.changed_by}` : undefined,
  };
}

// Report base: organ e nome do bairro são enriquecidos depois (taxonomia, em useOccurrences).
export function mapOccurrenceToReport(o: BackendOccurrence): Report {
  const { lat, lng } = coords(o);
  const status = normalizeStatus(o.status);
  const photos = (o.media ?? []).map((m) => resolveMediaUrl(m.url)).filter(Boolean);
  const primary = photos[0] || "";
  const isRecurrence = (o.reopen_count ?? 0) > 0 || o.parent_occurrence_id != null;

  return {
    id: String(o.id),
    title: o.title,
    description: o.description,
    categoryId: o.category_id != null ? String(o.category_id) : "",
    subcategoryId: o.subcategory_id != null ? String(o.subcategory_id) : "",
    status,
    priority: "media", // back não tem prioridade (item 10 — stand-by)
    lat,
    lng,
    neighborhoodId: o.neighborhood_id ?? null,
    neighborhood: "",
    municipalityId: "videira-sc",
    address: o.address ?? "",
    createdAt: o.created_at ?? new Date().toISOString(),
    updatedAt: o.updated_at ?? o.created_at ?? new Date().toISOString(),
    upvotes: o.upvote_count ?? 0,
    downvotes: o.downvote_count ?? 0,
    score: o.score ?? 0,
    organ: "prefeitura",
    organizationId: o.assigned_organization_id ?? null,
    authorId: o.author_id ?? null,
    imageUrl: primary,
    imageUrls: photos,
    resolvedAt: o.resolved_at ?? null,
    closedAt: o.closed_at ?? null,
    statusHistory: [{ status, date: o.created_at ?? new Date().toISOString() }],
    isRecurrence,
    recurrenceCount: o.reopen_count ?? 0,
    parentReportId: o.parent_occurrence_id != null ? String(o.parent_occurrence_id) : null,
    rootReportId: o.root_occurrence_id != null ? String(o.root_occurrence_id) : null,
  };
}

export interface CreateOccurrencePayload {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  category_id: number;
  subcategory_id?: number | null;
  neighborhood_id?: number | null;
}

export interface DuplicateError {
  duplicate_id: number;
  distance_m: number;
}

export async function createOccurrence(payload: CreateOccurrencePayload): Promise<BackendOccurrence> {
  return api.post<BackendOccurrence>("/occurrences", payload);
}

export async function uploadOccurrenceMedia(
  occurrenceId: number | string,
  files: File[]
): Promise<OccurrenceMedia[]> {
  if (!files.length) return [];
  const fd = new FormData();
  files.forEach((f, i) => fd.append("media", f, f.name || `media-${i}.jpg`));
  return api.post<OccurrenceMedia[]>(`/occurrences/${occurrenceId}/media`, fd, { multipart: true });
}

export interface ListOccurrencesQuery {
  status?: ReportStatus | string;
  category_id?: number;
  subcategory_id?: number;
  neighborhood_id?: number;
  author_id?: number;
  assigned_organization_id?: number;
  limit?: number;
  offset?: number;
}

export async function listOccurrences(q: ListOccurrencesQuery = {}): Promise<BackendOccurrence[]> {
  const data = await api.get<BackendOccurrence[] | { data: BackendOccurrence[] }>("/occurrences", {
    query: q as Record<string, any>,
    auth: false,
  });
  return Array.isArray(data) ? data : data?.data ?? [];
}

export async function getOccurrence(id: number | string): Promise<BackendOccurrence> {
  return api.get<BackendOccurrence>(`/occurrences/${id}`, { auth: false });
}

export async function updateOccurrence(
  id: number | string,
  patch: { title?: string; description?: string; address?: string; latitude?: number; longitude?: number }
): Promise<BackendOccurrence> {
  return api.patch<BackendOccurrence>(`/occurrences/${id}`, patch);
}

export async function updateOccurrenceStatus(
  id: number | string,
  status: ReportStatus
): Promise<BackendOccurrence> {
  return api.patch<BackendOccurrence>(`/occurrences/${id}/status`, { status });
}

export async function deleteOccurrence(id: number | string): Promise<void> {
  await api.delete(`/occurrences/${id}`);
}

export async function listStatusHistory(id: number | string): Promise<StatusHistoryEntry[]> {
  const data = await api.get<BackendStatusHistory[]>(`/occurrences/${id}/status-history`, { auth: false });
  return (Array.isArray(data) ? data : []).map(mapStatusHistory);
}

export async function listOccurrenceMedia(id: number | string): Promise<OccurrenceMedia[]> {
  const data = await api.get<OccurrenceMedia[]>(`/occurrences/${id}/media`, { auth: false });
  return (Array.isArray(data) ? data : []).map((m) => ({ ...m, url: resolveMediaUrl(m.url) }));
}

// Reincidência (item 24)
export async function reopenOccurrence(
  id: number | string,
  reason: string,
  overrides?: Partial<CreateOccurrencePayload> & { description?: string }
): Promise<BackendOccurrence> {
  return api.post<BackendOccurrence>(`/occurrences/${id}/reopen`, { reason, ...overrides });
}

export async function listReopens(id: number | string): Promise<BackendReopen[]> {
  const data = await api.get<BackendReopen[]>(`/occurrences/${id}/reopens`, { auth: false });
  return Array.isArray(data) ? data : [];
}

// Antiduplicidade — ocorrências num raio (default 500m) ordenadas por distância (item 25)
export async function listNearbyOccurrences(
  lat: number,
  lng: number,
  radius = 500
): Promise<BackendOccurrence[]> {
  const data = await api.get<BackendOccurrence[]>("/occurrences/nearby", {
    query: { lat, lng, radius },
    auth: false,
  });
  return Array.isArray(data) ? data : [];
}

// Reexport útil para UIs que listam status.
export { statusLabels };
