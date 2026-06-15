import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { rejectionReasons } from "@/data/mockData";
import { useOccurrences } from "@/hooks/useOccurrences";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { useAnalyticsOverview } from "@/hooks/useStats";
import { listUsers, userRoleLabels } from "@/lib/auth-api";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import ReportImage from "@/components/ReportImage";
import { Shield, Users, FileText, Settings, AlertTriangle, Eye, Trash2, MapPin, Calendar, Activity, UserCheck, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const AdminPanel = () => {
  const { roles } = useAuth();
  const { reports } = useOccurrences();
  const { categories, neighborhoodNames, neighborhoodById } = useTaxonomy();
  const analytics = useAnalyticsOverview(); // total real de ocorrências (/analytics/overview)
  const isAdmin = roles.includes("admin");
  // Usuários reais (GET /api/users — admin). Só dispara para admin.
  const usersQ = useQuery({ queryKey: ["users"], queryFn: listUsers, enabled: isAdmin, staleTime: 60_000, retry: 1 });
  const users = usersQ.data ?? [];
  const [rejReason, setRejReason] = useState("");
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Moderação, auditoria e gerenciamento — ZUP Videira/SC</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Ocorrências', value: analytics.total || reports.length, icon: FileText },
            { label: 'Usuários', value: users.length, icon: Users },
            { label: 'Categorias', value: categories.length, icon: Settings },
            { label: 'Bairros', value: neighborhoodNames.length, icon: MapPin },
            // TODO(API): "Suspeitas" depende de moderação/flag de ocorrência — sem endpoint no back.
            { label: 'Suspeitas', value: 0, icon: AlertTriangle },
            // TODO(API): "Validadores" (votantes distintos) — sem endpoint agregado no back.
            { label: 'Validadores', value: 0, icon: UserCheck },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className="w-7 h-7 text-primary opacity-70" />
                <div>
                  <div className="text-xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="moderation">
          <TabsList className="flex-wrap">
            <TabsTrigger value="moderation">Moderação</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="neighborhoods">Bairros</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="moderation" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">Ocorrências sinalizadas para revisão</p>
            {reports.slice(0, 4).map(report => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex gap-3 flex-1">
                      <ReportImage report={report} className="w-14 h-14 rounded-lg object-cover" />
                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground text-sm">{report.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />{report.neighborhood}
                          <Calendar className="w-3 h-3 ml-1" />{new Date(report.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex gap-1.5">
                          <StatusBadge status={report.status} />
                          <PriorityBadge priority={report.priority} />
                          {report.isRecurrence && (
                            <span className="inline-flex items-center gap-1 text-xs text-accent font-medium">
                              <RefreshCw className="w-3 h-3" /> Reincidente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select value={rejReason} onValueChange={setRejReason}>
                        <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Motivo de rejeição" /></SelectTrigger>
                        <SelectContent>
                          {rejectionReasons.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" onClick={() => toast({ title: 'Aprovada' })}><Eye className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => toast({ title: 'Arquivada', description: rejReason ? `Motivo: ${rejectionReasons.find(r => r.id === rejReason)?.label}` : 'Sem motivo' })}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Categorias e subcategorias — expansível pelo admin</p>
              <Button size="sm" onClick={() => toast({ title: 'Disponível com backend ativo' })}>+ Nova Categoria</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {categories.map(cat => (
                <Card key={cat.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      {cat.name}
                      <span className="text-xs font-normal text-muted-foreground">{cat.organ === 'prefeitura' ? 'Prefeitura' : cat.organ === 'agua_saneamento' ? 'Água/Saneamento' : 'Energia/Luz'} · {cat.subcategories.length} sub</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.subcategories.map(sub => (
                        <span key={sub.id} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{sub.name}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="neighborhoods" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">Bairros cadastrados de Videira/SC</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {neighborhoodNames.map(name => {
                const count = reports.filter(r => r.neighborhood === name).length;
                return (
                  <Card key={name}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{count} ocor.</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">Usuários cadastrados na plataforma</p>
                  <span className="text-xs text-muted-foreground">{users.length} no total</span>
                </div>
                {usersQ.isLoading && <p className="text-sm text-muted-foreground py-6 text-center">Carregando usuários…</p>}
                {usersQ.isError && <p className="text-sm text-destructive py-6 text-center">Não foi possível carregar os usuários.</p>}
                <div className="space-y-3">
                  {users.map((u) => {
                    const neighborhood = u.neighborhood_id != null ? neighborhoodById(u.neighborhood_id)?.name : undefined;
                    const status = u.is_active === false
                      ? "Inativo"
                      : u.email_verified_at
                        ? "Ativo"
                        : "E-mail não verificado";
                    return (
                      <div key={u.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-foreground">{u.name}</span>
                          <span className="text-xs text-muted-foreground ml-2 px-1.5 py-0.5 bg-muted rounded">{userRoleLabels[u.role]}</span>
                          <p className="text-xs text-muted-foreground truncate">{u.email}{neighborhood ? ` · ${neighborhood}` : ""}</p>
                        </div>
                        <div className="text-xs text-muted-foreground text-right shrink-0 ml-3">
                          <div>{status}</div>
                          <div>{u.created_at ? `Desde ${new Date(u.created_at).toLocaleDateString('pt-BR')}` : ""}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {[
                    { action: 'Ocorrência #1 criada no Centro', user: 'Cidadão #1042', time: '15/03/2026 10:30', type: 'criação' },
                    { action: 'Validação de existência confirmada', user: 'Cidadão #0897', time: '15/03/2026 14:20', type: 'validação' },
                    { action: 'Status alterado para Em Execução', user: 'Prefeitura Municipal', time: '18/03/2026 09:00', type: 'status' },
                    { action: 'Prioridade reclassificada: Média → Alta', user: 'Admin', time: '18/03/2026 09:10', type: 'prioridade' },
                    { action: 'Ocorrência #3 marcada como resolvida', user: 'Prefeitura Municipal', time: '20/03/2026 16:00', type: 'resolução' },
                    { action: 'Resolução validada pela comunidade', user: 'Sistema', time: '22/03/2026 11:00', type: 'validação' },
                    { action: 'Ocorrência #8 rejeitada — motivo: problema persiste', user: 'Comunidade', time: '28/03/2026 10:00', type: 'rejeição' },
                    { action: 'Reincidência detectada — Esgoto no Bom Retiro (2ª vez)', user: 'Sistema', time: '28/03/2026 16:00', type: 'reincidência' },
                    { action: 'Tentativa de registro fora de Videira bloqueada', user: 'Sistema', time: '29/03/2026 08:15', type: 'segurança' },
                  ].map((log, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-foreground">{log.action}</span>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        <div>{log.user}</div>
                        <div>{log.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
