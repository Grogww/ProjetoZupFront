import type { OrganType } from "./mockData";

export interface OrganMetadata {
  id: OrganType;
  name: string;
  shortName: string;
  description: string;
  accentColor: string; // HSL
}

export const organConfig: Record<OrganType, OrganMetadata> = {
  prefeitura: {
    id: "prefeitura",
    name: "Prefeitura Municipal de Videira",
    shortName: "Prefeitura",
    description: "Infraestrutura urbana, iluminação pública, serviços, vandalismo e zeladoria geral",
    accentColor: "262 60% 45%",
  },
  agua_saneamento: {
    id: "agua_saneamento",
    name: "Água e Saneamento (VISAN)",
    shortName: "VISAN",
    description: "Vazamentos, falta de água, esgoto e tampas de bueiro",
    accentColor: "200 70% 45%",
  },
  energia_luz: {
    id: "energia_luz",
    name: "Energia e Iluminação (CELESC)",
    shortName: "CELESC",
    description: "Falta de energia, fiação exposta, postes com risco e problemas elétricos visíveis",
    accentColor: "38 92% 50%",
  },
};

export const organList = Object.values(organConfig);
