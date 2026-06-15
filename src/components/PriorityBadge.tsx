import { type Priority, priorityLabels } from "@/data/mockData";
import { cn } from "@/lib/utils";

const priorityStyles: Record<Priority, string> = {
  baixa: 'bg-muted text-muted-foreground',
  media: 'bg-[hsl(45,100%,90%)] text-[hsl(45,80%,30%)]',
  alta: 'bg-[hsl(25,90%,90%)] text-[hsl(25,80%,30%)]',
  critica: 'bg-destructive/10 text-destructive',
};

const PriorityBadge = ({ priority, className }: { priority: Priority; className?: string }) => (
  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", priorityStyles[priority], className)}>
    {priorityLabels[priority]}
  </span>
);

export default PriorityBadge;
