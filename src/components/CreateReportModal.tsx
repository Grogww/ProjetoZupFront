import { useState, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DUPLICATE_RADIUS_METERS, NEARBY_RADIUS_METERS } from "@/data/mockData";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { useQuery } from "@tanstack/react-query";
import { organConfig } from "@/data/organConfig";
import MapView from "./MapView";
import { MapPin, Upload, AlertCircle, CheckCircle2, Shield, Info, ImagePlus, X, Eye, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { locateNeighborhood } from "@/lib/neighborhoods-api";
import {
  createOccurrence,
  uploadOccurrenceMedia,
  listNearbyOccurrences,
  mapOccurrenceToReport,
} from "@/lib/occurrences-api";
import { ApiError } from "@/lib/api";
import { formatCEP } from "@/lib/validators";

interface CreateReportModalProps {
  open: boolean;
  onClose: () => void;
  userLocation?: [number, number] | null;
}

const CreateReportModal = ({ open, onClose, userLocation }: CreateReportModalProps) => {
  const [step, setStep] = useState(1);
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [cep, setCep] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const geoSeqRef = useRef(0);

  const { categories, neighborhoodNames, neighborhoodByName } = useTaxonomy();
  const category = categories.find(c => String(c.id) === selectedCategory);
  const subcategory = category?.subcategories.find(s => String(s.id) === selectedSubcategory);
  const organMeta = category ? organConfig[category.organ] : null;

  // Antiduplicidade real (item 25): GET /occurrences/nearby (raio 500m no back).
  const nearbyPos = selectedPosition || userLocation || null;
  const nearbyQ = useQuery({
    queryKey: ["nearby", nearbyPos?.[0], nearbyPos?.[1]],
    enabled: !!nearbyPos,
    queryFn: () => listNearbyOccurrences(nearbyPos![0], nearbyPos![1], NEARBY_RADIUS_METERS),
    staleTime: 30_000,
  });
  const nearbyReports = useMemo(() => (nearbyQ.data ?? []).map(mapOccurrenceToReport), [nearbyQ.data]);

  // Substitui o reverse-geocode do Google: usa só o geofencing do backend
  // (/neighborhoods/locate) para resolver o bairro a partir do ponto clicado.
  const detectNeighborhood = async (lat: number, lng: number) => {
    const seq = ++geoSeqRef.current;
    setGeoLoading(true);
    try {
      const n = await locateNeighborhood(lat, lng);
      if (seq !== geoSeqRef.current || !n) return;
      const match = neighborhoodNames.find(
        (name) => name.toLowerCase() === n.name.toLowerCase()
      );
      setSelectedNeighborhood(match ?? n.name);
    } finally {
      if (seq === geoSeqRef.current) setGeoLoading(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedPosition([lat, lng]);
    detectNeighborhood(lat, lng);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      setImageFiles(prev => [...prev, file].slice(0, 5));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result as string].slice(0, 5));
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    setStep(1);
    setSelectedPosition(null);
    setSelectedCategory("");
    setSelectedSubcategory("");
    setSelectedNeighborhood("");
    setTitle("");
    setDescription("");
    setImagePreviews([]);
    setImageFiles([]);
    setStreet("");
    setStreetNumber("");
    setCep("");
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!selectedPosition || !category) return;
    setSubmitting(true);
    try {
      // Endereço estruturado é serializado em uma string única (item 15: o back só
      // aceita `address`).
      const addressParts = [
        streetNumber.trim() ? `${street.trim()}, ${streetNumber.trim()}` : street.trim(),
        cep.trim() ? `CEP ${cep.trim()}` : "",
      ].filter(Boolean);
      const neighborhoodId = selectedNeighborhood ? neighborhoodByName(selectedNeighborhood)?.id ?? null : null;

      const created = await createOccurrence({
        title: title.trim(),
        description: description.trim(),
        category_id: category.id,
        subcategory_id: subcategory ? subcategory.id : null,
        neighborhood_id: neighborhoodId,
        latitude: selectedPosition[0],
        longitude: selectedPosition[1],
        address: addressParts.join(" — "),
      });

      if (imageFiles.length) {
        try {
          await uploadOccurrenceMedia(created.id, imageFiles);
        } catch (err) {
          console.warn("[occurrences] upload de mídias falhou:", err);
          toast({
            title: "Ocorrência criada, mas algumas fotos não subiram",
            description: "Você pode tentar enviá-las novamente em Meu Painel.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Ocorrência registrada com sucesso!",
        description: "Você tem 24h para editar ou excluir a ocorrência após o registro.",
      });
      onClose();
      reset();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const dup = err.data?.details;
        toast({
          title: "Ocorrência semelhante já existe",
          description: dup?.distance_m
            ? `Já há uma ocorrência aberta a ~${Math.round(dup.distance_m)}m daqui (#${dup.duplicate_id}).`
            : "Já existe uma ocorrência aberta semelhante num raio de 500m.",
          variant: "destructive",
        });
      } else {
        const msg = err instanceof ApiError ? err.message : "Não foi possível registrar a ocorrência.";
        toast({ title: "Erro ao registrar", description: msg, variant: "destructive" });
      }
      setSubmitting(false);
    }
  };

  const canProceedStep1 = selectedPosition !== null && street.trim().length > 0 && cep.trim().length >= 8;
  const canProceedStep2 = imagePreviews.length > 0;
  const canProceedStep3 = title.length >= 5 && description.length >= 10 && selectedCategory && selectedSubcategory && selectedNeighborhood;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); reset(); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[2000]">
        <DialogHeader>
          <DialogTitle>Registrar Ocorrência em Videira/SC</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                s === step ? 'bg-primary text-primary-foreground' : s < step ? 'bg-[hsl(var(--status-validated))] text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block">
                {s === 1 ? 'Local' : s === 2 ? 'Fotos' : s === 3 ? 'Detalhes' : 'Revisão'}
              </span>
              {s < 4 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>Clique no mapa para marcar o local da ocorrência</span>
            </div>
            {userLocation && !selectedPosition && (
              <div className="bg-primary/5 rounded-lg p-2 text-xs text-muted-foreground flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Sua localização foi detectada. O mapa está centralizado próximo a você.</span>
              </div>
            )}
            <div className="h-[350px] rounded-lg overflow-hidden border border-border">
              <MapView
                reports={nearbyReports}
                onMapClick={handleMapClick}
                selectedPosition={selectedPosition}
                center={userLocation || undefined}
              />
            </div>
            {nearbyReports.length > 0 && (
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-2 text-xs text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>{nearbyReports.length} ocorrência(s) num raio de {NEARBY_RADIUS_METERS}m. Verifique se seu problema já foi registrado.</span>
              </div>
            )}
            {selectedPosition && (
              <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">Endereço do local</p>
                  {geoLoading && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" /> Detectando bairro...
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-2">
                  <div>
                    <Label htmlFor="street" className="text-xs">Rua <span className="text-destructive" aria-hidden="true">*</span></Label>
                    <Input
                      id="street"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Ex: Rua das Flores"
                    />
                  </div>
                  <div>
                    <Label htmlFor="number" className="text-xs">Número <span className="text-muted-foreground">(opcional)</span></Label>
                    <Input
                      id="number"
                      value={streetNumber}
                      onChange={(e) => setStreetNumber(e.target.value)}
                      placeholder="123"
                      inputMode="numeric"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cep" className="text-xs">CEP <span className="text-destructive" aria-hidden="true">*</span></Label>
                  <Input
                    id="cep"
                    value={cep}
                    onChange={(e) => setCep(formatCEP(e.target.value))}
                    placeholder="00000-000"
                    inputMode="numeric"
                    maxLength={9}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  O bairro é detectado automaticamente pelo pino. Preencha rua e CEP.
                </p>
              </div>
            )}
            {selectedPosition && (
              <div className="bg-muted/50 rounded-lg p-2 text-xs text-muted-foreground flex items-center gap-2">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>O sistema verifica automaticamente duplicidade no raio de {DUPLICATE_RADIUS_METERS}m.</span>
              </div>
            )}
            <Button onClick={() => setStep(2)} disabled={!canProceedStep1} className="w-full">
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="w-4 h-4" />
              <span>Envie fotos do problema (mín. 1, máx. 5)</span>
            </div>
            <label className="block border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
              <div className="space-y-2">
                <ImagePlus className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Clique para selecionar imagens</p>
                <p className="text-xs text-muted-foreground">A primeira foto será a imagem principal</p>
              </div>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            </label>
            {imagePreviews.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {imagePreviews.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt={`Foto ${i + 1}`} className="w-20 h-20 rounded-lg object-cover" />
                    {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[9px] text-center rounded-b-lg">Principal</span>}
                    <button onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Voltar</Button>
              <Button onClick={() => setStep(3)} disabled={!canProceedStep2} className="flex-1">Continuar</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Campos marcados com <span className="text-destructive">*</span> são obrigatórios.</p>
            <div>
              <Label htmlFor="title">Título da ocorrência <span className="text-destructive" aria-hidden="true">*</span></Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Buraco na Rua Dona Francisca"
                aria-invalid={title.length > 0 && title.length < 5}
                aria-describedby="title-help"
              />
              <p id="title-help" className={`text-xs mt-1 ${title.length > 0 && title.length < 5 ? "text-destructive" : "text-muted-foreground"}`}>
                Mínimo de 5 caracteres.
              </p>
            </div>
            <div>
              <Label htmlFor="description">Descrição detalhada <span className="text-destructive" aria-hidden="true">*</span></Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descreva o problema com o máximo de detalhes..."
                rows={3}
                aria-invalid={description.length > 0 && description.length < 10}
                aria-describedby="desc-help"
              />
              <p id="desc-help" className={`text-xs mt-1 ${description.length > 0 && description.length < 10 ? "text-destructive" : "text-muted-foreground"}`}>
                Mínimo de 10 caracteres.
              </p>
            </div>
            <div>
              <Label>Bairro <span className="text-destructive" aria-hidden="true">*</span></Label>
              <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
                <SelectTrigger><SelectValue placeholder="Selecione o bairro" /></SelectTrigger>
                <SelectContent className="z-[2100]">
                  {neighborhoodNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria <span className="text-destructive" aria-hidden="true">*</span></Label>
                <Select value={selectedCategory} onValueChange={v => { setSelectedCategory(v); setSelectedSubcategory(""); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="z-[2100]">
                    {categories.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategoria <span className="text-destructive" aria-hidden="true">*</span></Label>
                <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory} disabled={!category}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="z-[2100]">
                    {category?.subcategories.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
              <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Anonimato garantido.</strong> Sua identidade é protegida.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Voltar</Button>
              <Button onClick={() => setStep(4)} disabled={!canProceedStep3} className="flex-1">Revisar</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
              <Eye className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Revise antes de publicar</p>
                <p>Confira todos os dados abaixo. Após publicar você terá 24h para editar ou excluir.</p>
              </div>
            </div>

            <div className="space-y-3">
              {imagePreviews.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {imagePreviews.map((img, i) => (
                    <img key={i} src={img} alt={`Foto ${i + 1}`} className="w-24 h-24 rounded-lg object-cover border border-border" />
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Título</p>
                  <p className="font-medium text-foreground">{title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Bairro</p>
                  <p className="font-medium text-foreground">{selectedNeighborhood}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Categoria</p>
                  <p className="font-medium text-foreground">{category?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Subcategoria</p>
                  <p className="font-medium text-foreground">{subcategory?.name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Descrição</p>
                  <p className="text-sm text-foreground bg-muted/30 rounded p-2">{description}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Endereço</p>
                  <p className="font-medium text-foreground text-sm">
                    {street}{streetNumber ? `, ${streetNumber}` : ""} — CEP {cep}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {selectedPosition?.[0].toFixed(5)}, {selectedPosition?.[1].toFixed(5)}
                  </p>
                </div>
                {organMeta && (
                  <div className="col-span-2 bg-muted/30 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Órgão responsável estimado</p>
                    <p className="font-medium text-foreground text-sm">{organMeta.name}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1" disabled={submitting}>Voltar e editar</Button>
              <Button onClick={handleSubmit} className="flex-1" disabled={submitting}>
                {submitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publicando...</>) : "Confirmar e publicar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateReportModal;
