import { useState } from "react";
import { ImageOff } from "lucide-react";
import { useReportImage } from "@/hooks/useReportImage";
import type { Report } from "@/data/mockData";

interface ReportImageProps {
  report: Pick<Report, "id" | "imageUrl" | "title">;
  /** Classes aplicadas tanto à <img> quanto ao placeholder (mantém o mesmo tamanho/borda). */
  className?: string;
  alt?: string;
}

// Foto da ocorrência com fallback gracioso. A imagem é hidratada do endpoint de
// detalhe quando a listagem não a trouxe (useReportImage). Se não houver foto ou
// o carregamento falhar, mostra um placeholder em vez de imagem quebrada.
const ReportImage = ({ report, className, alt }: ReportImageProps) => {
  const url = useReportImage(report);
  const [errored, setErrored] = useState(false);

  if (!url || errored) {
    return (
      <div className={`flex items-center justify-center bg-muted text-muted-foreground ${className ?? ""}`}>
        <ImageOff className="w-8 h-8 opacity-40" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt ?? report.title ?? ""}
      className={className}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
};

export default ReportImage;
