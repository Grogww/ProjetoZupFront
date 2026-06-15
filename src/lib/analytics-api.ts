// Analytics / transparência (item 13) — endpoints REAIS do back (/api/analytics/*).
// Substitui o cálculo no cliente sobre amostra parcial.

import { api } from "@/lib/api";
import type { ReportStatus } from "@/data/mockData";

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  category_id?: number;
  neighborhood_id?: number;
  status?: ReportStatus;
}

export interface AnalyticsOverview {
  total_occurrences: number;
  distinct_problems: number;
  by_status_group: { open: number; resolved: number; closed_unresolved: number };
  resolution_rate: number | null;
  avg_response_seconds: number | null;
  avg_resolution_seconds: number | null;
  recurrence: { reopened_problems: number; recurrence_rate: number | null };
  active_neighborhoods: number;
  top_categories: { category_id: number; name: string; count: number }[];
}

export interface AnalyticsNeighborhood {
  neighborhood_id: number | null;
  name: string | null;
  center_point: { type: "Point"; coordinates: [number, number] } | null;
  total: number;
  open: number;
  resolved: number;
  closed_unresolved: number;
  avg_resolution_seconds: number | null;
  population_estimate: number | null;
  per_capita: number | null;
}

// Eficiência por órgão responsável (RF33) — GET /analytics/by-organization (auth).
// organization_id nulo = bucket "sem órgão atribuído".
export interface AnalyticsOrganization {
  organization_id: number | null;
  name: string | null;
  assigned_total: number;
  resolved: number;
  open: number;
  backlog_open: number;
  resolution_rate: number | null;
  avg_response_seconds: number | null;
  avg_resolution_seconds: number | null;
  reopened_after_resolution: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

export interface ResponseTimeSummary {
  avg_response_seconds: number | null;
  median_response_seconds: number | null;
  avg_resolution_seconds: number | null;
  median_resolution_seconds: number | null;
  sample_size_response: number;
  sample_size_resolution: number;
  group_by?: "category" | "neighborhood" | "month";
  breakdown?: Record<string, any>[];
}

export async function getAnalyticsOverview(filters: AnalyticsFilters = {}): Promise<AnalyticsOverview> {
  return api.get<AnalyticsOverview>("/analytics/overview", { query: filters as Record<string, any>, auth: false });
}

export async function getAnalyticsByNeighborhood(
  filters: Omit<AnalyticsFilters, "neighborhood_id"> = {}
): Promise<AnalyticsNeighborhood[]> {
  const data = await api.get<AnalyticsNeighborhood[]>("/analytics/by-neighborhood", {
    query: filters as Record<string, any>,
    auth: false,
  });
  return Array.isArray(data) ? data : [];
}

export async function getAnalyticsByOrganization(
  filters: Omit<AnalyticsFilters, "category_id" | "neighborhood_id"> = {}
): Promise<AnalyticsOrganization[]> {
  // Requer autenticação (bearerAuth) — diferente dos demais /analytics públicos.
  const data = await api.get<AnalyticsOrganization[]>("/analytics/by-organization", {
    query: filters as Record<string, any>,
  });
  return Array.isArray(data) ? data : [];
}

export async function getAnalyticsHeatmap(params: {
  bbox?: string;
  status?: ReportStatus;
  category_id?: number;
  limit?: number;
} = {}): Promise<HeatmapPoint[]> {
  const data = await api.get<HeatmapPoint[]>("/analytics/heatmap", { query: params as Record<string, any>, auth: false });
  return Array.isArray(data) ? data : [];
}

export async function getAnalyticsResponseTime(
  filters: AnalyticsFilters & { group_by?: "category" | "neighborhood" | "month" } = {}
): Promise<ResponseTimeSummary> {
  return api.get<ResponseTimeSummary>("/analytics/response-time", {
    query: filters as Record<string, any>,
    auth: false,
  });
}
