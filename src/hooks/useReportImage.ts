// Hidrata a imagem principal de uma ocorrência quando a listagem não a trouxe.
//
// A listagem (GET /occurrences) NÃO retorna o array `media`; só o detalhe
// (GET /occurrences/:id) traz as fotos. Por isso os cards montados a partir da
// lista ficam sem `imageUrl`. Este hook busca o detalhe sob demanda,
// reaproveitando a mesma queryKey do ReportDetailModal (cache compartilhado:
// abrir o detalhe aquece o card e vice-versa).
//
// Correção ideal de longo prazo: o back devolver a imagem principal já na
// listagem — aí `report.imageUrl` vem preenchido e nenhuma chamada extra ocorre.

import { useQuery } from "@tanstack/react-query";
import { getOccurrence, mapOccurrenceToReport } from "@/lib/occurrences-api";
import type { Report } from "@/data/mockData";

export function useReportImage(report: Pick<Report, "id" | "imageUrl">): string {
  const hasImage = !!report.imageUrl;
  const q = useQuery({
    queryKey: ["occurrence-detail", report.id],
    queryFn: async () => mapOccurrenceToReport(await getOccurrence(report.id)),
    enabled: !hasImage,
    staleTime: 5 * 60_000,
  });
  return hasImage ? report.imageUrl : q.data?.imageUrl ?? "";
}
