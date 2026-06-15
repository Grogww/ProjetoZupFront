import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Loader2, CheckCircle2 } from "lucide-react";

const CATEGORIES = [
  { value: "conta", label: "Conta e Acesso" },
  { value: "denuncia", label: "Denúncia" },
  { value: "validacao", label: "Validação" },
  { value: "tecnico", label: "Problema Técnico" },
  { value: "privacidade", label: "Privacidade / LGPD" },
  { value: "sugestao", label: "Sugestão" },
  { value: "outro", label: "Outro" },
];

const ALLOWED_SOURCES = ["navbar", "fab", "footer", "direct", "other"] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  category: z.string().min(1, "Escolha uma categoria"),
  subject: z.string().trim().min(3, "Assunto muito curto").max(200),
  message: z.string().trim().min(10, "Descreva com pelo menos 10 caracteres").max(2000),
  report_id: z.string().trim().max(64).optional().or(z.literal("")),
  consent: z.literal(true, { errorMap: () => ({ message: "É necessário aceitar o uso dos dados" }) }),
});

const RATE_KEY = "zup_support_last_send";
const RATE_MS = 60_000;

const ContactForm = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const rawSource = searchParams.get("source") ?? "direct";
  const source = (ALLOWED_SOURCES as readonly string[]).includes(rawSource) ? rawSource : "other";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    subject: "",
    message: "",
    report_id: "",
    consent: false,
    website: "", // honeypot
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [protocol, setProtocol] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.name || "",
        email: f.email || user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.website) return; // honeypot

    const last = Number(sessionStorage.getItem(RATE_KEY) || 0);
    if (Date.now() - last < RATE_MS) {
      toast.error("Aguarde alguns segundos antes de enviar novamente.");
      return;
    }

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        const k = err.path[0]?.toString() ?? "form";
        errs[k] = err.message;
      });
      setErrors(errs);
      toast.error("Verifique os campos do formulário.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.post<{ protocol_number?: string; protocol?: string }>(
        "/support/messages",
        {
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone || null,
          category: parsed.data.category,
          subject: parsed.data.subject,
          message: parsed.data.message,
          report_id: parsed.data.report_id || null,
          source,
          consent_accepted: true,
          consent_accepted_at: new Date().toISOString(),
          metadata: {
            user_agent: navigator.userAgent,
            page_url: window.location.href,
            locale: navigator.language,
          },
        },
        { auth: !!user }
      );

      const protocolNumber = data?.protocol_number ?? data?.protocol ?? null;
      sessionStorage.setItem(RATE_KEY, String(Date.now()));
      setProtocol(protocolNumber);
      toast.success(protocolNumber ? `Mensagem enviada! Protocolo ${protocolNumber}` : "Mensagem enviada!");
      setForm({
        name: form.name,
        email: form.email,
        phone: "",
        category: "",
        subject: "",
        message: "",
        report_id: "",
        consent: false,
        website: "",
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Não foi possível enviar sua mensagem. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (protocol) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-primary mx-auto" aria-hidden="true" />
        <h3 className="text-xl font-bold text-foreground">Mensagem recebida!</h3>
        <p className="text-muted-foreground">
          Seu protocolo é <span className="font-mono font-semibold text-foreground">{protocol}</span>.
          Guarde este número para acompanhamento.
        </p>
        <p className="text-sm text-muted-foreground">Resposta em até 2 dias úteis pelo e-mail informado.</p>
        <Button variant="outline" onClick={() => setProtocol(null)}>Enviar outra mensagem</Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4" noValidate>
      <h3 className="text-xl font-bold text-foreground">Enviar uma mensagem</h3>

      {/* honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={form.website}
        onChange={(e) => handleChange("website", e.target.value)}
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sup-name">Nome *</Label>
          <Input id="sup-name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} aria-invalid={!!errors.name} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sup-email">E-mail *</Label>
          <Input id="sup-email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} aria-invalid={!!errors.email} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sup-phone">Telefone (opcional)</Label>
          <Input id="sup-phone" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="(49) 99999-9999" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sup-category">Categoria *</Label>
          <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
            <SelectTrigger id="sup-category" aria-invalid={!!errors.category}>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sup-subject">Assunto *</Label>
        <Input id="sup-subject" value={form.subject} onChange={(e) => handleChange("subject", e.target.value)} aria-invalid={!!errors.subject} />
        {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sup-report">ID da ocorrência (opcional)</Label>
        <Input id="sup-report" value={form.report_id} onChange={(e) => handleChange("report_id", e.target.value)} placeholder="Cole o ID da denúncia, se houver" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sup-message">Mensagem *</Label>
        <Textarea
          id="sup-message"
          rows={6}
          value={form.message}
          onChange={(e) => handleChange("message", e.target.value)}
          maxLength={2000}
          aria-invalid={!!errors.message}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          {errors.message ? <span className="text-destructive">{errors.message}</span> : <span>Mínimo 10 caracteres</span>}
          <span>{form.message.length}/2000</span>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3">
        <Checkbox
          id="sup-consent"
          checked={form.consent}
          onCheckedChange={(v) => handleChange("consent", v === true)}
          aria-invalid={!!errors.consent}
        />
        <Label htmlFor="sup-consent" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
          Concordo que meus dados (nome, e-mail, telefone e mensagem) sejam utilizados <strong className="text-foreground">apenas para atendimento do suporte</strong> do ZUP,
          conforme a Política de Privacidade e a <strong className="text-foreground">Lei nº 13.709/2018 (LGPD)</strong>. Posso solicitar exclusão a qualquer momento.
        </Label>
      </div>
      {errors.consent && <p className="text-xs text-destructive -mt-2">{errors.consent}</p>}

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...
          </>
        ) : (
          "Enviar mensagem"
        )}
      </Button>
    </form>
  );
};

export default ContactForm;
