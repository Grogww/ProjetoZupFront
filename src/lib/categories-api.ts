// Taxonomia (categorias/subcategorias) do backend ProjetoZup.
// Fonte única da verdade — substitui a lista estática do mockData.
//
// Padrão de ids (ver decisão de adequação):
//   - `id` numérico  → usado na fronteira da API (POST/PATCH /occurrences, ?category_id=)
//   - `slug`         → chave estável para a lógica do front (mapa slug→órgão, lookups)
//   - name/color/icon → exibição

import { api } from "@/lib/api";

export interface BackendCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  is_active?: boolean;
}

export interface BackendSubcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  is_active?: boolean;
}

export async function listCategories(): Promise<BackendCategory[]> {
  const data = await api.get<BackendCategory[] | { data: BackendCategory[] }>("/categories", {
    auth: false,
  });
  return Array.isArray(data) ? data : data?.data ?? [];
}

export async function listSubcategories(): Promise<BackendSubcategory[]> {
  const data = await api.get<BackendSubcategory[] | { data: BackendSubcategory[] }>("/subcategories", {
    auth: false,
  });
  return Array.isArray(data) ? data : data?.data ?? [];
}
