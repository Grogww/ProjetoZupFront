import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { formatCPF, validateCPF } from "@/lib/validators";
import { toast } from "@/hooks/use-toast";
import zupLogo from "@/assets/zup-logo.png";
import { loginWithCpf } from "@/lib/auth-api";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setSessionUser } = useAuth();
  const from = (location.state as any)?.from?.pathname || "/painel";

  const looksLikeEmail = identifier.includes("@");

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d/.test(value.replace(/\D/g, "")) && !value.includes("@")) {
      setIdentifier(formatCPF(value));
    } else {
      setIdentifier(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (looksLikeEmail) {
      toast({
        title: "Use seu CPF",
        description: "O acesso à área pública é feito com CPF + senha.",
        variant: "destructive",
      });
      return;
    }
    if (!validateCPF(identifier)) {
      toast({ title: "CPF inválido", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const session = await loginWithCpf(identifier, password);
      setSessionUser(session.user);
      toast({ title: "Login realizado!", description: "Bem-vindo(a) ao ZUP." });
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : err?.message || "Credenciais inválidas";
      toast({ title: "Erro ao entrar", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Entrar no ZUP — Login Cidadão" description="Acesse sua conta ZUP com CPF para registrar e acompanhar ocorrências em Videira/SC." path="/login" />
      <Navbar />
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={zupLogo} alt="Logotipo ZUP — Zeladoria Urbana Participativa" className="w-14 h-14 mx-auto mb-2 rounded-xl object-contain" />
            <h1 className="text-xl font-semibold leading-none tracking-tight">Entrar no ZUP</h1>
            <CardDescription>Use seu CPF para acessar a plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="identifier">CPF</Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={handleIdentifierChange}
                  placeholder="000.000.000-00"
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
              </Button>
              <div className="text-center space-y-2">
                <Link to="/recuperar-senha" className="text-sm text-primary font-medium hover:underline block">
                  Esqueci minha senha
                </Link>
                <p className="text-sm text-muted-foreground">
                  Não tem conta? <Link to="/cadastro" className="text-primary font-medium hover:underline">Criar conta</Link>
                </p>
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  É de algum órgão público? <Link to="/gestao/login" className="text-primary font-medium hover:underline">Acesso institucional</Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
