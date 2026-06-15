// Contratos de autenticação/usuários do backend Node (ProjetoZup-main).
// Mantemos os tipos próximos aos do back e mapeamos para o modelo do front.

import { api, tokens } from "@/lib/api";
import type { AppRole, OrganRole } from "@/hooks/useAuth";

export type BackendRole = "citizen" | "agent" | "admin";

export interface BackendUser {
  id: number;
  name: string;
  email: string;
  cpf?: string;
  role: BackendRole;
  avatar_url?: string | null;
  neighborhood_id?: number | null;
  is_active?: boolean;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BackendSession {
  access_token: string;
  refresh_token: string;
  user: BackendUser;
}

function normalizeSession(raw: any): BackendSession {
  if (raw?.session) return raw.session as BackendSession;
  return raw as BackendSession;
}

// Backend (MVP): citizen | agent | admin
// Front (ZUP):  cidadao | prefeitura | agua_saneamento | energia_luz | admin
// O back não tem vínculo agente→órgão (item 17 — stand-by/hardcoded): todo
// `agent` é tratado como prefeitura até o endpoint de organizations existir.
export function mapRoles(user: BackendUser): { roles: AppRole[]; organ: OrganRole | null } {
  if (!user) return { roles: [], organ: null };
  if (user.role === "admin") return { roles: ["admin"], organ: null };
  if (user.role === "agent") return { roles: ["prefeitura"], organ: "prefeitura" };
  return { roles: ["cidadao"], organ: null };
}

export async function loginWithCpf(cpf: string, password: string): Promise<BackendSession> {
  const cpfDigits = cpf.replace(/\D/g, "");
  const raw = await api.post("/auth/login", { cpf: cpfDigits, password }, { auth: false });
  const session = normalizeSession(raw);
  tokens.set(session.access_token, session.refresh_token);
  return session;
}

// Cadastro: o back só aceita name, email, cpf, password e neighborhood_id (item 18).
// phone/cep/2FA são coletados na UI mas NÃO existem no back — não são enviados.
export interface RegisterPayload {
  name: string;
  email: string;
  cpf: string;
  password: string;
  neighborhood_id?: number | null;
}

export async function registerUser(payload: RegisterPayload): Promise<BackendUser> {
  const body: any = {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    cpf: payload.cpf.replace(/\D/g, ""),
    password: payload.password,
  };
  if (payload.neighborhood_id != null) body.neighborhood_id = payload.neighborhood_id;
  return api.post<BackendUser>("/auth/register", body, { auth: false });
}

export async function fetchMe(): Promise<BackendUser> {
  return api.get<BackendUser>("/users/me");
}

// Lista de usuários — exige papel admin (GET /api/users).
export async function listUsers(): Promise<BackendUser[]> {
  const data = await api.get<BackendUser[] | { data: BackendUser[] }>("/users");
  return Array.isArray(data) ? data : data?.data ?? [];
}

export const userRoleLabels: Record<BackendRole, string> = {
  citizen: "Cidadão",
  agent: "Agente",
  admin: "Administrador",
};

// updateMe: o back só suporta name, email, password, avatar_url, neighborhood_id (item 19).
export interface UpdateMePayload {
  name?: string;
  email?: string;
  password?: string;
  avatar_url?: string | null;
  neighborhood_id?: number | null;
}

export async function updateMe(patch: UpdateMePayload): Promise<BackendUser> {
  return api.patch<BackendUser>("/users/me", patch);
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() }, { auth: false });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post("/auth/reset-password", { token, password }, { auth: false });
}

export function logout() {
  tokens.clear();
}
