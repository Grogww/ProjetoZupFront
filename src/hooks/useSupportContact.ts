import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SupportContact {
  phone: string;
  email: string;
  whatsapp: string;
  hours: string;
  address: string;
  response_sla: string;
}

const FALLBACK: SupportContact = {
  phone: "(49) 3566-9000",
  email: "suporte@zup.videira.sc.gov.br",
  whatsapp: "5549999999999",
  hours: "Seg–Sex, 08h às 17h",
  address: "Prefeitura Municipal de Videira/SC",
  response_sla: "Resposta em até 2 dias úteis",
};

export function useSupportContact() {
  return useQuery({
    queryKey: ["app_settings", "support_contact"],
    queryFn: async (): Promise<SupportContact> => {
      try {
        const data = await api.get<{ value?: Partial<SupportContact> } | Partial<SupportContact>>(
          "/app-settings/support_contact",
          { auth: false }
        );
        const value = (data as any)?.value ?? data;
        return { ...FALLBACK, ...(value ?? {}) };
      } catch {
        return FALLBACK;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
