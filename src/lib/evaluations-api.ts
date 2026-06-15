// Avaliações comunitárias (item 7) — modelo REAL do back: upvote/downvote.
// Substitui o antigo validations-api (convites/validações), que batia em
// endpoints inexistentes (/validation-invites, /validations).
//
// Endpoints (openapi.json):
//   GET    /api/occurrences/:id/evaluations   → lista de votos (auth)
//   POST   /api/occurrences/:id/upvote         → cria/atualiza voto a favor
//   POST   /api/occurrences/:id/downvote       → cria/atualiza voto contra
//   DELETE /api/occurrences/:id/vote           → remove o voto do usuário
// Ocorrências `closed` não aceitam votos (409).

import { api } from "@/lib/api";

export type VoteType = "up" | "down";

export interface Evaluation {
  id: number;
  occurrence_id: number;
  user_id: number;
  vote_type: VoteType;
  created_at: string;
  updated_at: string;
}

export async function listEvaluations(occurrenceId: number | string): Promise<Evaluation[]> {
  const data = await api.get<Evaluation[]>(`/occurrences/${occurrenceId}/evaluations`);
  return Array.isArray(data) ? data : [];
}

export async function upvoteOccurrence(occurrenceId: number | string): Promise<Evaluation> {
  return api.post<Evaluation>(`/occurrences/${occurrenceId}/upvote`);
}

export async function downvoteOccurrence(occurrenceId: number | string): Promise<Evaluation> {
  return api.post<Evaluation>(`/occurrences/${occurrenceId}/downvote`);
}

export async function removeVote(occurrenceId: number | string): Promise<void> {
  await api.delete(`/occurrences/${occurrenceId}/vote`);
}
