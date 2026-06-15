import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Shield, BarChart3, ChevronRight, ChevronLeft } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    title: "Mapeie problemas urbanos",
    desc: "Registre buracos, vazamentos, postes apagados e outros problemas diretamente no mapa de Videira. Basta clicar no local e adicionar uma foto.",
  },
  {
    icon: Shield,
    title: "Anonimato garantido",
    desc: "Sua identidade é totalmente protegida. Nenhum dado pessoal é exibido publicamente ou para os órgãos responsáveis.",
  },
  {
    icon: Users,
    title: "Validação comunitária",
    desc: "Cada ocorrência é verificada por outros cidadãos do mesmo bairro, garantindo veracidade e evitando registros falsos.",
  },
  {
    icon: BarChart3,
    title: "Transparência e acompanhamento",
    desc: "Acompanhe o andamento de cada problema, veja prazos, status e métricas de resolução na seção Minha Cidade.",
  },
];

const STORAGE_KEY = 'zup-onboarding-seen';

const OnboardingModal = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch {
      // localStorage unavailable, skip onboarding
    }
  }, []);

  const handleClose = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    setOpen(false);
  };

  const current = steps[step];
  if (!current) return null;
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm z-[2000]">
        <DialogDescription className="sr-only">
          Conheça a plataforma ZUP — Zeladoria Urbana Participativa
        </DialogDescription>
        <div className="text-center space-y-4 py-2">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <div className="text-xs font-bold text-primary uppercase tracking-wide">
            {step + 1} de {steps.length}
          </div>
          <h3 className="text-lg font-bold text-foreground">{current.title}</h3>
          <p className="text-sm text-muted-foreground">{current.desc}</p>
          <div className="flex gap-1 justify-center">
            {steps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="gap-1">
                <ChevronLeft className="w-4 h-4" /> Voltar
              </Button>
            )}
            <div className="flex-1" />
            {step < steps.length - 1 ? (
              <>
                <Button variant="ghost" onClick={handleClose}>Pular</Button>
                <Button onClick={() => setStep(step + 1)} className="gap-1">
                  Próximo <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button onClick={handleClose} className="w-full">Começar a usar o ZUP</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
