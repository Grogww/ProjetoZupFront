import { type Report } from "@/data/mockData";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import ReportImage from "./ReportImage";
import { MapPin, Calendar, ThumbsUp, Building2, RefreshCw } from "lucide-react";

interface ReportCardProps {
  report: Report;
  onClick?: () => void;
}

const ReportCard = ({ report, onClick }: ReportCardProps) => {
  const { getCategoryById, getSubcategoryById, organizationName } = useTaxonomy();
  const category = getCategoryById(report.categoryId);
  const subcategory = getSubcategoryById(report.categoryId, report.subcategoryId);
  const daysAgo = Math.floor((Date.now() - new Date(report.createdAt).getTime()) / 86400000);

  return (
    <div onClick={onClick} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer group">
      <div className="aspect-video relative overflow-hidden">
        <ReportImage report={report} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-2 left-2 flex gap-1.5">
          <StatusBadge status={report.status} />
        </div>
        <div className="absolute top-2 right-2">
          <PriorityBadge priority={report.priority} />
        </div>
        {report.isRecurrence && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-accent/90 text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
            <RefreshCw className="w-2.5 h-2.5" /> Reincidente
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-1">{report.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.neighborhood}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{daysAgo}d atrás</span>
          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{report.upvotes}</span>
          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{organizationName(report.organizationId)}</span>
        </div>
        {category && subcategory && (
          <div className="flex gap-1.5 pt-1">
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{category.name}</span>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{subcategory.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportCard;
