import { useState, useMemo, useEffect } from "react";
import Seo from "@/components/Seo";
import Navbar from "@/components/layout/Navbar";
import MapView from "@/components/MapView";
import MapLegend from "@/components/MapLegend";
import ReportCard from "@/components/ReportCard";
import ReportDetailModal from "@/components/ReportDetailModal";
import CreateReportModal from "@/components/CreateReportModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { statusLabels, ALL_STATUSES, type Report, type ReportStatus, type Priority } from "@/data/mockData";
import { useOccurrences } from "@/hooks/useOccurrences";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { Plus, Search, Filter, List, Map as MapIcon, X, MapPin, Info, ArrowUpDown } from "lucide-react";

const statusOptions: { value: ReportStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos os status' },
  ...ALL_STATUSES.map((s) => ({ value: s, label: statusLabels[s] })),
];

const priorityOptions: { value: Priority | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas prioridades' },
  { value: 'critica', label: 'Crítica' },
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
];

type SortOption = 'recent' | 'oldest' | 'priority' | 'neighborhood';

const MapPage = () => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [organizationFilter, setOrganizationFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Request geolocation on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {} // silently ignore denial
      );
    }
  }, []);

  const { reports } = useOccurrences();
  const { categories, neighborhoodNames, organizations } = useTaxonomy();

  const filteredReports = useMemo(() => {
    let result = reports.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && r.categoryId !== categoryFilter) return false;
      if (neighborhoodFilter !== 'all' && r.neighborhood !== neighborhoodFilter) return false;
      if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
      if (organizationFilter !== 'all') {
        if (organizationFilter === 'none' ? r.organizationId != null : r.organizationId !== Number(organizationFilter)) return false;
      }
      if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    // Sort for list view
    if (sortBy === 'recent') result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === 'oldest') result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sortBy === 'priority') {
      const order: Record<Priority, number> = { critica: 0, alta: 1, media: 2, baixa: 3 };
      result.sort((a, b) => order[a.priority] - order[b.priority]);
    }
    else if (sortBy === 'neighborhood') result.sort((a, b) => a.neighborhood.localeCompare(b.neighborhood));

    return result;
  }, [reports, statusFilter, categoryFilter, neighborhoodFilter, priorityFilter, organizationFilter, search, sortBy]);

  const activeFilters = [statusFilter, categoryFilter, neighborhoodFilter, priorityFilter, organizationFilter].filter(f => f !== 'all').length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo title="Mapa de Ocorrências — ZUP Videira/SC" description="Explore no mapa as ocorrências urbanas registradas em Videira/SC e acompanhe o status de cada uma." path="/mapa" />
      <Navbar />
      <h1 className="sr-only">Mapa de Ocorrências de Videira/SC</h1>


      {showTip && (
        <div className="bg-primary/5 border-b border-primary/10 px-4 py-2">
          <div className="container mx-auto flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Para registrar ocorrências, complete seu <strong className="text-foreground">perfil territorial</strong> em <em>Meu Painel</em>.</span>
            </p>
            <button onClick={() => setShowTip(false)} aria-label="Fechar dica" className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="bg-card border-b border-border px-4 py-3 relative z-[700]">
        <div className="container mx-auto flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/20 rounded-lg px-2 py-1">
            <MapPin className="w-4 h-4 text-primary" />
            <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
              <SelectTrigger className="border-0 bg-transparent h-8 w-[150px] text-sm font-medium shadow-none focus:ring-0 px-0">
                <SelectValue placeholder="Todos os bairros" />
              </SelectTrigger>
              <SelectContent className="z-[2000]">
                <SelectItem value="all">Todos os bairros</SelectItem>
                <SelectItem value="__meu_bairro">🏠 Meu bairro</SelectItem>
                {neighborhoodNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar ocorrências..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5 h-9">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{activeFilters}</span>
            )}
          </Button>
          <div className="flex border border-border rounded-md">
            <button onClick={() => setView('map')} aria-label="Ver no mapa" aria-pressed={view === 'map'} className={`p-2 ${view === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'} rounded-l-md transition-colors`}>
              <MapIcon className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')} aria-label="Ver em lista" aria-pressed={view === 'list'} className={`p-2 ${view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'} rounded-r-md transition-colors`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5 h-9">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Registrar</span>
          </Button>
        </div>

        {showFilters && (
          <div className="container mx-auto mt-3 flex flex-wrap gap-2 animate-fade-in">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent className="z-[2000]">
                {statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent className="z-[2000]">
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent className="z-[2000]">
                {priorityOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Órgão responsável" /></SelectTrigger>
              <SelectContent className="z-[2000]">
                <SelectItem value="all">Todos os órgãos</SelectItem>
                {organizations.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                <SelectItem value="none">Não atribuído</SelectItem>
              </SelectContent>
            </Select>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); setNeighborhoodFilter('all'); setPriorityFilter('all'); setOrganizationFilter('all'); }}>
                <X className="w-4 h-4 mr-1" /> Limpar
              </Button>
            )}
            <span className="text-sm text-muted-foreground self-center ml-auto">{filteredReports.length} ocorrência(s) em Videira/SC</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {view === 'map' ? (
          <div className="h-[calc(100vh-140px)] relative">
            <MapView reports={filteredReports} onReportClick={setSelectedReport} showNeighborhoodBoundaries={false} />
            <MapLegend />
          </div>
        ) : (
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">{filteredReports.length} ocorrência(s)</p>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <ArrowUpDown className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[2000]">
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigas</SelectItem>
                  <SelectItem value="priority">Por prioridade</SelectItem>
                  <SelectItem value="neighborhood">Por bairro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredReports.map(report => (
                <ReportCard key={report.id} report={report} onClick={() => setSelectedReport(report)} />
              ))}
            </div>
            {filteredReports.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <MapIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma ocorrência encontrada com os filtros aplicados.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ReportDetailModal report={selectedReport} open={!!selectedReport} onClose={() => setSelectedReport(null)} />
      <CreateReportModal open={createOpen} onClose={() => setCreateOpen(false)} userLocation={userLocation} />
    </div>
  );
};

export default MapPage;
