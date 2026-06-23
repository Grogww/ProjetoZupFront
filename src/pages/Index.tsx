import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import OnboardingModal from "@/components/OnboardingModal";
import Seo from "@/components/Seo";
import { MapPin, Users, BarChart3, Shield, CheckCircle2, ArrowRight, Building2, Droplets, Zap, Clock } from "lucide-react";
import { motion } from "framer-motion";
import zupLogo from "@/assets/zup-logo.png";
import HeroCarousel from "@/components/HeroCarousel";
import { useAnalyticsOverview } from "@/hooks/useStats";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const fmt = (n: number) => n.toLocaleString("pt-BR");

const Index = () => {
  // KPIs reais via GET /api/analytics/overview (público). Enquanto carrega ou
  // se o back não responder, mostra "—" no lugar de números inventados.
  const overview = useAnalyticsOverview();
  const stat = (ready: boolean, value: string) =>
    overview.isLoading || overview.isError || !ready ? "—" : value;

  const stats = [
    { value: stat(true, fmt(overview.total)), label: "Ocorrências registradas" },
    { value: stat(true, fmt(overview.resolved)), label: "Problemas resolvidos" },
    {
      value: stat(overview.avgResolutionDays > 0, `${fmt(overview.avgResolutionDays)} dias`),
      label: "Tempo médio de resolução",
    },
    { value: stat(true, fmt(overview.activeNeighborhoods)), label: "Bairros ativos" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="ZUP — Zeladoria Urbana Participativa · Videira/SC"
        description="Registre problemas urbanos no mapa de Videira/SC, acompanhe a resolução pela gestão pública e ajude a construir uma cidade mais transparente."
        path="/"
      />
      <Navbar />
      <OnboardingModal />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <HeroCarousel />
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <motion.div initial="hidden" animate="visible" className="max-w-2xl space-y-6">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium border border-primary/30">
              <MapPin className="w-4 h-4" /> Videira · Santa Catarina
            </motion.div>
            <motion.div variants={fadeUp} custom={0.5} className="flex items-center gap-4">
              <img src={zupLogo} alt="Logotipo ZUP — Zeladoria Urbana Participativa" className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-contain bg-white/10 backdrop-blur-sm p-1" />
              <div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-primary-foreground leading-tight">ZUP — Zeladoria Urbana Participativa</h1>
                <p className="text-sm md:text-base text-primary-foreground/70 font-medium">Videira/SC</p>
              </div>
            </motion.div>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-primary-foreground/80 max-w-lg">
              Registre problemas urbanos no mapa de Videira, acompanhe a resolução e contribua para uma cidade mais organizada e transparente.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3">
              <Link to="/mapa">
                <Button size="lg" className="gap-2 font-semibold">
                  <MapPin className="w-5 h-5" /> Ver Mapa de Videira
                </Button>
              </Link>
              <Link to="/cadastro">
                <Button size="lg" variant="outline" className="gap-2 font-semibold bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20">
                  Criar Conta <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="text-2xl md:text-3xl font-extrabold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">Como funciona o ZUP</h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Um processo simples e transparente para a zeladoria urbana participativa de Videira</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: MapPin, title: 'Registre', desc: 'Marque o problema no mapa com foto e descrição. Sua identidade é protegida e anônima para todos.' },
              { icon: Users, title: 'Valide', desc: 'A comunidade confirma a existência do problema, garantindo veracidade e evitando registros falsos.' },
              { icon: Clock, title: 'Acompanhe', desc: 'O órgão responsável recebe a ocorrência, atualiza o andamento e informa a previsão de conclusão.' },
              { icon: CheckCircle2, title: 'Confirme', desc: 'Quando resolvido, a comunidade valida a solução. Transparência do início ao fim.' },
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-xs font-bold text-primary uppercase tracking-wide">Passo {i + 1}</div>
                <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Organs */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-foreground">Órgãos responsáveis em Videira</h2>
            <p className="text-muted-foreground mt-2">Cada ocorrência é direcionada automaticamente ao órgão competente</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Building2, name: 'Prefeitura Municipal', desc: 'Infraestrutura viária, iluminação pública, serviços urbanos, manutenção e obras', color: 'bg-primary' },
              { icon: Droplets, name: 'Água e Saneamento', desc: 'Vazamentos, falta de água, rede de esgoto, tampas danificadas e drenagem', color: 'bg-[hsl(var(--status-execution))]' },
              { icon: Zap, name: 'Energia e Iluminação', desc: 'Falta de energia, postes com risco, fiação exposta, problemas na rede elétrica', color: 'bg-[hsl(var(--status-analysis))]' },
            ].map((organ, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-xl p-6 space-y-3 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${organ.color} flex items-center justify-center`}>
                  <organ.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{organ.name}</h3>
                <p className="text-sm text-muted-foreground">{organ.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-foreground">Benefícios para Videira</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: BarChart3, title: 'Transparência pública', desc: 'Dashboard público com métricas reais de resolução, tempos de resposta e desempenho por bairro.' },
              { icon: Shield, title: 'Participação anônima', desc: 'Cidadãos registram ocorrências com total anonimato. Validação comunitária garante veracidade.' },
              { icon: BarChart3, title: 'Dados para gestão', desc: 'Estatísticas por bairro, categoria e órgão para tomada de decisão informada pela gestão pública.' },
            ].map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-xl p-6 space-y-3">
                <b.icon className="w-8 h-8 text-primary" />
                <h3 className="text-lg font-bold text-foreground">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="hero-gradient rounded-2xl p-8 md:p-16 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary-foreground">Faça parte da zeladoria de Videira</h2>
            <p className="text-primary-foreground/80 max-w-lg mx-auto">
              Crie sua conta gratuitamente, explore o mapa e ajude a construir uma cidade mais organizada e transparente.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/cadastro">
                <Button size="lg" variant="secondary" className="font-semibold">Criar conta agora</Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="font-semibold border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Minha Cidade
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={zupLogo} alt="Logotipo ZUP — Zeladoria Urbana Participativa" className="w-10 h-10 rounded-xl object-contain" />
              <div>
                <span className="font-bold text-foreground text-lg">ZUP</span>
                <span className="text-xs text-muted-foreground ml-2">Zeladoria Urbana Participativa</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 ZUP · Mapa cidadão de Videira/SC</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
