import { type ReportStatus, statusLabels } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Clock, Wrench, CheckCircle2, CheckCheck, XCircle, Hourglass, Archive, Search, ThumbsUp } from "lucide-react";

const statusConfig: Record<ReportStatus, { class: string; icon: React.ElementType }> = {
  pending: { class: 'status-badge-awaiting', icon: Hourglass },
  awaiting_validation: { class: 'status-badge-awaiting', icon: Hourglass },
  validated: { class: 'status-badge-awaiting', icon: ThumbsUp },
  in_analysis: { class: 'status-badge-analysis', icon: Search },
  in_progress: { class: 'status-badge-execution', icon: Wrench },
  resolved: { class: 'status-badge-resolved', icon: CheckCircle2 },
  resolution_validated: { class: 'status-badge-validated', icon: CheckCheck },
  resolution_rejected: { class: 'status-badge-rejected', icon: XCircle },
  closed: { class: 'status-badge-archived', icon: Archive },
};

interface StatusBadgeProps {
  status: ReportStatus;
  size?: 'sm' | 'md';
  className?: string;
}

const StatusBadge = ({ status, size = 'sm', className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full font-semibold",
      size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      config.class,
      className
    )}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {statusLabels[status]}
    </span>
  );
};

export default StatusBadge;
