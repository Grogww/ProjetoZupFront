// Taxonomia viva (categorias, subcategorias e bairros) vinda da API do back
// (itens 2, 12, 26). Substitui as listas hardcoded do mockData. React-query
// deduplica/cacheia, então qualquer componente pode chamar useTaxonomy().
//
// Órgãos REAIS (item 11): vêm de GET /organizations via `organizations`,
// `organizationById` e `organizationName` (cai em "Não atribuído" quando nulo).
// `categoryOrgan`/`Category.organ` (OrganType derivado do slug) seguem como
// legado, pois alguns painéis ainda dependem dele (o back não vincula
// agente→organização nem categoria→organização).

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCategories, listSubcategories } from "@/lib/categories-api";
import { listNeighborhoods } from "@/lib/neighborhoods-api";
import { listOrganizations } from "@/lib/organizations-api";
import {
  type Category,
  type Subcategory,
  type Neighborhood,
  type Organization,
  type OrganType,
  categoryOrganBySlug,
  UNASSIGNED_ORGAN_LABEL,
} from "@/data/mockData";

const ONE_HOUR = 60 * 60 * 1000;

export interface Taxonomy {
  categories: Category[];
  neighborhoods: Neighborhood[];
  neighborhoodNames: string[];
  organizations: Organization[];
  isLoading: boolean;
  isError: boolean;
  getCategoryById: (id: number | string | null | undefined) => Category | undefined;
  getSubcategoryById: (
    categoryId: number | string | null | undefined,
    subcategoryId: number | string | null | undefined
  ) => Subcategory | undefined;
  categoryOrgan: (id: number | string | null | undefined) => OrganType;
  neighborhoodById: (id: number | null | undefined) => Neighborhood | undefined;
  neighborhoodByName: (name: string) => Neighborhood | undefined;
  organizationById: (id: number | null | undefined) => Organization | undefined;
  /** Nome do órgão real; "Não atribuído" quando id é nulo/desconhecido. */
  organizationName: (id: number | null | undefined) => string;
}

const num = (v: number | string | null | undefined) =>
  v === null || v === undefined || v === "" ? NaN : Number(v);

export function useTaxonomy(): Taxonomy {
  const catsQ = useQuery({ queryKey: ["categories"], queryFn: listCategories, staleTime: ONE_HOUR });
  const subsQ = useQuery({ queryKey: ["subcategories"], queryFn: listSubcategories, staleTime: ONE_HOUR });
  const nbsQ = useQuery({ queryKey: ["neighborhoods"], queryFn: listNeighborhoods, staleTime: ONE_HOUR });
  const orgsQ = useQuery({ queryKey: ["organizations"], queryFn: listOrganizations, staleTime: ONE_HOUR });

  const cats = catsQ.data;
  const subs = subsQ.data;
  const nbs = nbsQ.data;
  const orgs = orgsQ.data;

  const categories = useMemo<Category[]>(() => {
    return (cats ?? [])
      .filter((c) => c.is_active !== false)
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        organ: categoryOrganBySlug(c.slug),
        subcategories: (subs ?? [])
          .filter((s) => s.category_id === c.id && s.is_active !== false)
          .map<Subcategory>((s) => ({ id: s.id, slug: s.slug, name: s.name, categoryId: s.category_id })),
      }));
  }, [cats, subs]);

  const neighborhoods = useMemo<Neighborhood[]>(
    () => (nbs ?? []).map((n) => ({ id: n.id, name: n.name, populationEstimate: n.population_estimate ?? null })),
    [nbs]
  );

  const organizations = useMemo<Organization[]>(
    () =>
      (orgs ?? [])
        .filter((o) => o.is_active !== false)
        .map((o) => ({
          id: o.id,
          name: o.name,
          description: o.description ?? null,
          contactEmail: o.contact_email ?? null,
          contactPhone: o.contact_phone ?? null,
          isActive: o.is_active !== false,
        })),
    [orgs]
  );

  const getCategoryById = useCallback<Taxonomy["getCategoryById"]>(
    (id) => {
      const n = num(id);
      return Number.isNaN(n) ? undefined : categories.find((c) => c.id === n);
    },
    [categories]
  );

  const getSubcategoryById = useCallback<Taxonomy["getSubcategoryById"]>(
    (categoryId, subcategoryId) => {
      const sn = num(subcategoryId);
      if (Number.isNaN(sn)) return undefined;
      for (const c of categories) {
        const found = c.subcategories.find((s) => s.id === sn);
        if (found) return found;
      }
      return undefined;
    },
    [categories]
  );

  const categoryOrgan = useCallback<Taxonomy["categoryOrgan"]>(
    (id) => getCategoryById(id)?.organ ?? "prefeitura",
    [getCategoryById]
  );

  const neighborhoodById = useCallback<Taxonomy["neighborhoodById"]>(
    (id) => (id === null || id === undefined ? undefined : neighborhoods.find((n) => n.id === id)),
    [neighborhoods]
  );

  const neighborhoodByName = useCallback<Taxonomy["neighborhoodByName"]>(
    (name) => neighborhoods.find((n) => n.name.toLowerCase() === name.toLowerCase()),
    [neighborhoods]
  );

  const neighborhoodNames = useMemo(() => neighborhoods.map((n) => n.name), [neighborhoods]);

  const organizationById = useCallback<Taxonomy["organizationById"]>(
    (id) => (id === null || id === undefined ? undefined : organizations.find((o) => o.id === id)),
    [organizations]
  );

  const organizationName = useCallback<Taxonomy["organizationName"]>(
    (id) => organizationById(id)?.name ?? UNASSIGNED_ORGAN_LABEL,
    [organizationById]
  );

  return {
    categories,
    neighborhoods,
    neighborhoodNames,
    organizations,
    isLoading: catsQ.isLoading || subsQ.isLoading || nbsQ.isLoading || orgsQ.isLoading,
    isError: catsQ.isError || subsQ.isError || nbsQ.isError || orgsQ.isError,
    getCategoryById,
    getSubcategoryById,
    categoryOrgan,
    neighborhoodById,
    neighborhoodByName,
    organizationById,
    organizationName,
  };
}
