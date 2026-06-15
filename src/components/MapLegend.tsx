import { useState } from "react";
import { getStatusColor, statusLabels, type ReportStatus } from "@/data/mockData";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";

const legendStatuses: ReportStatus[] = ['pending', 'awaiting_validation', 'in_analysis', 'in_progress', 'resolved', 'resolution_validated', 'resolution_rejected', 'closed'];

const MapLegend = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-[600] bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg max-w-[220px]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-foreground"
      >
        <span>Legenda do Mapa</span>
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-border pt-2">
          {legendStatuses.map(status => (
            <div key={status} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: getStatusColor(status) }} />
              <span className="text-[11px] text-muted-foreground">{statusLabels[status]}</span>
            </div>
          ))}
          <div className="border-t border-border pt-1.5 mt-1.5">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground">Relógio = tempo de acompanhamento</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLegend;
