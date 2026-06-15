import { useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, BarChart3, Clock, AlertTriangle, RefreshCw, Award, Activity, Timer, Percent, ListChecks
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { useOrganizationStats, useNeighborhoodStats, useCityOverview, type OrganizationStat } from "@/hooks/useStats";
import { useOccurrences } from "@/hooks/useOccurrences";
import { useTaxonomy } from "@/hooks/useTaxonomy";

// Os órgãos agora são REAIS (GET /organizations) — não há mais lista fixa de 3.
// Cor por posição (ciclada) e ícone genérico; rótulo é o nome do órgão.
const ORG_COLORS = [
  "hsl(262, 60%, 45%)", "hsl(200, 70%, 45%)", "hsl(38, 92%, 50%)",
  "hsl(150, 55%, 42%)", "hsl(0, 72%, 55%)", "hsl(280, 55%, 55%)", "hsl(20, 80%, 50%)",
];
const orgColor = (i: number) => ORG_COLORS[i % ORG_COLORS.length];
const orgKey = (id: number | null) => (id == null ? "none" : String(id));
const shortName = (name: string) => name.split(" ")[0];

const Kpi = ({ label, value, icon: Icon, accent = "text-primary" }: any) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-5 h-5 ${accent} opacity-80`} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
    </CardContent>
  </Card>
);

const OrganDetailCard = ({ stat, color }: { stat: OrganizationStat; color: string }) => {
  const { reports: allReports } = useOccurrences();
  const { getSubcategoryById } = useTaxonomy();
  const subStats = useMemo(() => {
    const reports = allReports.filter(r => r.organizationId === stat.organizationId);
    const subMap = new Map<string, number>();
    reports.forEach(r => {
      const sub = getSubcategoryById(r.categoryId, r.subcategoryId);
      if (sub) subMap.set(sub.name, (subMap.get(sub.name) ?? 0) + 1);
    });
    return Array.from(subMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [stat.organizationId, allReports, getSubcategoryById]);

  const neighborhoodHits = useMemo(() => {
    const reports = allReports.filter(r => r.organizationId === stat.organizationId);
    const m = new Map<string, number>();
    reports.forEach(r => m.set(r.neighborhood, (m.get(r.neighborhood) ?? 0) + 1));
    return Array.from(m.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [stat.organizationId, allReports]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Kpi label="Total" value={stat.total} icon={ListChecks} />
        <Kpi label="Pendentes" value={stat.pending} icon={Clock} accent="text-[hsl(var(--status-analysis))]" />
        <Kpi label="Em execução" value={stat.inExecution} icon={Activity} accent="text-[hsl(var(--status-execution))]" />
        <Kpi label="Resolvidas" value={stat.resolved} icon={Award} accent="text-[hsl(var(--status-validated))]" />
        <Kpi label="Atrasadas" value={stat.overdue} icon={AlertTriangle} accent="text-destructive" />
        <Kpi label="Taxa resolução" value={`${stat.resolutionRate}%`} icon={Percent} accent="text-[hsl(var(--status-validated))]" />
        <Kpi label="Resp. médio" value={`${stat.avgResponseDays}d`} icon={Timer} />
        <Kpi label="Resol. média" value={`${stat.avgResolutionDays}d`} icon={Clock} />
        <Kpi label="Reincidências" value={stat.recurrent} icon={RefreshCw} accent="text-accent" />
        <Kpi label="Resoluções rejeitadas" value={stat.rejected} icon={AlertTriangle} accent="text-destructive" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Subcategorias mais recorrentes</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subStats} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={color} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Bairros mais afetados</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={neighborhoodHits} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} fill={color} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ComparativoOrgaos = ({ organStats }: { organStats: OrganizationStat[] }) => {
  const radarData = organStats.map(o => ({
    organ: shortName(o.name),
    "Resolução": o.resolutionRate,
    "Velocidade": Math.max(0, 100 - o.avgResponseDays * 5),
    "Pendências (inv.)": Math.max(0, 100 - (o.pending / Math.max(o.total, 1)) * 100),
  }));

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Award className="w-4 h-4 text-[hsl(var(--status-validated))]" /> Melhor taxa de resolução</CardTitle></CardHeader>
          <CardContent>
            {(() => {
              const top = [...organStats].sort((a, b) => b.resolutionRate - a.resolutionRate)[0];
              return <p className="text-lg font-bold">{top?.name} <span className="text-muted-foreground text-sm">({top?.resolutionRate}%)</span></p>;
            })()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /> Mais pendências</CardTitle></CardHeader>
          <CardContent>
            {(() => {
              const top = [...organStats].sort((a, b) => b.pending - a.pending)[0];
              return <p className="text-lg font-bold">{top?.name} <span className="text-muted-foreground text-sm">({top?.pending})</span></p>;
            })()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4 text-accent" /> Maior reincidência</CardTitle></CardHeader>
          <CardContent>
            {(() => {
              const top = [...organStats].sort((a, b) => b.recurrent - a.recurrent)[0];
              return <p className="text-lg font-bold">{top?.name} <span className="text-muted-foreground text-sm">({top?.recurrent})</span></p>;
            })()}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Comparativo por desempenho</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="organ" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="Resolução" dataKey="Resolução" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              <Radar name="Velocidade" dataKey="Velocidade" stroke="hsl(var(--status-validated))" fill="hsl(var(--status-validated))" fillOpacity={0.3} />
              <Radar name="Sem pendências" dataKey="Pendências (inv.)" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.3} />
              <Legend />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Tabela comparativa</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-2">Órgão</th>
                  <th className="text-right py-2 px-2">Total</th>
                  <th className="text-right py-2 px-2">Pendentes</th>
                  <th className="text-right py-2 px-2">Resolvidas</th>
                  <th className="text-right py-2 px-2">Atrasadas</th>
                  <th className="text-right py-2 px-2">Taxa</th>
                  <th className="text-right py-2 px-2">Resp. (d)</th>
                  <th className="text-right py-2 px-2">Resol. (d)</th>
                </tr>
              </thead>
              <tbody>
                {organStats.map(o => (
                  <tr key={orgKey(o.organizationId)} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-2 px-2 font-medium">{o.name}</td>
                    <td className="text-right py-2 px-2">{o.total}</td>
                    <td className="text-right py-2 px-2 text-[hsl(var(--status-analysis))]">{o.pending}</td>
                    <td className="text-right py-2 px-2 text-[hsl(var(--status-validated))]">{o.resolved}</td>
                    <td className="text-right py-2 px-2 text-destructive">{o.overdue}</td>
                    <td className="text-right py-2 px-2">{o.resolutionRate}%</td>
                    <td className="text-right py-2 px-2">{o.avgResponseDays}</td>
                    <td className="text-right py-2 px-2">{o.avgResolutionDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Prazos = ({ organStats }: { organStats: OrganizationStat[] }) => {
  const data = organStats.map(o => ({
    name: shortName(o.name),
    "Resposta": o.avgResponseDays,
    "Resolução": o.avgResolutionDays,
  }));
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Timer className="w-4 h-4" /> Tempos médios por órgão</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="Resposta" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Resolução" fill="hsl(var(--status-validated))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

const Pendencias = ({ organStats }: { organStats: OrganizationStat[] }) => (
  <div className="grid md:grid-cols-3 gap-6">
    {organStats.map((o, idx) => {
      const color = orgColor(idx);
      return (
        <Card key={orgKey(o.organizationId)}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" style={{ color }} /> {o.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pendentes</span>
              <span className="font-bold text-[hsl(var(--status-analysis))]">{o.pending}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Em execução</span>
              <span className="font-bold text-[hsl(var(--status-execution))]">{o.inExecution}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Atrasadas</span>
              <span className="font-bold text-destructive">{o.overdue}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${o.total ? (o.pending / o.total) * 100 : 0}%` }} />
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
);

const Gestao = () => {
  const overview = useCityOverview();
  const organStats = useOrganizationStats();
  const [period, setPeriod] = useState("6m");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <header className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-primary border-primary/40">Institucional</Badge>
              <Badge variant="secondary">Transparência pública</Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-foreground">Gestão</h1>
            <p className="text-muted-foreground text-sm">Desempenho dos órgãos responsáveis pela zeladoria urbana de Videira/SC</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Último mês</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </header>

        <Tabs defaultValue="desempenho">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="desempenho"><BarChart3 className="w-4 h-4 mr-1" /> Desempenho geral</TabsTrigger>
            {organStats.map(o => (
              <TabsTrigger key={orgKey(o.organizationId)} value={orgKey(o.organizationId)}>
                <Building2 className="w-4 h-4 mr-1" /> {o.name}
              </TabsTrigger>
            ))}
            <TabsTrigger value="prazos"><Timer className="w-4 h-4 mr-1" /> Prazos</TabsTrigger>
            <TabsTrigger value="pendencias"><Clock className="w-4 h-4 mr-1" /> Pendências</TabsTrigger>
          </TabsList>

          <TabsContent value="desempenho" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="Total acompanhado" value={overview.total} icon={ListChecks} />
              <Kpi label="Resolvidas" value={overview.resolved} icon={Award} accent="text-[hsl(var(--status-validated))]" />
              <Kpi label="Pendentes" value={overview.unresolved} icon={Clock} accent="text-[hsl(var(--status-analysis))]" />
              <Kpi label="Tempo médio resol." value={`${overview.avgResolutionDays}d`} icon={Timer} />
            </div>
            <ComparativoOrgaos organStats={organStats} />
          </TabsContent>

          {organStats.map((o, idx) => (
            <TabsContent key={orgKey(o.organizationId)} value={orgKey(o.organizationId)} className="mt-4">
              <OrganDetailCard stat={o} color={orgColor(idx)} />
            </TabsContent>
          ))}

          <TabsContent value="prazos" className="mt-4">
            <Prazos organStats={organStats} />
          </TabsContent>
          <TabsContent value="pendencias" className="mt-4">
            <Pendencias organStats={organStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Gestao;
