import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { ArrowLeft, LifeBuoy, Loader2, MailCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { forgotPassword } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import zupLogo from "@/assets/zup-logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) {
      toast({ title: "E-mail inválido", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email);
      // Mensagem neutra: não revelamos se o e-mail está cadastrado.
      setSent(true);
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : err?.message || "Tente novamente em instantes";
      toast({ title: "Erro ao solicitar recuperação", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <Seo
        title="Recuperar Senha — ZUP Videira/SC"
        description="Informe seu e-mail para receber o link de redefinição de senha do ZUP."
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
              {sent ? "Verifique seu e-mail" : "Recuperar senha"}
            </h1>
            <CardDescription className="pt-2">
              {sent
                ? "Se o e-mail informado estiver cadastrado, enviamos um link para você redefinir sua senha."
                : "Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {sent ? (
              <>
                <div className="rounded-lg border border-border bg-muted/40 p-4 flex gap-3">
                  <MailCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">
                    O link expira após algumas horas. Não recebeu? Verifique a caixa de spam ou
                    tente novamente em instantes.
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
                  Enviar para outro e-mail
                </Button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar link de recuperação"}
                </Button>
              </form>
            )}

            <Link to="/suporte?source=recover" className="block">
              <Button variant="ghost" className="w-full text-muted-foreground">
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
