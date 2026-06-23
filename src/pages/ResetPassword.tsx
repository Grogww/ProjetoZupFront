import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { resetPassword } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import zupLogo from "@/assets/zup-logo.png";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Senha muito curta", description: "Mínimo 8 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "As senhas não conferem", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      toast({ title: "Senha redefinida!", description: "Faça login com sua nova senha." });
      navigate("/login", { replace: true });
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : err?.message || "Não foi possível redefinir a senha";
      toast({ title: "Erro ao redefinir senha", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <Seo
        title="Redefinir Senha — ZUP Videira/SC"
        description="Defina uma nova senha para sua conta ZUP."
        path="/reset-password"
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
            <h1 className="text-xl font-semibold leading-none tracking-tight">Redefinir senha</h1>
            <CardDescription className="pt-2">Escolha uma nova senha para acessar o ZUP.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!token ? (
              <>
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
                  <p className="text-sm text-muted-foreground">
                    Link inválido ou expirado. Solicite um novo link de recuperação.
                  </p>
                </div>
                <Link to="/recuperar-senha" className="block">
                  <Button className="w-full">Solicitar novo link</Button>
                </Link>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password">Nova senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm">Confirmar nova senha</Label>
                  <Input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Redefinir senha"}
                </Button>
              </form>
            )}

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

export default ResetPassword;
