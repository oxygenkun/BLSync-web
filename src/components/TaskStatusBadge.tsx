import type { TaskStatus } from "../types/task";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const statusConfig: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "等待中",
    className: "bg-amber-50 text-amber-700 border-amber-200"
  },
  executing: {
    label: "下载中",
    className: "bg-blue-50 text-blue-700 border-blue-200"
  },
  completed: {
    label: "已完成",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  failed: {
    label: "失败",
    className: "bg-red-50 text-red-700 border-red-200"
  },
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.className} shadow-sm`}
    >
      {config.label}
    </span>
  );
}
