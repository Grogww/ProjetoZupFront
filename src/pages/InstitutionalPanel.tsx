import Navbar from "@/components/layout/Navbar";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import ReportImage from "@/components/ReportImage";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { organLabels, type OrganType } from "@/data/mockData";
import { useOccurrences } from "@/hooks/useOccurrences";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { useParams } from "react-router-dom";
import { Building2, Clock, CheckCircle2, AlertTriangle, TrendingUp, MapPin, Calendar, Timer, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const organConfig: Record<string, { organ: OrganType; name: string }> = {
  prefeitura: { organ: 'prefeitura', name: 'Prefeitura Municipal de Videira' },
  agua: { organ: 'agua_saneamento', name: 'Companhia de Água e Saneamento' },
  energia: { organ: 'energia_luz', name: 'Companhia de Energia e Iluminação' },
};

const InstitutionalPanel = () => {
  const { type = 'prefeitura' } = useParams();
  const config = organConfig[type] || organConfig.prefeitura;
  const { reports: allOccurrences } = useOccurrences();
  const { neighborhoodNames, getCategoryById } = useTaxonomy();
  const allReports = allOccurrences.filter(r => r.organ === config.organ);
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");

  const reports = neighborhoodFilter === 'all' ? allReports : allReports.filter(r => r.neighborhood === neighborhoodFilter);

  const stats = {
    total: reports.length,
    awaiting: reports.filter(r => r.status === 'pending' || r.status === 'awaiting_validation' || r.status === 'validated').length,
    analysis: reports.filter(r => r.status === 'in_analysis' || r.status === 'resolution_rejected').length,
    execution: reports.filter(r => r.status === 'in_progress').length,
    resolved: reports.filter(r => r.status === 'resolved' || r.status === 'resolution_validated').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-foreground">{config.name}</h1>
              <p className="text-sm text-muted-foreground">Painel de gestão de ocorrências — Videira/SC</p>
            </div>
          </div>
          <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
            <SelectTrigger className="w-[160px]">
              <MapPin className="w-4 h-4 mr-1" /><SelectValue placeholder="Bairro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os bairros</SelectItem>
              {neighborhoodNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: stats.total, icon: AlertTriangle, color: 'text-primary' },
            { label: 'Aguardando', value: stats.awaiting, icon: Clock, color: 'text-[hsl(var(--status-awaiting))]' },
            { label: 'Pendentes', value: stats.analysis, icon: Clock, color: 'text-[hsl(var(--status-analysis))]' },
            { label: 'Em Execução', value: stats.execution, icon: TrendingUp, color: 'text-[hsl(var(--status-execution))]' },
            { label: 'Resolvidas', value: stats.resolved, icon: CheckCircle2, color: 'text-[hsl(var(--status-validated))]' },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`w-7 h-7 ${s.color} opacity-70`} />
                <div>
                  <div className="text-xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pendentes ({stats.analysis})</TabsTrigger>
            <TabsTrigger value="execution">Em Execução ({stats.execution})</TabsTrigger>
            <TabsTrigger value="resolved">Resolvidas ({stats.resolved})</TabsTrigger>
          </TabsList>

          {['pending', 'execution', 'resolved'].map(tab => {
            const filtered = reports.filter(r => {
              if (tab === 'pending') return ['pending', 'awaiting_validation', 'validated', 'in_analysis', 'resolution_rejected'].includes(r.status);
              if (tab === 'execution') return r.status === 'in_progress';
              return r.status === 'resolved' || r.status === 'resolution_validated';
            });
            return (
              <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
                {filtered.map(report => {
                  const cat = getCategoryById(report.categoryId);
                  const daysOpen = Math.floor((Date.now() - new Date(report.createdAt).getTime()) / 86400000);
                  return (
                    <Card key={report.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex gap-3 flex-1 min-w-0">
                            <ReportImage report={report} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                            <div className="space-y-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-sm">{report.title}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-1">{report.description}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.neighborhood}</span>
                                <span>·</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(report.createdAt).toLocaleDateString('pt-BR')}</span>
                                <span>·</span>
                                <span>{daysOpen}d aberta</span>
                                {cat && <><span>·</span><span>{cat.name}</span></>}
                              </div>
                              {report.isRecurrence && (
                                <div className="flex items-center gap-1 text-xs text-accent font-medium">
                                  <RefreshCw className="w-3 h-3" /> Reincidência ({report.recurrenceCount}x)
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <StatusBadge status={report.status} />
                            <PriorityBadge priority={report.priority} />
                            {tab === 'pending' && (
                              <Button size="sm" onClick={() => toast({ title: 'Status atualizado', description: 'Ocorrência movida para Em Execução.' })}>
                                Iniciar
                              </Button>
                            )}
                            {tab === 'execution' && (
                              <Button size="sm" variant="outline" onClick={() => toast({ title: 'Marcado como resolvido' })}>
                                Resolver
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma ocorrência nesta categoria.</p>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default InstitutionalPanel;
