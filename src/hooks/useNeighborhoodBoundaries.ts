// Contornos reais (GeoJSON) dos bairros para desenhar no mapa.
//
// A geometria muda raríssimo → cache longo. Buscamos só quando o mapa pede
// (enabled), já que é um N+1 (ver listNeighborhoodBoundaries). Substitui os
// hexágonos fake que o MapView desenhava em volta de centros chutados à mão.

import { useQuery } from "@tanstack/react-query";
import { listNeighborhoodBoundaries, type NeighborhoodBoundary } from "@/lib/neighborhoods-api";

export function useNeighborhoodBoundaries(enabled = true) {
  const q = useQuery({
    queryKey: ["neighborhood-boundaries"],
    queryFn: listNeighborhoodBoundaries,
    enabled,
    staleTime: 60 * 60 * 1000, // 1h — geometria de bairro é praticamente estática
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });

  return {
    boundaries: (q.data ?? []) as NeighborhoodBoundary[],
    isLoading: q.isLoading,
    isError: q.isError,
  };
}
