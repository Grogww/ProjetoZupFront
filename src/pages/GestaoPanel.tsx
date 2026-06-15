import { useMemo } from "react";
import { Navigate, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth, isInstitutional } from "@/hooks/useAuth";
import { organConfig } from "@/data/organConfig";
import { useOccurrences } from "@/hooks/useOccurrences";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { ShieldCheck, ListChecks, BarChart3, Clock, AlertTriangle, LogOut, Loader2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import StatusControl from "@/components/StatusControl";

const GestaoPanel = () => {
  const { user, roles, organ, loading, signOut } = useAuth();
  const { reports } = useOccurrences();
  const { getCategoryById } = useTaxonomy();

  const isAdmin = roles.includes("admin");
  const targetOrgan = organ ?? "prefeitura";

  const queue = useMemo(() => {
    if (!user) return [];
    const list = isAdmin ? reports : reports.filter(r => r.organ === targetOrgan);
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [user, isAdmin, targetOrgan, reports]);

  const stats = useMemo(() => {
    const total = queue.length;
    const pending = queue.filter(r => ["pending", "awaiting_validation", "validated", "in_analysis"].includes(r.status)).length;
    const inProgress = queue.filter(r => r.status === "in_progress").length;
    const resolved = queue.filter(r => ["resolved", "resolution_validated"].includes(r.status)).length;
    const critical = queue.filter(r => r.priority === "critica").length;
    return { total, pending, inProgress, resolved, critical };
  }, [queue]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/gestao/login" replace />;
  if (!isInstitutional(roles)) return <Navigate to="/gestao/login" state={{ reason: "no_access" }} replace />;

  const meta = organConfig[targetOrgan];
  const getCategoryName = (id: string) => getCategoryById(id)?.name ?? id;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <ShieldCheck className="w-3 h-3 mr-1" /> Acesso institucional
              </Badge>
              {isAdmin && <Badge variant="secondary">Administrador</Badge>}
            </div>
            <h1 className="text-3xl font-bold text-foreground">{isAdmin ? "Painel Administrativo" : meta.name}</h1>
            <p className="text-muted-foreground mt-1">{isAdmin ? "Visão geral de todas as gestões" : meta.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/gestao/estatisticas">
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" /> Estatísticas
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><ListChecks className="w-3.5 h-3.5" /> Total</div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Clock className="w-3.5 h-3.5" /> Pendentes</div>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><BarChart3 className="w-3.5 h-3.5" /> Em execução</div>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><ShieldCheck className="w-3.5 h-3.5" /> Resolvidos</div>
              <p className="text-2xl font-bold">{stats.resolved}</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-destructive text-xs mb-1"><AlertTriangle className="w-3.5 h-3.5" /> Críticas</div>
              <p className="text-2xl font-bold text-destructive">{stats.critical}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fila de ocorrências</CardTitle>
            <CardDescription>
              {isAdmin ? "Todas as ocorrências da plataforma" : `Ocorrências sob responsabilidade de ${meta.shortName}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queue.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma ocorrência na fila.</p>
            ) : (
              <div className="space-y-2">
                {queue.slice(0, 20).map(r => (
                  <div
                    key={r.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.neighborhood} · {getCategoryName(r.categoryId)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <PriorityBadge priority={r.priority} />
                      <StatusBadge status={r.status} />
                      <StatusControl report={r} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GestaoPanel;
