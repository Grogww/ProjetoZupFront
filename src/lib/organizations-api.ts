// Órgãos/organizações do backend ProjetoZup (item 11) — agora REAIS.
//
// Endpoint (openapi.json): GET /api/organizations → lista de Organization.
// É SOMENTE LEITURA (select): não há cadastro/edição de órgãos pela API.
// A ocorrência referencia o órgão por `assigned_organization_id` (nulo até a
// triagem atribuir). Substitui o antigo mapa hardcoded slug-da-categoria→órgão.

import { api } from "@/lib/api";

export interface BackendOrganization {
  id: number;
  name: string;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function listOrganizations(): Promise<BackendOrganization[]> {
  const data = await api.get<BackendOrganization[] | { data: BackendOrganization[] }>("/organizations", {
    auth: false,
  });
  return Array.isArray(data) ? data : data?.data ?? [];
}
