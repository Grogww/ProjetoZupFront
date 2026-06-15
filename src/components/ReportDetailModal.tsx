import { useState } from "react";
import { type Report, statusLabels } from "@/data/mockData";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listStatusHistory,
  getOccurrence,
  mapOccurrenceToReport,
  updateOccurrence,
  deleteOccurrence,
} from "@/lib/occurrences-api";
import {
  listEvaluations,
  upvoteOccurrence,
  downvoteOccurrence,
  removeVote,
  type VoteType,
} from "@/lib/evaluations-api";
import { ApiError } from "@/lib/api";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import StatusControl from "./StatusControl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { MapPin, Calendar, Building2, ThumbsUp, ThumbsDown, RefreshCw, Pencil, Trash2, Loader2, Clock } from "lucide-react";

interface ReportDetailModalProps {
  report: Report | null;
  open: boolean;
  onClose: () => void;
}

// Janela em que o autor pode editar/excluir a própria ocorrência (regra de negócio).
const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const ReportDetailModal = ({ report, open, onClose }: ReportDetailModalProps) => {
  const { getCategoryById, getSubcategoryById, organizationName } = useTaxonomy();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [voting, setVoting] = useState(false);

  // Histórico de status REAL do back (item 16). Cai no histórico base (criação)
  // enquanto carrega ou se a rota falhar.
  const historyQ = useQuery({
    queryKey: ["status-history", report?.id],
    queryFn: () => listStatusHistory(report!.id),
    enabled: open && !!report,
    staleTime: 30_000,
  });

  // A listagem (GET /occurrences) não traz o array `media` nem o autor; só o
  // detalhe (GET /occurrences/:id) retorna ambos. Buscamos o detalhe ao abrir
  // para preencher a foto e liberar editar/excluir ao próprio cidadão.
  const detailQ = useQuery({
    queryKey: ["occurrence-detail", report?.id],
    queryFn: async () => mapOccurrenceToReport(await getOccurrence(report!.id)),
    enabled: open && !!report,
    staleTime: 30_000,
  });

  // Voto do próprio usuário (item 7). A lista de evaluations exige auth; só busca
  // quando logado. Usado para marcar o botão ativo e decidir criar/trocar/remover.
  const votesQ = useQuery({
    queryKey: ["evaluations", report?.id],
    queryFn: () => listEvaluations(report!.id),
    enabled: open && !!report && !!user,
    staleTime: 30_000,
  });

  if (!report) return null;

  const category = getCategoryById(report.categoryId);
  const subcategory = getSubcategoryById(report.categoryId, report.subcategoryId);
  const timeline = historyQ.data?.length ? historyQ.data : report.statusHistory;

  // Report "vivo": prefere o detalhe (autoritativo) para refletir mudança de status
  // na hora — o `report` da prop vem da lista do pai e pode ficar defasado até o
  // refetch propagar. O StatusControl e o badge usam este.
  const liveReport = detailQ.data ?? report;

  // Campos editáveis: prefere o detalhe (autoritativo) para refletir edições na hora.
  const imageUrl = detailQ.data?.imageUrl || report.imageUrl;
  const title = detailQ.data?.title ?? report.title;
  const description = detailQ.data?.description ?? report.description;
  const address = detailQ.data?.address ?? report.address;

  // Permissão: autor da ocorrência, dentro da janela de 24h desde a criação.
  const authorId = detailQ.data?.authorId ?? report.authorId ?? null;
  const deadlineMs = new Date(report.createdAt).getTime() + EDIT_WINDOW_MS;
  const within24h = Date.now() < deadlineMs;
  const canManage = !!user && authorId != null && user.id === authorId && within24h;

  // Contadores autoritativos (vêm do detalhe; caem no report da lista enquanto carrega).
  const responsibleOrg = organizationName(detailQ.data?.organizationId ?? report.organizationId);
  const upvotes = detailQ.data?.upvotes ?? report.upvotes;
  const downvotes = detailQ.data?.downvotes ?? report.downvotes;
  const score = detailQ.data?.score ?? report.score;
  const myVote: VoteType | null =
    (user && votesQ.data?.find((e) => e.user_id === user.id)?.vote_type) || null;
  const canVote = liveReport.status !== "closed";

  const startEdit = () => {
    setEditTitle(title);
    setEditDescription(description);
    setEditAddress(address);
    setEditing(true);
  };

  const errMessage = (err: unknown, fallback: string) =>
    err instanceof ApiError ? err.message : fallback;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateOccurrence(report.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        address: editAddress.trim(),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["occurrences"] }),
        detailQ.refetch(),
      ]);
      toast({ title: "Ocorrência atualizada com sucesso!" });
      setEditing(false);
    } catch (err) {
      toast({
        title: "Erro ao atualizar",
        description: errMessage(err, "Não foi possível salvar as alterações."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteOccurrence(report.id);
      await queryClient.invalidateQueries({ queryKey: ["occurrences"] });
      toast({ title: "Ocorrência excluída" });
      setConfirmOpen(false);
      onClose();
    } catch (err) {
      toast({
        title: "Erro ao excluir",
        description: errMessage(err, "Não foi possível excluir a ocorrência."),
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  const handleVote = async (type: VoteType) => {
    if (!user) {
      toast({ title: "Entre para votar", description: "Você precisa estar autenticado para apoiar ou contestar ocorrências." });
      return;
    }
    setVoting(true);
    try {
      // Mesmo voto → remove (toggle off); voto diferente → troca; nenhum → cria.
      if (myVote === type) await removeVote(report.id);
      else if (type === "up") await upvoteOccurrence(report.id);
      else await downvoteOccurrence(report.id);
      await Promise.all([
        detailQ.refetch(),
        votesQ.refetch(),
        queryClient.invalidateQueries({ queryKey: ["occurrences"] }),
      ]);
    } catch (err) {
      const closed = err instanceof ApiError && err.status === 409;
      toast({
        title: "Não foi possível registrar o voto",
        description: closed
          ? "Esta ocorrência está encerrada e não aceita mais votos."
          : errMessage(err, "Tente novamente em instantes."),
        variant: "destructive",
      });
    } finally {
      setVoting(false);
    }
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setEditing(false);
      onClose();
    }
  };

  const editValid = editTitle.trim().length >= 5 && editDescription.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto z-[2000]">
        <DialogHeader>
          <DialogTitle className="text-lg">{editing ? "Editar ocorrência" : title}</DialogTitle>
        </DialogHeader>

        {editing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Título <span className="text-destructive" aria-hidden="true">*</span></Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                aria-invalid={editTitle.trim().length > 0 && editTitle.trim().length < 5}
              />
              <p className="text-xs mt-1 text-muted-foreground">Mínimo de 5 caracteres.</p>
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição <span className="text-destructive" aria-hidden="true">*</span></Label>
              <Textarea
                id="edit-description"
                rows={4}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                aria-invalid={editDescription.trim().length > 0 && editDescription.trim().length < 10}
              />
              <p className="text-xs mt-1 text-muted-foreground">Mínimo de 10 caracteres.</p>
            </div>
            <div>
              <Label htmlFor="edit-address">Endereço</Label>
              <Input
                id="edit-address"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="Rua, número — CEP"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Local no mapa, categoria e fotos não são alterados por aqui.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)} className="flex-1" disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="flex-1" disabled={saving || !editValid}>
                {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>) : "Salvar alterações"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {imageUrl ? (
              <img src={imageUrl} alt={title} className="w-full aspect-video object-cover rounded-lg" />
            ) : (
              <div className="w-full aspect-video rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
                Sem imagem
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={liveReport.status} size="md" />
              <PriorityBadge priority={report.priority} />
              {category && <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">{category.name}</span>}
              {subcategory && <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">{subcategory.name}</span>}
              <StatusControl report={liveReport} className="ml-auto" />
            </div>

            {canManage && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                  Você pode editar ou excluir até {new Date(deadlineMs).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={startEdit} className="gap-1.5">
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmOpen(true)} className="gap-1.5 text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </Button>
                </div>
              </div>
            )}

            {report.isRecurrence && (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-2 flex items-center gap-2 text-xs text-accent">
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>Problema reincidente — {report.recurrenceCount}ª reabertura registrada para este local</span>
              </div>
            )}

            <p className="text-sm text-muted-foreground">{description}</p>

            {address && (
              <div className="text-sm text-muted-foreground flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" /><span>{address}</span>
              </div>
            )}

            <div className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={myVote === "up" ? "default" : "outline"}
                  onClick={() => handleVote("up")}
                  disabled={voting || !canVote}
                  aria-pressed={myVote === "up"}
                  className="gap-1.5"
                >
                  <ThumbsUp className="w-4 h-4" /> {upvotes}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVote("down")}
                  disabled={voting || !canVote}
                  aria-pressed={myVote === "down"}
                  className={`gap-1.5 ${myVote === "down" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive" : ""}`}
                >
                  <ThumbsDown className="w-4 h-4" /> {downvotes}
                </Button>
                <span className="text-xs text-muted-foreground ml-auto">Score {score}</span>
                {voting && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {!canVote
                  ? "Ocorrência encerrada — votos não são mais aceitos."
                  : !user
                    ? "Entre para apoiar ou contestar esta ocorrência."
                    : myVote
                      ? "Clique no mesmo botão para remover seu voto."
                      : "Apoie (👍) ou conteste (👎) esta ocorrência."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" /><span>{report.neighborhood || "Bairro não identificado"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4 shrink-0" /><span>{responsibleOrg}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 shrink-0" /><span>{new Date(report.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-3">Histórico de andamento</h4>
              <div className="space-y-3">
                {timeline.map((entry, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1" />
                      {i < timeline.length - 1 && <div className="w-px h-full bg-border" />}
                    </div>
                    <div className="pb-3">
                      <div className="font-medium text-foreground">{statusLabels[entry.status]}</div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(entry.date).toLocaleDateString('pt-BR')} às {new Date(entry.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {entry.note && <div className="text-muted-foreground mt-0.5">{entry.note}</div>}
                      {entry.by && <div className="text-xs text-primary font-medium mt-0.5">{entry.by}</div>}
                      {entry.reason && <div className="text-xs text-destructive mt-0.5">Motivo: {entry.reason}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => !deleting && setConfirmOpen(o)}>
        <AlertDialogContent className="z-[2100]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta ocorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A ocorrência "{title}" e suas fotos serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Excluindo...</>) : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default ReportDetailModal;
