// Hooks de estatísticas para Minha Cidade e Gestão.
//
// - useAnalyticsOverview(): KPIs REAIS via GET /api/analytics/overview (item 13).
//   É a fonte oficial dos números globais (totais, taxa de resolução, tempos,
//   recorrência) — substitui o número inventado da queixa original.
// - Os demais hooks ainda derivam recortes (por bairro/categoria/órgão) a partir
//   da lista de ocorrências, agora sobre dados corretos. Conforme o back expõe
//   mais /analytics/*, cada um pode trocar a fonte sem mexer nos componentes.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  type Report,
  isResolvedStatus,
  isOpenStatus,
  UNASSIGNED_ORGAN_LABEL,
} from "@/data/mockData";
import { useOccurrences } from "@/hooks/useOccurrences";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import {
  getAnalyticsOverview,
  getAnalyticsByOrganization,
  getAnalyticsByNeighborhood,
  getAnalyticsResponseTime,
  getAnalyticsHeatmap,
  type AnalyticsOverview,
  type AnalyticsOrganization,
  type AnalyticsNeighborhood,
  type AnalyticsFilters,
  type HeatmapPoint,
} from "@/lib/analytics-api";

const isResolved = (r: Report) => isResolvedStatus(r.status);
const isPending = (r: Report) => isOpenStatus(r.status);

const daysBetween = (a: string, b: string) =>
  Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);

const RESPONSE_STATUSES = ["in_analysis", "in_progress"];

export interface CityOverview {
  total: number;
  active: number;
  resolved: number;
  unresolved: number;
  awaitingValidation: number;
  inAnalysis: number;
  inExecution: number;
  resolutionValidated: number;
  resolutionRejected: number;
  resolutionRate: number;
  pendingRate: number;
  avgResponseDays: number;
  avgResolutionDays: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  prevMonthCount: number;
  growthPct: number;
}

export interface NeighborhoodStat {
  name: string;
  total: number;
  resolved: number;
  pending: number;
  recurrent: number;
  vandalism: number;
  lighting: number;
  sanitation: number;
  resolutionRate: number;
  avgResolutionDays: number;
}

export interface CategoryStat {
  id: string;
  name: string;
  total: number;
  resolved: number;
  pending: number;
  rejected: number;
  recurrent: number;
  resolutionRate: number;
  avgResolutionDays: number;
}

// Estatística por ÓRGÃO REAL (item 11). organizationId nulo = "Não atribuído".
export interface OrganizationStat {
  organizationId: number | null;
  name: string;
  total: number;
  resolved: number;
  pending: number;
  inExecution: number;
  recurrent: number;
  rejected: number;
  overdue: number;
  resolutionRate: number;
  avgResponseDays: number;
  avgResolutionDays: number;
}

const secondsToDays = (s: number | null | undefined) =>
  s == null ? 0 : +(s / 86_400).toFixed(1);

/** KPIs globais reais do back (/analytics/overview). */
export function useAnalyticsOverview(filters: Record<string, any> = {}) {
  const q = useQuery({
    queryKey: ["analytics-overview", filters],
    queryFn: () => getAnalyticsOverview(filters),
    staleTime: 60_000,
    retry: 1,
  });
  const data = q.data as AnalyticsOverview | undefined;
  return {
    raw: data,
    isLoading: q.isLoading,
    isError: q.isError,
    total: data?.total_occurrences ?? 0,
    distinctProblems: data?.distinct_problems ?? 0,
    open: data?.by_status_group.open ?? 0,
    resolved: data?.by_status_group.resolved ?? 0,
    closedUnresolved: data?.by_status_group.closed_unresolved ?? 0,
    resolutionRate: data?.resolution_rate != null ? Math.round(data.resolution_rate * 100) : 0,
    avgResponseDays: secondsToDays(data?.avg_response_seconds),
    avgResolutionDays: secondsToDays(data?.avg_resolution_seconds),
    reopenedProblems: data?.recurrence.reopened_problems ?? 0,
    recurrenceRate: data?.recurrence.recurrence_rate != null ? Math.round(data.recurrence.recurrence_rate * 100) : 0,
    activeNeighborhoods: data?.active_neighborhoods ?? 0,
    topCategories: data?.top_categories ?? [],
  };
}

export function useCityOverview(): CityOverview {
  const { reports } = useOccurrences();
  return useMemo(() => {
    const total = reports.length;
    const active = reports.filter(isPending).length;
    const resolved = reports.filter(isResolved).length;
    const unresolved = reports.filter((r) => !isResolved(r)).length;
    const today = new Date().toISOString().slice(0, 10);
    const now = Date.now();
    const weekAgo = now - 7 * 86_400_000;
    const monthAgo = now - 30 * 86_400_000;
    const prevMonthAgo = now - 60 * 86_400_000;

    const responseDays: number[] = [];
    const resolutionDays: number[] = [];
    reports.forEach((r) => {
      const firstResp = r.statusHistory?.find((h) => RESPONSE_STATUSES.includes(h.status));
      if (firstResp) responseDays.push(daysBetween(r.createdAt, firstResp.date));
      const resolvedEntry = r.statusHistory?.find((h) => isResolvedStatus(h.status));
      if (resolvedEntry) resolutionDays.push(daysBetween(r.createdAt, resolvedEntry.date));
    });

    const avg = (a: number[]) => (a.length ? +(a.reduce((s, n) => s + n, 0) / a.length).toFixed(1) : 0);

    const todayCount = reports.filter((r) => r.createdAt.startsWith(today)).length;
    const weekCount = reports.filter((r) => new Date(r.createdAt).getTime() >= weekAgo).length;
    const monthCount = reports.filter((r) => new Date(r.createdAt).getTime() >= monthAgo).length;
    const prevMonthCount = reports.filter((r) => {
      const t = new Date(r.createdAt).getTime();
      return t >= prevMonthAgo && t < monthAgo;
    }).length;

    return {
      total,
      active,
      resolved,
      unresolved,
      awaitingValidation: reports.filter((r) => r.status === "awaiting_validation").length,
      inAnalysis: reports.filter((r) => r.status === "in_analysis").length,
      inExecution: reports.filter((r) => r.status === "in_progress").length,
      resolutionValidated: reports.filter((r) => r.status === "resolution_validated").length,
      resolutionRejected: reports.filter((r) => r.status === "resolution_rejected").length,
      resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
      pendingRate: total ? Math.round((unresolved / total) * 100) : 0,
      avgResponseDays: avg(responseDays),
      avgResolutionDays: avg(resolutionDays),
      todayCount,
      weekCount,
      monthCount,
      prevMonthCount,
      growthPct: prevMonthCount ? Math.round(((monthCount - prevMonthCount) / prevMonthCount) * 100) : 0,
    };
  }, [reports]);
}

export function useNeighborhoodStats(): NeighborhoodStat[] {
  const { reports } = useOccurrences();
  const { getCategoryById } = useTaxonomy();
  return useMemo(() => {
    const map = new Map<string, NeighborhoodStat>();
    reports.forEach((r) => {
      const key = r.neighborhood || "—";
      const cur = map.get(key) ?? {
        name: key,
        total: 0, resolved: 0, pending: 0, recurrent: 0,
        vandalism: 0, lighting: 0, sanitation: 0,
        resolutionRate: 0, avgResolutionDays: 0,
      };
      cur.total += 1;
      if (isResolved(r)) cur.resolved += 1;
      else if (isPending(r)) cur.pending += 1;
      if (r.isRecurrence) cur.recurrent += 1;
      const cat = getCategoryById(r.categoryId);
      if (cat?.slug?.includes("vandalismo")) cur.vandalism += 1;
      if (cat?.organ === "energia_luz" || cat?.slug?.includes("iluminacao")) cur.lighting += 1;
      if (cat?.organ === "agua_saneamento") cur.sanitation += 1;
      map.set(key, cur);
    });
    return Array.from(map.values())
      .map((n) => ({ ...n, resolutionRate: n.total ? Math.round((n.resolved / n.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [reports, getCategoryById]);
}

export function useCategoryStats(): CategoryStat[] {
  const { reports } = useOccurrences();
  const { categories } = useTaxonomy();
  return useMemo(() => {
    return categories
      .map((cat) => {
        const list = reports.filter((r) => r.categoryId === String(cat.id));
        const total = list.length;
        const resolved = list.filter(isResolved).length;
        return {
          id: String(cat.id),
          name: cat.name,
          total,
          resolved,
          pending: list.filter(isPending).length,
          rejected: list.filter((r) => r.status === "resolution_rejected").length,
          recurrent: list.filter((r) => r.isRecurrence).length,
          resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
          avgResolutionDays: 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [reports, categories]);
}

/**
 * Estatística por órgão REAL do back (item 11). Funde:
 *  - /organizations  → garante todos os órgãos ativos (mesmo com 0 ocorrências);
 *  - /analytics/by-organization → métricas autoritativas (total, resolvidas, taxa,
 *    tempos, reaberturas) computadas no servidor (auth);
 *  - lista de ocorrências (filtrada por organizationId) → recortes que o analytics
 *    não expõe (em execução, resoluções rejeitadas) e fallback quando o analytics
 *    não está disponível (ex.: sessão sem auth).
 * O órgão nulo vira o bucket "Não atribuído".
 */
export function useOrganizationStats(): OrganizationStat[] {
  const { reports } = useOccurrences();
  const { organizations } = useTaxonomy();
  const analyticsQ = useQuery({
    queryKey: ["analytics-by-organization"],
    queryFn: () => getAnalyticsByOrganization(),
    staleTime: 60_000,
    retry: 1,
  });
  const analytics = (analyticsQ.data ?? []) as AnalyticsOrganization[];

  return useMemo(() => {
    const aById = new Map<number | null, AnalyticsOrganization>();
    analytics.forEach((a) => aById.set(a.organization_id, a));

    const occByOrg = new Map<number | null, Report[]>();
    reports.forEach((r) => {
      const arr = occByOrg.get(r.organizationId) ?? [];
      arr.push(r);
      occByOrg.set(r.organizationId, arr);
    });

    // Universo de órgãos: ativos do /organizations + os presentes em analytics/ocorrências (inclui null).
    const ids = new Set<number | null>();
    organizations.forEach((o) => ids.add(o.id));
    analytics.forEach((a) => ids.add(a.organization_id));
    occByOrg.forEach((_, k) => ids.add(k));

    const avg = (a: number[]) => (a.length ? +(a.reduce((s, n) => s + n, 0) / a.length).toFixed(1) : 0);

    const stats = Array.from(ids).map<OrganizationStat>((id) => {
      const a = aById.get(id);
      const list = occByOrg.get(id) ?? [];
      const responseDays: number[] = [];
      const resolutionDays: number[] = [];
      list.forEach((r) => {
        const firstResp = r.statusHistory?.find((h) => RESPONSE_STATUSES.includes(h.status));
        if (firstResp) responseDays.push(daysBetween(r.createdAt, firstResp.date));
        const resolvedEntry = r.statusHistory?.find((h) => isResolvedStatus(h.status));
        if (resolvedEntry) resolutionDays.push(daysBetween(r.createdAt, resolvedEntry.date));
      });

      const name =
        id == null
          ? UNASSIGNED_ORGAN_LABEL
          : organizations.find((o) => o.id === id)?.name ?? a?.name ?? `Órgão #${id}`;
      const total = a?.assigned_total ?? list.length;
      const resolved = a?.resolved ?? list.filter(isResolved).length;
      const pending = a?.open ?? list.filter(isPending).length;

      return {
        organizationId: id,
        name,
        total,
        resolved,
        pending,
        inExecution: list.filter((r) => r.status === "in_progress").length,
        recurrent: a?.reopened_after_resolution ?? list.filter((r) => r.isRecurrence).length,
        rejected: list.filter((r) => r.status === "resolution_rejected").length,
        overdue: 0, // back não expõe prazo/SLA — sem fonte real
        resolutionRate:
          a?.resolution_rate != null
            ? Math.round(a.resolution_rate * 100)
            : total
              ? Math.round((resolved / total) * 100)
              : 0,
        avgResponseDays: a ? secondsToDays(a.avg_response_seconds) : avg(responseDays),
        avgResolutionDays: a ? secondsToDays(a.avg_resolution_seconds) : avg(resolutionDays),
      };
    });

    // Órgãos reais primeiro (por volume); "Não atribuído" por último.
    return stats.sort(
      (a, b) => Number(a.organizationId == null) - Number(b.organizationId == null) || b.total - a.total
    );
  }, [reports, organizations, analytics]);
}

// ===========================================================================
// Hooks que consomem DIRETO os endpoints /analytics/* (server-side, completos).
// Substituem os ChartPlaceholder e os recortes calculados sobre amostra parcial.
// ===========================================================================

const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const formatMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS_PT[(m || 1) - 1]}/${String(y).slice(2)}`;
};

/** Pendências/indicadores por bairro (GET /analytics/by-neighborhood). */
export function useAnalyticsByNeighborhood(filters: Omit<AnalyticsFilters, "neighborhood_id"> = {}) {
  const q = useQuery({
    queryKey: ["analytics-by-neighborhood", filters],
    queryFn: () => getAnalyticsByNeighborhood(filters),
    staleTime: 60_000,
    retry: 1,
  });
  return { data: (q.data ?? []) as AnalyticsNeighborhood[], isLoading: q.isLoading, isError: q.isError };
}

/** Resumo de tempos de resposta/resolução (GET /analytics/response-time). */
export function useResponseTime(filters: AnalyticsFilters = {}) {
  const q = useQuery({
    queryKey: ["analytics-response-time", filters],
    queryFn: () => getAnalyticsResponseTime(filters),
    staleTime: 60_000,
    retry: 1,
  });
  const d = q.data;
  return {
    isLoading: q.isLoading,
    avgResponseDays: secondsToDays(d?.avg_response_seconds),
    medianResponseDays: secondsToDays(d?.median_response_seconds),
    avgResolutionDays: secondsToDays(d?.avg_resolution_seconds),
    medianResolutionDays: secondsToDays(d?.median_resolution_seconds),
    sampleResponse: d?.sample_size_response ?? 0,
    sampleResolution: d?.sample_size_resolution ?? 0,
  };
}

export interface MonthlyTimePoint {
  month: string; // YYYY-MM
  label: string; // ex.: "jan/26"
  avgResponseDays: number;
  avgResolutionDays: number;
  sampleResolution: number;
}

/** Série mensal de tempos (GET /analytics/response-time?group_by=month). */
export function useResponseTimeByMonth(filters: AnalyticsFilters = {}): {
  data: MonthlyTimePoint[];
  isLoading: boolean;
} {
  const q = useQuery({
    queryKey: ["analytics-response-time-month", filters],
    queryFn: () => getAnalyticsResponseTime({ ...filters, group_by: "month" }),
    staleTime: 60_000,
    retry: 1,
  });
  const data = useMemo<MonthlyTimePoint[]>(() => {
    const rows = (q.data?.breakdown ?? []) as Array<Record<string, any>>;
    return rows
      .filter((r) => r.month)
      .map((r) => ({
        month: String(r.month),
        label: formatMonth(String(r.month)),
        avgResponseDays: secondsToDays(r.avg_response_seconds),
        avgResolutionDays: secondsToDays(r.avg_resolution_seconds),
        sampleResolution: r.sample_size_resolution ?? 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [q.data]);
  return { data, isLoading: q.isLoading };
}

/** Pontos do mapa de calor (GET /analytics/heatmap). */
export function useHeatmap(params: { bbox?: string; status?: string; category_id?: number; limit?: number } = {}) {
  const q = useQuery({
    queryKey: ["analytics-heatmap", params],
    queryFn: () => getAnalyticsHeatmap(params as any),
    staleTime: 60_000,
    retry: 1,
  });
  return { points: (q.data ?? []) as HeatmapPoint[], isLoading: q.isLoading };
}

export function useValidationStats() {
  const { reports } = useOccurrences();
  return useMemo(() => {
    const awaiting = reports.filter((r) => r.status === "awaiting_validation").length;
    const totalUpvotes = reports.reduce((s, r) => s + (r.upvotes || 0), 0);
    const totalScore = reports.reduce((s, r) => s + (r.score || 0), 0);
    const resolved = reports.filter(isResolved).length;
    return {
      awaiting,
      totalValidations: totalUpvotes,
      totalScore,
      avgValidatorsPerReport: reports.length ? +(totalUpvotes / reports.length).toFixed(1) : 0,
      confirmationRate: reports.length ? Math.round((resolved / reports.length) * 100) : 0,
    };
  }, [reports]);
}
