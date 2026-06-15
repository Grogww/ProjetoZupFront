import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Seo from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { currentMunicipality } from "@/data/mockData";
import { useOccurrences } from "@/hooks/useOccurrences";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";
import {
  AlertTriangle, CheckCircle2, Clock, TrendingUp, MapPin, Timer, Percent,
  XCircle, RefreshCw, Flame, Thermometer, Users, ListChecks, ShieldQuestion,
  Sparkles, ArrowUpRight, ArrowDownRight, AlertCircle,
} from "lucide-react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import {
  useCityOverview, useNeighborhoodStats, useCategoryStats, useValidationStats, useAnalyticsOverview,
  useAnalyticsByNeighborhood, useResponseTimeByMonth, useHeatmap,
} from "@/hooks/useStats";

const COLORS = ['#7C3AED', '#0D9488', '#EAB308', '#EF4444', '#22C55E', '#A855F7', '#F97316', '#0EA5E9'];

// ----- Mapa de calor em Leaflet + leaflet.heat sobre tiles do OpenStreetMap.
function HeatLayer({ points }: { points: Array<{ lat: number; lng: number; weight?: number }> }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const layer = (L as any).heatLayer(
      points.map((p) => [p.lat, p.lng, p.weight ?? 0.6]),
      {
        radius: 30,
        blur: 20,
        gradient: {
          0.0: 'rgba(124,58,237,0)',
          0.2: 'rgba(124,58,237,0.6)',
          0.4: 'rgba(168,85,247,0.7)',
          0.6: 'rgba(234,179,8,0.8)',
          0.8: 'rgba(249,115,22,0.9)',
          1.0: 'rgba(239,68,68,1)',
        },
      }
    );
    layer.addTo(map);
    return () => { map.removeLayer(layer); };
  }, [map, points]);
  return null;
}

const HeatmapView = ({ points }: { points: Array<{ lat: number; lng: number }> }) => (
  // isolate z-0 mantém o mapa contido abaixo de modais/dropdowns.
  <div className="relative isolate z-0 w-full h-[500px] rounded-lg overflow-hidden bg-muted">
    <MapContainer
      center={currentMunicipality.center}
      zoom={currentMunicipality.zoom}
      scrollWheelZoom
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <HeatLayer points={points} />
    </MapContainer>
  </div>
);

// Placeholder para blocos que dependiam de dados fictícios (dashboardStats).
// TODO(API): ligar em GET /api/analytics/* (overview, by-neighborhood, response-time).
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

const Kpi = ({ label, value, icon: Icon, accent = "text-primary", trend }: any) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-5 h-5 ${accent} opacity-80`} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
      {trend != null && (
        <p className={`text-xs mt-1 flex items-center gap-1 ${trend >= 0 ? 'text-[hsl(var(--status-validated))]' : 'text-destructive'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}% vs período anterior
        </p>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [period, setPeriod] = useState("6m");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");
  const { reports } = useOccurrences();
  const { neighborhoodNames, categories } = useTaxonomy();
  const overview = useCityOverview();
  const analytics = useAnalyticsOverview(); // KPIs reais do /analytics/overview (item 13)
  const byNeighborhood = useNeighborhoodStats();
  const byCategory = useCategoryStats();
  const validation = useValidationStats();

  // O seletor de período agora filtra os recortes REAIS do /analytics (via `from`).
  const periodFrom = useMemo(() => {
    const months: Record<string, number> = { "1m": 1, "3m": 3, "6m": 6, "1y": 12 };
    const d = new Date();
    d.setMonth(d.getMonth() - (months[period] ?? 6));
    return d.toISOString().slice(0, 10);
  }, [period]);

  // Recortes server-side (completos), substituem os antigos ChartPlaceholder.
  const analyticsNeighborhood = useAnalyticsByNeighborhood({ from: periodFrom });
  const monthly = useResponseTimeByMonth({ from: periodFrom });
  const heat = useHeatmap({ limit: 5000 });

  // Ocorrências por bairro (top 12 por volume); o bucket sem bairro vira "Sem bairro".
  const occByNeighborhood = useMemo(
    () =>
      [...analyticsNeighborhood.data]
        .map((n) => ({ name: n.name ?? "Sem bairro", total: n.total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 12),
    [analyticsNeighborhood.data]
  );

  // Distribuição por grupo de status (do /analytics/overview).
  const statusDistribution = useMemo(
    () => [
      { name: "Em aberto", value: analytics.open, fill: "hsl(var(--status-analysis))" },
      { name: "Resolvidas", value: analytics.resolved, fill: "hsl(var(--status-validated))" },
      { name: "Encerradas s/ resolver", value: analytics.closedUnresolved, fill: "hsl(var(--destructive))" },
    ],
    [analytics.open, analytics.resolved, analytics.closedUnresolved]
  );

  const neighborhoodsByUnresolved = useMemo(() => [...byNeighborhood].sort((a, b) => b.pending - a.pending), [byNeighborhood]);
  const neighborhoodsByRecurrence = useMemo(() => [...byNeighborhood].filter(n => n.recurrent > 0).sort((a, b) => b.recurrent - a.recurrent), [byNeighborhood]);
  const neighborhoodsByVandalism = useMemo(() => [...byNeighborhood].filter(n => n.vandalism > 0).sort((a, b) => b.vandalism - a.vandalism), [byNeighborhood]);
  const neighborhoodsByLighting = useMemo(() => [...byNeighborhood].filter(n => n.lighting > 0).sort((a, b) => b.lighting - a.lighting), [byNeighborhood]);
  const neighborhoodsByEfficiency = useMemo(() => [...byNeighborhood].filter(n => n.total >= 2).sort((a, b) => b.resolutionRate - a.resolutionRate), [byNeighborhood]);

  // Mapa de calor REAL (/analytics/heatmap, com weight). Cai na amostra local só se vier vazio.
  const heatmapPoints = useMemo(
    () => (heat.points.length ? heat.points : reports.map((r) => ({ lat: r.lat, lng: r.lng, weight: 1 }))),
    [heat.points, reports]
  );
  const uniqueReporters = useMemo(() => new Set(reports.map(r => (r as any).author_id ?? r.id)).size, [reports]);

  // Vandalismo
  const vandalismSubcat = useMemo(() => {
    const sub = categories.find(c => c.slug?.includes("vandalismo"))?.subcategories ?? [];
    return sub.map(s => ({
      name: s.name,
      value: reports.filter(r => r.subcategoryId === String(s.id)).length,
    }));
  }, [reports, categories]);

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Minha Cidade — Estatísticas Públicas de Videira/SC" description="Dashboard público da ZUP com estatísticas de zeladoria urbana, bairros, categorias e tempo médio de resolução em Videira/SC." path="/minha-cidade" />
      <Navbar />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">Minha Cidade</h1>
            <p className="text-muted-foreground text-sm">Estatísticas públicas de zeladoria urbana — Videira/SC</p>
          </div>
          <div className="flex gap-2">
            <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
              <SelectTrigger className="w-[160px]">
                <MapPin className="w-4 h-4 mr-1" /><SelectValue placeholder="Bairro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os bairros</SelectItem>
                {neighborhoodNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Último mês</SelectItem>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="1y">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="bairros">Bairros</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="pendentes">Pendências</TabsTrigger>
            <TabsTrigger value="resolvidas">Resolvidas</TabsTrigger>
            <TabsTrigger value="reincidencia">Reincidência</TabsTrigger>
            <TabsTrigger value="validacao">Validação</TabsTrigger>
            <TabsTrigger value="participacao">Participação</TabsTrigger>
            <TabsTrigger value="heatmap">Mapa de Calor</TabsTrigger>
          </TabsList>

          {/* ====== VISÃO GERAL ====== */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* KPIs globais vindos de /analytics/overview (item 13). Os recortes
                temporais (hoje/semana/mês) seguem do agregado local. */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Kpi label="Total" value={analytics.total || overview.total} icon={ListChecks} />
              <Kpi label="Em aberto" value={analytics.open || overview.active} icon={Clock} accent="text-[hsl(var(--status-analysis))]" />
              <Kpi label="Resolvidas" value={analytics.resolved || overview.resolved} icon={CheckCircle2} accent="text-[hsl(var(--status-validated))]" />
              <Kpi label="Encerradas s/ resolver" value={analytics.closedUnresolved} icon={XCircle} accent="text-destructive" />
              <Kpi label="Taxa resolução" value={`${analytics.resolutionRate || overview.resolutionRate}%`} icon={Percent} accent="text-[hsl(var(--status-validated))]" />
              <Kpi label="Tempo médio resol." value={`${analytics.avgResolutionDays || overview.avgResolutionDays}d`} icon={Timer} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="Hoje" value={overview.todayCount} icon={Sparkles} />
              <Kpi label="Esta semana" value={overview.weekCount} icon={Sparkles} />
              <Kpi label="Este mês" value={overview.monthCount} icon={Sparkles} trend={overview.growthPct} />
              <Kpi label="1ª resposta média" value={`${analytics.avgResponseDays || overview.avgResponseDays}d`} icon={Timer} accent="text-[hsl(var(--status-execution))]" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" /> Ocorrências por bairro</CardTitle></CardHeader>
                <CardContent>
                  {occByNeighborhood.length ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={occByNeighborhood} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Ocorrências" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartPlaceholder />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Distribuição por status</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={statusDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Ocorrências">
                        {statusDistribution.map((s, i) => <Cell key={i} fill={s.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tempos médios por mês</CardTitle>
                <p className="text-xs text-muted-foreground">1ª resposta e resolução (em dias), de /analytics/response-time.</p>
              </CardHeader>
              <CardContent>
                {monthly.data.length ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthly.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                      <Legend />
                      <Bar dataKey="avgResponseDays" fill="hsl(var(--status-execution))" radius={[4, 4, 0, 0]} name="1ª resposta (d)" />
                      <Bar dataKey="avgResolutionDays" fill="hsl(var(--status-validated))" radius={[4, 4, 0, 0]} name="Resolução (d)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartPlaceholder height={280} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== BAIRROS ====== */}
          <TabsContent value="bairros" className="space-y-6 mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-destructive" /> Bairro mais crítico</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{neighborhoodsByUnresolved[0]?.name}</p><p className="text-sm text-muted-foreground">{neighborhoodsByUnresolved[0]?.pending} pendências</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[hsl(var(--status-validated))]" /> Mais eficiente</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{neighborhoodsByEfficiency[0]?.name ?? '—'}</p><p className="text-sm text-muted-foreground">{neighborhoodsByEfficiency[0]?.resolutionRate ?? 0}% resolução</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4 text-accent" /> Mais reincidente</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{neighborhoodsByRecurrence[0]?.name ?? '—'}</p><p className="text-sm text-muted-foreground">{neighborhoodsByRecurrence[0]?.recurrent ?? 0} casos</p></CardContent></Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Ranking completo de bairros</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 px-2">Bairro</th><th className="text-right py-2 px-2">Total</th>
                      <th className="text-right py-2 px-2">Resolvidas</th><th className="text-right py-2 px-2">Pendentes</th>
                      <th className="text-right py-2 px-2">Reincidência</th><th className="text-right py-2 px-2">Taxa</th>
                    </tr></thead>
                    <tbody>{byNeighborhood.map(n => (
                      <tr key={n.name} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-2 px-2 font-medium">{n.name}</td>
                        <td className="text-right py-2 px-2">{n.total}</td>
                        <td className="text-right py-2 px-2 text-[hsl(var(--status-validated))]">{n.resolved}</td>
                        <td className="text-right py-2 px-2 text-destructive">{n.pending}</td>
                        <td className="text-right py-2 px-2 text-accent">{n.recurrent}</td>
                        <td className="text-right py-2 px-2">{n.resolutionRate}%</td>
                      </tr>))}</tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Vandalismo por bairro</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={neighborhoodsByVandalism} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} /><YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip /><Bar dataKey="vandalism" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Iluminação por bairro</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={neighborhoodsByLighting} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} /><YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip /><Bar dataKey="lighting" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ====== CATEGORIAS ====== */}
          <TabsContent value="categorias" className="space-y-6 mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Volume por categoria</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={byCategory} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="name" type="category" width={170} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Total" />
                    <Bar dataKey="resolved" fill="hsl(var(--status-validated))" radius={[0, 4, 4, 0]} name="Resolvidas" />
                    <Bar dataKey="pending" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} name="Pendentes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-accent" /> Vandalismo — detalhamento</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vandalismSubcat.map(s => (
                    <div key={s.name} className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-3xl font-extrabold text-accent">{s.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{s.name}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== PENDÊNCIAS ====== */}
          <TabsContent value="pendentes" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="Pendentes" value={overview.unresolved} icon={XCircle} accent="text-destructive" />
              <Kpi label="Em análise" value={overview.inAnalysis} icon={Clock} accent="text-[hsl(var(--status-analysis))]" />
              <Kpi label="Em execução" value={overview.inExecution} icon={TrendingUp} accent="text-[hsl(var(--status-execution))]" />
              <Kpi label="Aguard. validação" value={overview.awaitingValidation} icon={ShieldQuestion} accent="text-accent" />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Flame className="w-4 h-4 text-destructive" /> Bairros com mais pendências</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={neighborhoodsByUnresolved} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Bar dataKey="pending" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} name="Pendentes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== RESOLVIDAS ====== */}
          <TabsContent value="resolvidas" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="Resolvidas" value={overview.resolved} icon={CheckCircle2} accent="text-[hsl(var(--status-validated))]" />
              <Kpi label="Validadas pela comunidade" value={overview.resolutionValidated} icon={CheckCircle2} accent="text-[hsl(var(--status-validated))]" />
              <Kpi label="Rejeitadas" value={overview.resolutionRejected} icon={XCircle} accent="text-destructive" />
              <Kpi label="Tempo médio" value={`${overview.avgResolutionDays}d`} icon={Timer} />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Bairros mais eficientes em resolução</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={neighborhoodsByEfficiency} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="resolutionRate" fill="hsl(var(--status-validated))" radius={[0, 4, 4, 0]} name="Taxa de resolução %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== REINCIDÊNCIA ====== */}
          <TabsContent value="reincidencia" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Recorrência real via /analytics/overview (item 13/24) */}
              <Kpi label="Problemas reabertos" value={analytics.reopenedProblems} icon={RefreshCw} accent="text-accent" />
              <Kpi label="Taxa reincidência" value={`${analytics.recurrenceRate}%`} icon={Percent} accent="text-accent" />
              <Kpi label="Bairro + reincidente" value={neighborhoodsByRecurrence[0]?.name ?? '—'} icon={MapPin} />
              <Kpi label="Casos no bairro" value={neighborhoodsByRecurrence[0]?.recurrent ?? 0} icon={AlertTriangle} accent="text-accent" />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Reincidência por bairro</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={neighborhoodsByRecurrence}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Bar dataKey="recurrent" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Reincidências" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== VALIDAÇÃO ====== */}
          <TabsContent value="validacao" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="Aguardando validação" value={validation.awaiting} icon={ShieldQuestion} accent="text-accent" />
              <Kpi label="Total de apoios (upvotes)" value={validation.totalValidations} icon={CheckCircle2} accent="text-[hsl(var(--status-validated))]" />
              <Kpi label="Score acumulado" value={validation.totalScore} icon={Users} />
              <Kpi label="Média de apoios/caso" value={validation.avgValidatorsPerReport} icon={Users} />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Como funciona a validação comunitária</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>A comunidade avalia cada ocorrência com <strong>upvote</strong> (apoio) ou <strong>downvote</strong> (contestação).</p>
                <p>O <strong>score</strong> (apoios menos contestações) indica a relevância percebida do problema.</p>
                <p>Ocorrências encerradas não aceitam mais votos.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== PARTICIPAÇÃO ====== */}
          <TabsContent value="participacao" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="Reportadores únicos" value={uniqueReporters} icon={Users} />
              <Kpi label="Casos reportados" value={overview.total} icon={ListChecks} />
              <Kpi label="Validadores ativos" value={validation.totalValidations} icon={CheckCircle2} />
              <Kpi label="Engajamento" value={`${overview.resolutionRate}%`} icon={TrendingUp} />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Bairros com mais participação</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byNeighborhood.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={70} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Ocorrências reportadas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== MAPA DE CALOR ====== */}
          <TabsContent value="heatmap" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-destructive" /> Mapa de calor — concentração de ocorrências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Áreas com maior concentração de problemas registrados em Videira/SC.
                </p>
                <HeatmapView points={heatmapPoints} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
