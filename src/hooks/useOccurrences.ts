// Hook central para listar ocorrências do backend Node.
// Enriquece cada Report com órgão (derivado da categoria — hardcoded) e nome do
// bairro (resolvido pela taxonomia), mantendo o shape estável para a UI.

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  listOccurrences,
  mapOccurrenceToReport,
  updateOccurrenceStatus,
  reopenOccurrence,
  type ListOccurrencesQuery,
} from "@/lib/occurrences-api";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { useAuth } from "@/hooks/useAuth";
import type { Report, ReportStatus } from "@/data/mockData";

export function useOccurrences(query: ListOccurrencesQuery = {}, options: { enabled?: boolean } = {}) {
  const { categoryOrgan, neighborhoodById } = useTaxonomy();

  const q = useQuery({
    queryKey: ["occurrences", query],
    queryFn: async () => {
      const raw = await listOccurrences(query);
      return raw.map(mapOccurrenceToReport);
    },
    enabled: options.enabled ?? true,
    staleTime: 30_000,
    retry: 1,
  });

  const reports = useMemo<Report[]>(() => {
    const base = q.data ?? [];
    return base.map((r) => ({
      ...r,
      organ: categoryOrgan(r.categoryId),
      neighborhood:
        r.neighborhoodId != null ? neighborhoodById(r.neighborhoodId)?.name ?? r.neighborhood : r.neighborhood,
    }));
  }, [q.data, categoryOrgan, neighborhoodById]);

  return {
    reports,
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error,
    refetch: q.refetch,
  };
}

// Invalida tudo que depende do estado de uma ocorrência após uma mutação de
// status/reabertura: a lista, o detalhe, o histórico e os recortes de analytics.
function invalidateOccurrence(qc: QueryClient, id: string) {
  qc.invalidateQueries({ queryKey: ["occurrences"] });
  qc.invalidateQueries({ queryKey: ["occurrence-detail", id] });
  qc.invalidateQueries({ queryKey: ["status-history", id] });
  qc.invalidateQueries({
    predicate: (q) =>
      typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("analytics-"),
  });
}

// Mutação de mudança de status (PATCH /occurrences/:id/status). O back valida a
// transição contra STATUS_TRANSITIONS e responde 409 (ApiError.data.details) quando
// inválida — o tratamento fica em quem chama (ver StatusControl).
export function useUpdateOccurrenceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReportStatus }) =>
      updateOccurrenceStatus(id, status),
    onSuccess: (_data, { id }) => invalidateOccurrence(qc, id),
  });
}

// Reabertura (POST /occurrences/:id/reopen): cria uma nova ocorrência encadeada a
// partir de uma encerrada/resolvida. Exige `reason`.
export function useReopenOccurrence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => reopenOccurrence(id, reason),
    onSuccess: (_data, { id }) => invalidateOccurrence(qc, id),
  });
}

// Ocorrências do próprio cidadão logado: cruza GET /users/me (id) com
// GET /occurrences?author_id={id}. Sem usuário, não dispara e devolve [].
export function useMyOccurrences() {
  const { user } = useAuth();
  return useOccurrences(
    user ? { author_id: Number(user.id), limit: 200 } : {},
    { enabled: !!user }
  );
}
