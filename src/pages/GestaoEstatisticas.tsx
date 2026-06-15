import { useMemo } from "react";
import { Navigate, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, isInstitutional } from "@/hooks/useAuth";
import { organConfig } from "@/data/organConfig";
import { statusLabels, getStatusColor, type ReportStatus } from "@/data/mockData";
import { useOccurrences } from "@/hooks/useOccurrences";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { useResponseTime, useResponseTimeByMonth } from "@/hooks/useStats";
import {
  ShieldCheck, BarChart3, ArrowLeft, Loader2, AlertTriangle, AlertCircle, Clock, CheckCircle2,
  TrendingUp, MapPin, Timer, Percent, RefreshCw, ListChecks
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ['#7C3AED', '#0D9488', '#EAB308', '#EF4444', '#22C55E', '#A855F7', '#F97316', '#0EA5E9'];

// Placeholder para blocos que dependiam de dados fictícios (dashboardStats).
// TODO(API): ligar em GET /api/analytics/* (response-time, by-month).
const ChartPlaceholder = ({ height = 320 }: { height?: number }) => (
  <div
    className="flex flex-col items-center justify-center gap-2 rounded-lg bg-muted/40 text-center text-sm text-muted-foreground"
    style={{ height }}
  >
    <AlertCircle className="w-6 h-6 opacity-60" />
    <p className="font-medium text-foreground">Sem dados</p>
    <p className="text-xs max-w-xs">Pendente de integração com a API (/analytics)</p>
  </div>
);

const GestaoEstatisticas = () => {
  const { user, roles, organ, loading } = useAuth();
  const { reports: allOccurrences } = useOccurrences();
  const { getCategoryById } = useTaxonomy();
  const isAdmin = roles.includes("admin");
  const targetOrgan = organ ?? "prefeitura";

  // Tempos reais (server-side). Obs.: o /analytics/response-time não filtra por
  // órgão, então estes indicadores são da CIDADE (não recortados pela gestão).
  const responseTime = useResponseTime();
  const monthly = useResponseTimeByMonth();

  const reports = useMemo(() => {
    if (!user) return [];
    return isAdmin ? allOccurrences : allOccurrences.filter(r => r.organ === targetOrgan);
  }, [user, isAdmin, targetOrgan, allOccurrences]);

  const kpis = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter(r => ["pending", "awaiting_validation", "validated", "in_analysis"].includes(r.status)).length;
    const inProgress = reports.filter(r => r.status === "in_progress").length;
    const resolved = reports.filter(r => ["resolved", "resolution_validated"].includes(r.status)).length;
    const rejected = reports.filter(r => r.status === "resolution_rejected").length;
    const critical = reports.filter(r => r.priority === "critica").length;
    const recurrent = reports.filter(r => r.isRecurrence).length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const recurrenceRate = total > 0 ? Math.round((recurrent / total) * 100) : 0;
    return { total, pending, inProgress, resolved, rejected, critical, recurrent, resolutionRate, recurrenceRate };
  }, [reports]);

  const byNeighborhood = useMemo(() => {
    const map = new Map<string, { name: string; total: number; resolved: number; pending: number }>();
    reports.forEach(r => {
      const cur = map.get(r.neighborhood) ?? { name: r.neighborhood, total: 0, resolved: 0, pending: 0 };
      cur.total += 1;
      if (["resolved", "resolution_validated"].includes(r.status)) cur.resolved += 1;
      else cur.pending += 1;
      map.set(r.neighborhood, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [reports]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    reports.forEach(r => {
      const name = getCategoryById(r.categoryId)?.name ?? r.categoryId;
      map.set(name, (map.get(name) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [reports, getCategoryById]);

  const byStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => { counts[r.status] = (counts[r.status] ?? 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({
      name: statusLabels[k as ReportStatus] ?? k,
      value: v,
      color: getStatusColor(k as ReportStatus),
    }));
  }, [reports]);

  const byPriority = useMemo(() => {
    const labels: Record<string, { name: string; color: string }> = {
      critica: { name: "Crítica", color: "hsl(0, 84%, 60%)" },
      alta: { name: "Alta", color: "hsl(25, 95%, 53%)" },
      media: { name: "Média", color: "hsl(45, 100%, 51%)" },
      baixa: { name: "Baixa", color: "hsl(210, 14%, 70%)" },
    };
    const counts: Record<string, number> = {};
    reports.forEach(r => { counts[r.priority] = (counts[r.priority] ?? 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: labels[k].name, value: v, color: labels[k].color }));
  }, [reports]);

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
  const scopeLabel = isAdmin ? "todas as gestões" : meta.shortName;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <ShieldCheck className="w-3 h-3 mr-1" /> Estatísticas da Gestão
              </Badge>
              {isAdmin && <Badge variant="secondary">Administrador</Badge>}
            </div>
            <h1 className="text-3xl font-bold text-foreground">Painel de Estatísticas</h1>
            <p className="text-muted-foreground mt-1">Indicadores de desempenho — escopo: {scopeLabel}</p>
          </div>
          <Link to="/gestao">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar à fila
            </Button>
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Total", value: kpis.total, icon: ListChecks, tone: "text-primary" },
            { label: "Pendentes", value: kpis.pending, icon: Clock, tone: "text-[hsl(var(--status-awaiting))]" },
            { label: "Em execução", value: kpis.inProgress, icon: TrendingUp, tone: "text-[hsl(var(--status-execution))]" },
            { label: "Resolvidas", value: kpis.resolved, icon: CheckCircle2, tone: "text-[hsl(var(--status-validated))]" },
            { label: "Rejeitadas", value: kpis.rejected, icon: AlertTriangle, tone: "text-destructive" },
            { label: "Críticas", value: kpis.critical, icon: AlertTriangle, tone: "text-destructive" },
            { label: "Resolução", value: `${kpis.resolutionRate}%`, icon: Percent, tone: "text-[hsl(var(--status-validated))]" },
            { label: "Reincidência", value: `${kpis.recurrenceRate}%`, icon: RefreshCw, tone: "text-accent" },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className={`flex items-center gap-2 text-xs mb-1 ${s.tone}`}>
                  <s.icon className="w-3.5 h-3.5" /> {s.label}
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="neighborhoods">Por bairro</TabsTrigger>
            <TabsTrigger value="categories">Por categoria</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Por status</CardTitle>
                  <CardDescription>Distribuição atual</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={90} label>
                        {byStatus.map((s, i) => <Cell key={i} fill={s.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Por prioridade</CardTitle>
                  <CardDescription>Severidade das ocorrências</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={byPriority} dataKey="value" nameKey="name" outerRadius={90} label>
                        {byPriority.map((s, i) => <Cell key={i} fill={s.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Timer className="w-4 h-4" /> Indicadores operacionais</CardTitle>
                <CardDescription>Tempos reais de /analytics/response-time (escopo: cidade)</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Tempo médio de resolução</p>
                  <p className="text-xl font-bold">{responseTime.avgResolutionDays}d</p>
                  <p className="text-[11px] text-muted-foreground">mediana {responseTime.medianResolutionDays}d · {responseTime.sampleResolution} casos</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">1ª resposta média</p>
                  <p className="text-xl font-bold">{responseTime.avgResponseDays}d</p>
                  <p className="text-[11px] text-muted-foreground">mediana {responseTime.medianResponseDays}d · {responseTime.sampleResponse} casos</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taxa de resolução</p>
                  <p className="text-xl font-bold">{kpis.resolutionRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reincidências</p>
                  <p className="text-xl font-bold">{kpis.recurrent}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NEIGHBORHOODS */}
          <TabsContent value="neighborhoods" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" /> Ocorrências por bairro</CardTitle>
                <CardDescription>Total, resolvidas e pendentes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(280, byNeighborhood.length * 28)}>
                  <BarChart data={byNeighborhood} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="resolved" stackId="a" fill="#22C55E" name="Resolvidas" />
                    <Bar dataKey="pending" stackId="a" fill="#EAB308" name="Pendentes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CATEGORIES */}
          <TabsContent value="categories" className="space-y-4 mt-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Por categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={byCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#7C3AED" name="Ocorrências" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribuição</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={100} label>
                        {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TRENDS */}
          <TabsContent value="trends" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Tempos médios por mês</CardTitle>
                <CardDescription>1ª resposta e resolução (dias) — /analytics/response-time?group_by=month</CardDescription>
              </CardHeader>
              <CardContent>
                {monthly.data.length ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={monthly.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgResponseDays" fill="#0EA5E9" radius={[4, 4, 0, 0]} name="1ª resposta (d)" />
                      <Bar dataKey="avgResolutionDays" fill="#22C55E" radius={[4, 4, 0, 0]} name="Resolução (d)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartPlaceholder />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GestaoEstatisticas;
