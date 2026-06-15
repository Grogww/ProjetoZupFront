import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import ReportImage from "@/components/ReportImage";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMyOccurrences } from "@/hooks/useOccurrences";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { statusLabels, isResolvedStatus } from "@/data/mockData";
import { MapPin, Clock, Bell, CheckCircle2, FileText, Users, Info, Plus, Trash2, AlertCircle, ThumbsUp } from "lucide-react";
import { formatCEP, validateCEP } from "@/lib/validators";
import { toast } from "@/hooks/use-toast";

interface DeclaredArea {
  cep: string;
  type: string;
}

const CitizenPanel = () => {
  // Minhas ocorrências REAIS: GET /occurrences?author_id={meu id} (item 1).
  const { reports: myReports } = useMyOccurrences();
  const { getCategoryById, organizationName } = useTaxonomy();
  const resolvedCount = myReports.filter((r) => isResolvedStatus(r.status)).length;
  // Histórico = as próprias ocorrências (mais recentes primeiro).
  const myHistory = [...myReports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  // O back não tem "convites de validação" (item 7): a participação é via
  // upvote/downvote nas ocorrências, direto no mapa/detalhe.
  const myValidations: never[] = [];
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "validations" ? "validations" : "reports";
  const [areas, setAreas] = useState<DeclaredArea[]>([]);
  const [showAreaForm, setShowAreaForm] = useState(false);

  const profileStatus = areas.length > 0 ? 'complete' : 'incomplete';

  const addArea = () => {
    if (areas.length < 2) setAreas([...areas, { cep: '', type: 'moradia' }]);
  };

  const updateArea = (i: number, field: keyof DeclaredArea, value: string) => {
    const updated = [...areas];
    updated[i] = { ...updated[i], [field]: field === 'cep' ? formatCEP(value) : value };
    setAreas(updated);
  };

  const removeArea = (i: number) => setAreas(areas.filter((_, idx) => idx !== i));

  const saveAreas = () => {
    const allValid = areas.every(a => validateCEP(a.cep));
    if (!allValid) {
      toast({ title: 'CEP inválido', description: 'Verifique os CEPs informados.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Perfil territorial salvo!', description: 'Agora você pode registrar ocorrências no mapa de Videira.' });
    setShowAreaForm(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Meu Painel</h1>
          <p className="text-muted-foreground text-sm">Acompanhe suas ocorrências, validações e participação em Videira/SC</p>
        </div>

        {profileStatus === 'incomplete' && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Complete seu perfil territorial</p>
                <p className="text-xs text-muted-foreground mt-1">Para registrar ocorrências no mapa, declare ao menos uma localidade (moradia, trabalho ou estudo) com CEP.</p>
                <Button size="sm" className="mt-2" onClick={() => { setShowAreaForm(true); if (areas.length === 0) addArea(); }}>
                  Completar agora
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showAreaForm && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Localidades declaradas</Label>
                {areas.length < 2 && (
                  <Button type="button" variant="ghost" size="sm" onClick={addArea} className="gap-1 text-primary">
                    <Plus className="w-3 h-3" /> Adicionar
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                Declare até 2 localidades. Seus dados de CEP são privados.
              </p>
              {areas.map((area, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input value={area.cep} onChange={e => updateArea(i, 'cep', e.target.value)} placeholder="CEP" maxLength={9} />
                  </div>
                  <Select value={area.type} onValueChange={v => updateArea(i, 'type', v)}>
                    <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moradia">Moradia</SelectItem>
                      <SelectItem value="trabalho">Trabalho</SelectItem>
                      <SelectItem value="estudo">Estudo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" aria-label="Remover localidade" onClick={() => removeArea(i)} className="text-muted-foreground shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button size="sm" onClick={saveAreas}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAreaForm(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Minhas Ocorrências', value: myReports.length, icon: FileText },
            { label: 'Validações Pendentes', value: myValidations.length, icon: Users },
            { label: 'Resolvidas', value: resolvedCount, icon: CheckCircle2 },
            // TODO(API): sem endpoint de notificações — mantém 0 até o back expor.
            { label: 'Notificações', value: 0, icon: Bell },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className="w-8 h-8 text-primary opacity-70" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue={initialTab} onValueChange={(v) => setSearchParams(v === "reports" ? {} : { tab: v })}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="reports">Minhas Ocorrências</TabsTrigger>
            <TabsTrigger value="validations" className="gap-1.5">
              Validações
              {myValidations.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
                  {myValidations.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-3 mt-4">
            {myReports.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground space-y-2">
                  <FileText className="w-10 h-10 mx-auto opacity-50" />
                  <p className="text-sm font-medium text-foreground">Você ainda não registrou ocorrências</p>
                  <p className="text-xs">Registre um problema no mapa para acompanhá-lo aqui.</p>
                </CardContent>
              </Card>
            )}
            {myReports.map(report => {
              const cat = getCategoryById(report.categoryId);
              return (
                <Card key={report.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3 flex-1">
                        <ReportImage report={report} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                        <div className="space-y-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm">{report.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />{report.neighborhood}
                            <span>·</span>{cat && <span>{cat.name}</span>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />{new Date(report.createdAt).toLocaleDateString('pt-BR')}
                            <span>·</span><span>{organizationName(report.organizationId)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end shrink-0">
                        <StatusBadge status={report.status} />
                        <PriorityBadge priority={report.priority} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="validations" className="space-y-3 mt-4">
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground space-y-2">
                <ThumbsUp className="w-10 h-10 mx-auto opacity-50" />
                <p className="text-sm font-medium text-foreground">A validação agora é por voto da comunidade</p>
                <p className="text-xs max-w-md mx-auto">
                  Não há mais uma fila de convites: você participa apoiando (upvote) ou
                  contestando (downvote) ocorrências diretamente no mapa e na página de cada
                  ocorrência. Quanto mais apoio, maior a prioridade percebida.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground">Ocorrências que você registrou na plataforma</p>
                {myHistory.length === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">Nenhum registro ainda.</p>
                )}
                {myHistory.map((report) => {
                  const cat = getCategoryById(report.categoryId);
                  return (
                    <div key={report.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                      <div className="min-w-0">
                        <span className="font-medium text-foreground">Registrou ocorrência</span>
                        <p className="text-xs text-muted-foreground truncate">
                          {report.title}{cat ? ` · ${cat.name}` : ""}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground shrink-0 ml-3">
                        <div>{new Date(report.createdAt).toLocaleDateString('pt-BR')}</div>
                        <div className="text-primary font-medium">{statusLabels[report.status]}</div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-3 mt-4">
            {/* TODO(API): o back ainda não expõe notificações do cidadão.
                Mantido como aviso até existir o endpoint. */}
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground space-y-2">
                <Bell className="w-10 h-10 mx-auto opacity-50" />
                <p className="text-sm font-medium text-foreground">Notificações em breve</p>
                <p className="text-xs max-w-md mx-auto">
                  Os avisos sobre mudanças de status e validações das suas ocorrências serão
                  adicionados assim que a API de notificações estiver disponível.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CitizenPanel;
