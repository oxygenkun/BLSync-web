import type { TaskStatus } from "../types/task";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const statusConfig: Record<
  TaskStatus,
  { label: string; dot: string; pulse?: boolean }
> = {
  ready: {
    label: "准备中",
    dot: "bg-stone-400",
  },
  consuming: {
    label: "执行中",
    dot: "bg-amber-500",
    pulse: true,
  },
  downloading: {
    label: "下载中",
    dot: "bg-sky-500",
    pulse: true,
  },
  pausing: {
    label: "暂停中",
    dot: "bg-amber-500",
    pulse: true,
  },
  paused: {
    label: "已暂停",
    dot: "bg-stone-400",
  },
  completed: {
    label: "已完成",
    dot: "bg-emerald-500",
  },
  failed: {
    label: "失败",
    dot: "bg-rose-500",
  },
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-stone-600 dark:text-stone-300 bg-surface border border-stone-200/80 dark:border-stone-700">
      <span className="relative flex h-1.5 w-1.5">
        {config.pulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${config.dot}`}
          />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${config.dot}`} />
      </span>
      {config.label}
    </span>
  );
}
