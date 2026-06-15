// Bairros do backend Node (ProjetoZup). Por enquanto usamos apenas o geofencing
// /neighborhoods/locate para resolver o bairro a partir de um ponto (lat/lng),
// substituindo o autocomplete de endereço do Google Places.

import { api } from "@/lib/api";
import type { Geometry } from "geojson";

export interface NeighborhoodSummary {
  id: number;
  name: string;
  population_estimate?: number | null;
}

// Detalhe (GET /neighborhoods/:id): aqui o back devolve a GEOMETRIA REAL via
// ST_AsGeoJSON — `boundary` (polígono do bairro) e `center_point`. A listagem
// NÃO traz isso.
export interface NeighborhoodDetail extends NeighborhoodSummary {
  boundary: Geometry | null;
  center_point: Geometry | null;
  created_at?: string;
  updated_at?: string;
}

export interface NeighborhoodBoundary {
  id: number;
  name: string;
  boundary: Geometry;
}

/** GET /api/neighborhoods — lista de bairros cadastrados (Videira/SC). */
export async function listNeighborhoods(): Promise<NeighborhoodSummary[]> {
  const data = await api.get<NeighborhoodSummary[] | { data: NeighborhoodSummary[] }>(
    "/neighborhoods",
    { auth: false }
  );
  return Array.isArray(data) ? data : data?.data ?? [];
}

/** GET /api/neighborhoods/:id — detalhe com geometria real (boundary/center_point em GeoJSON). */
export async function getNeighborhood(id: number): Promise<NeighborhoodDetail> {
  return api.get<NeighborhoodDetail>(`/neighborhoods/${id}`, { auth: false });
}

/**
 * Contornos reais de TODOS os bairros (polígonos do PostGIS).
 *
 * ATENÇÃO — é N+1 de propósito: a listagem (GET /neighborhoods) não traz geometria,
 * só o detalhe (GET /neighborhoods/:id) traz `boundary`. Então buscamos a lista e,
 * em paralelo, um detalhe por bairro. Para Videira (~15 bairros) é aceitável e roda
 * uma vez (cache longo no hook). O ideal/definitivo é o back expor `boundary` já na
 * listagem (ou um GET /neighborhoods/boundaries em FeatureCollection) — aí cai p/ 1 req.
 */
export async function listNeighborhoodBoundaries(): Promise<NeighborhoodBoundary[]> {
  const list = await listNeighborhoods();
  const details = await Promise.all(
    list.map(async (n) => {
      try {
        const d = await getNeighborhood(n.id);
        return d.boundary ? { id: n.id, name: n.name, boundary: d.boundary } : null;
      } catch {
        return null; // bairro sem geometria ou falha pontual não derruba o resto
      }
    })
  );
  return details.filter((d): d is NeighborhoodBoundary => d !== null);
}

/**
 * GET /api/neighborhoods/locate?lat=&lng=
 * Resolve a coordenada para o bairro cujo polígono a contém (ST_Contains, PostGIS).
 * Retorna null quando o ponto não cai em nenhum bairro (404) ou em erro de rede.
 */
export async function locateNeighborhood(
  lat: number,
  lng: number
): Promise<NeighborhoodSummary | null> {
  try {
    return await api.get<NeighborhoodSummary>("/neighborhoods/locate", {
      query: { lat, lng },
      auth: false,
    });
  } catch {
    return null;
  }
}
