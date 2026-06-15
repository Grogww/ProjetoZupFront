import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { loginWithCpf } from "@/lib/auth-api";
import { useAuth, isInstitutional } from "@/hooks/useAuth";
import { mapRoles } from "@/lib/auth-api";
import { formatCPF, validateCPF } from "@/lib/validators";
import { ApiError } from "@/lib/api";

const GestaoLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reason = (location.state as any)?.reason;
  const { setSessionUser, signOut } = useAuth();
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCPF(cpf)) {
      toast({ title: "CPF inválido", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const session = await loginWithCpf(cpf, password);
      const { roles } = mapRoles(session.user);
      if (!isInstitutional(roles)) {
        await signOut();
        toast({
          title: "Sem acesso institucional",
          description: "Esta conta não tem permissão para a área de gestão.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      setSessionUser(session.user);
      toast({ title: "Acesso institucional autorizado" });
      navigate("/gestao", { replace: true });
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : err?.message || "Credenciais inválidas";
      toast({ title: "Erro ao entrar", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="w-full max-w-md border-primary/20">
          <CardHeader className="text-center">
            <div className="w-14 h-14 mx-auto mb-2 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Acesso Institucional</CardTitle>
            <CardDescription>Área restrita para gestões públicas: Prefeitura, Água/Saneamento e Energia/Luz</CardDescription>
          </CardHeader>
          <CardContent>
            {reason === "no_access" && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Sua conta atual não tem permissão para acessar a ala de gestões.
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="cpf">CPF institucional</Label>
                <Input
                  id="cpf"
                  value={cpf}
                  onChange={e => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
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
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar como gestão"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                É cidadão? <Link to="/login" className="text-primary font-medium hover:underline">Acessar área pública</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GestaoLogin;
