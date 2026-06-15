import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Eye, EyeOff, AlertCircle, Info, Loader2 } from "lucide-react";
import { formatCPF, formatPhone, formatCEP, validateCPF, validatePhone, validateCEP } from "@/lib/validators";
import { toast } from "@/hooks/use-toast";
import zupLogo from "@/assets/zup-logo.png";
import { registerUser, loginWithCpf } from "@/lib/auth-api";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";

const Register = () => {
  const navigate = useNavigate();
  const { setSessionUser } = useAuth();
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [email, setEmail] = useState("");
  const [enable2FA, setEnable2FA] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Nome obrigatório';
    if (!validateCPF(cpf)) newErrors.cpf = 'CPF inválido';
    if (!validatePhone(phone)) newErrors.phone = 'Telefone inválido';
    if (!validateCEP(cep)) newErrors.cep = 'CEP inválido';
    if (password.length < 8) newErrors.password = 'Mínimo 8 caracteres';
    if (!email || !/.+@.+\..+/.test(email)) newErrors.email = 'E-mail inválido';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      // O back só persiste name/email/cpf/password/neighborhood_id (item 18).
      // phone, cep e 2FA são coletados na UI mas ainda não têm suporte no back —
      // não são enviados (evita o "silenciosamente ignorado").
      await registerUser({ name, email, cpf, password });
      // Backend de register não retorna sessão; fazemos login em seguida.
      const session = await loginWithCpf(cpf, password);
      setSessionUser(session.user);
      toast({ title: "Conta criada com sucesso!", description: "Bem-vindo(a) ao ZUP." });
      navigate("/painel", { replace: true });
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : err?.message || "Falha no cadastro";
      toast({ title: "Erro ao criar conta", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Criar Conta — ZUP Videira/SC" description="Cadastre-se na ZUP para registrar e acompanhar ocorrências urbanas de Videira/SC junto com a gestão pública." path="/cadastro" />
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <img src={zupLogo} alt="Logotipo ZUP — Zeladoria Urbana Participativa" className="w-14 h-14 mx-auto mb-2 rounded-xl object-contain" />
            <h1 className="text-xl font-semibold leading-none tracking-tight">Criar conta no ZUP</h1>
            <CardDescription>Participe da zeladoria urbana de Videira/SC</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome completo *</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" required />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input id="cpf" value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} required />
                {errors.cpf && <p className="text-xs text-destructive mt-1">{errors.cpf}</p>}
              </div>

              <div>
                <Label htmlFor="cep">CEP *</Label>
                <Input id="cep" value={cep} onChange={e => setCep(formatCEP(e.target.value))} placeholder="00000-000" maxLength={9} required />
                {errors.cep && <p className="text-xs text-destructive mt-1">{errors.cep}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} required />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>

              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
                <p className="text-xs text-muted-foreground mt-1">Usado para recuperação de senha e 2FA</p>
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>

              {email && (
                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Ativar 2FA por e-mail</p>
                    <p className="text-xs text-muted-foreground">Código de verificação a cada login</p>
                  </div>
                  <Switch checked={enable2FA} onCheckedChange={setEnable2FA} />
                </div>
              )}

              <div>
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required />
                  <button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
              </div>

              <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Perfil territorial</p>
                  <p>Após criar sua conta, você poderá declarar suas localidades (moradia, trabalho, estudo) para registrar ocorrências no mapa.</p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Seus dados pessoais são protegidos. Sua identidade é anônima para outros usuários e órgãos públicos.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar conta"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Já tem conta? <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
