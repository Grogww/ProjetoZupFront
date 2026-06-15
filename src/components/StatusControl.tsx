// Controle de mudança de status das ocorrências (uso da gestão).
//
// Espelha a máquina de estados REAL do back (mockData.STATUS_TRANSITIONS): só
// oferece os próximos status válidos a partir do estado atual. Estado terminal
// (`closed`) não tem transição — nesse caso oferece a REABERTURA (cria nova
// ocorrência encadeada). Trata o 409 do back (transição inválida) com toast.
//
// ATENÇÃO (gating só cosmético): a rota PATCH /occurrences/:id/status do back NÃO
// tem requireRole — qualquer usuário autenticado consegue mudar status pela API.
// Aqui escondemos o controle para quem não é institucional, mas a restrição real
// precisa ser feita NO BACK.

import { useState } from "react";
import {
  type Report,
  type ReportStatus,
  statusLabels,
  nextStatuses,
  isTerminalStatus,
} from "@/data/mockData";
import { useAuth, isInstitutional } from "@/hooks/useAuth";
import { useUpdateOccurrenceStatus, useReopenOccurrence } from "@/hooks/useOccurrences";
import { ApiError } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Loader2, RefreshCw } from "lucide-react";

interface StatusControlProps {
  report: Report;
  size?: "sm" | "default";
  className?: string;
  /** Disparado após uma mudança de status / reabertura bem-sucedida. */
  onChanged?: () => void;
}

const REOPEN_MIN_REASON = 5;

const statusLabel = (s?: string | null) =>
  (s && statusLabels[s as ReportStatus]) || s || "—";

const StatusControl = ({ report, size = "sm", className, onChanged }: StatusControlProps) => {
  const { roles } = useAuth();
  const updateStatus = useUpdateOccurrenceStatus();
  const reopen = useReopenOccurrence();

  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  // Gating cosmético: só a gestão/admin vê o controle (back não restringe — ver topo).
  if (!isInstitutional(roles)) return null;

  const options = nextStatuses(report.status);
  const terminal = isTerminalStatus(report.status);
  const busy = updateStatus.isPending || reopen.isPending;

  const handleSelect = (status: ReportStatus) => {
    updateStatus.mutate(
      { id: report.id, status },
      {
        onSuccess: () => {
          toast({ title: `Status atualizado para "${statusLabels[status]}".` });
          onChanged?.();
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) {
            const d = err.data?.details as
              | { from?: string; to?: string; allowed?: string[] }
              | undefined;
            toast({
              title: "Transição não permitida",
              description:
                d?.from && d?.to
                  ? `Não é possível ir de "${statusLabel(d.from)}" para "${statusLabel(d.to)}".`
                  : "Esta mudança de status não é permitida pela máquina de estados.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erro ao atualizar status",
              description: err instanceof ApiError ? err.message : "Tente novamente em instantes.",
              variant: "destructive",
            });
          }
        },
      }
    );
  };

  const handleReopen = () => {
    const reason = reopenReason.trim();
    if (reason.length < REOPEN_MIN_REASON) return;
    reopen.mutate(
      { id: report.id, reason },
      {
        onSuccess: () => {
          toast({
            title: "Ocorrência reaberta",
            description: "Uma nova ocorrência encadeada foi criada a partir desta.",
          });
          setReopenOpen(false);
          setReopenReason("");
          onChanged?.();
        },
        onError: (err) => {
          toast({
            title: "Não foi possível reabrir",
            description: err instanceof ApiError ? err.message : "Tente novamente em instantes.",
            variant: "destructive",
          });
        },
      }
    );
  };

  // Estado terminal (encerrada): a única ação é reabrir.
  if (terminal) {
    return (
      <>
        <Button
          variant="outline"
          size={size}
          className={className}
          disabled={busy}
          onClick={() => setReopenOpen(true)}
        >
          {reopen.isPending ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-1.5" />
          )}
          Reabrir
        </Button>
        <ReopenDialog
          open={reopenOpen}
          onOpenChange={(o) => !reopen.isPending && setReopenOpen(o)}
          reason={reopenReason}
          setReason={setReopenReason}
          onConfirm={handleReopen}
          pending={reopen.isPending}
        />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} className={className} disabled={busy}>
          {updateStatus.isPending ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : null}
          Alterar status
          <ChevronDown className="w-4 h-4 ml-1.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[2200] w-56">
        <DropdownMenuLabel>Avançar para</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((s) => (
          <DropdownMenuItem
            key={s}
            onSelect={() => handleSelect(s)}
            className={s === "closed" || s === "resolution_rejected" ? "text-destructive focus:text-destructive" : ""}
          >
            {statusLabels[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface ReopenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  setReason: (v: string) => void;
  onConfirm: () => void;
  pending: boolean;
}

const ReopenDialog = ({ open, onOpenChange, reason, setReason, onConfirm, pending }: ReopenDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="z-[2200]">
      <AlertDialogHeader>
        <AlertDialogTitle>Reabrir ocorrência?</AlertDialogTitle>
        <AlertDialogDescription>
          Isso cria uma nova ocorrência encadeada (reincidência) a partir desta. Informe o motivo da
          reabertura.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="reopen-reason">
          Motivo <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Textarea
          id="reopen-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex.: problema voltou a ocorrer no mesmo local"
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">Mínimo de {REOPEN_MIN_REASON} caracteres.</p>
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
        <Button onClick={onConfirm} disabled={pending || reason.trim().length < REOPEN_MIN_REASON}>
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reabrindo...
            </>
          ) : (
            "Reabrir"
          )}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default StatusControl;
