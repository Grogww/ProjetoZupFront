import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { ArrowLeft, LifeBuoy, Clock } from "lucide-react";
import zupLogo from "@/assets/zup-logo.png";

const ForgotPassword = () => {
  return (
    <div className="min-h-dvh bg-background">
      <Seo
        title="Recuperar Senha — ZUP Videira/SC"
        description="A recuperação automática de senha está em implementação. Entre em contato com o suporte do ZUP."
        path="/recuperar-senha"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img
              src={zupLogo}
              alt="Logotipo ZUP — Zeladoria Urbana Participativa"
              className="w-14 h-14 mx-auto mb-2 rounded-xl object-contain"
            />
            <h1 className="text-xl font-semibold leading-none tracking-tight">
              Recuperação de senha em breve
            </h1>
            <CardDescription className="pt-2">
              Esta funcionalidade está em implementação na plataforma do ZUP.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-border bg-muted/40 p-4 flex gap-3">
              <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Por enquanto, para recuperar o acesso à sua conta, entre em contato com a
                nossa equipe de suporte. Iremos validar sua identidade e ajudar a restaurar
                seu acesso o quanto antes.
              </p>
            </div>

            <Link to="/suporte?source=recover" className="block">
              <Button className="w-full">
                <LifeBuoy className="w-4 h-4 mr-2" aria-hidden="true" />
                Falar com o suporte
              </Button>
            </Link>

            <Link
              to="/login"
              className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Voltar para o login
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ForgotPassword;
