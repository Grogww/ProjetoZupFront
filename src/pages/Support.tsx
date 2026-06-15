import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Seo from "@/components/Seo";
import FaqAccordion from "@/components/support/FaqAccordion";
import ContactForm from "@/components/support/ContactForm";
import ContactInfo from "@/components/support/ContactInfo";
import SupportFooter from "@/components/support/SupportFooter";
import { FileText, ShieldCheck, Activity, KeyRound, Lock, MessageSquare } from "lucide-react";

const shortcuts = [
  { href: "#denuncias", icon: FileText, title: "Como abrir uma denúncia", desc: "Passo a passo para criar e publicar" },
  { href: "#validacao", icon: ShieldCheck, title: "Como validar denúncias", desc: "Entenda o processo comunitário" },
  { href: "#status", icon: Activity, title: "Acompanhar status", desc: "O que significa cada etapa" },
  { href: "#conta", icon: KeyRound, title: "Login e acesso", desc: "Cadastro, senha e CPF" },
  { href: "#privacidade", icon: Lock, title: "Privacidade", desc: "LGPD e anonimato" },
  { href: "#contato", icon: MessageSquare, title: "Falar com o suporte", desc: "Telefone, e-mail e formulário" },
];

const Support = () => {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Seo
        title="Central de Ajuda — ZUP"
        description="Tire dúvidas sobre o ZUP, aprenda a abrir denúncias, validar ocorrências e fale com o suporte da Zeladoria Urbana Participativa de Videira/SC."
        path="/suporte"
      />
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
          <div className="container mx-auto px-4 py-12 sm:py-16 text-center max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">Central de Ajuda</h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground">
              Encontre respostas rápidas, aprenda a usar o ZUP e fale com o suporte da Prefeitura de Videira.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-10 space-y-12">
          {/* Atalhos */}
          <section aria-label="Atalhos rápidos">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shortcuts.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.href}
                    href={s.href}
                    className="group flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">{s.title}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>

          {/* FAQ */}
          <FaqAccordion />

          {/* Contato */}
          <section id="contato" className="grid lg:grid-cols-2 gap-6">
            <ContactInfo />
            <ContactForm />
          </section>

          {/* Links úteis */}
          <section aria-labelledby="links-uteis">
            <h2 id="links-uteis" className="text-xl font-bold text-foreground mb-4">Links úteis</h2>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link to="/" className="px-3 py-2 rounded-md border border-border bg-card hover:bg-muted">Página inicial</Link>
              <Link to="/painel" className="px-3 py-2 rounded-md border border-border bg-card hover:bg-muted">Meu Painel</Link>
              <Link to="/dashboard" className="px-3 py-2 rounded-md border border-border bg-card hover:bg-muted">Minha Cidade</Link>
              <Link to="/mapa" className="px-3 py-2 rounded-md border border-border bg-card hover:bg-muted">Mapa</Link>
            </div>
          </section>
        </div>
      </main>

      <SupportFooter />
    </div>
  );
};

export default Support;
