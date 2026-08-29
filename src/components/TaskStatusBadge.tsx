import type { TaskStatus } from "../types/task";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  progress?: number | null;
  episodeProgress?: string | null;
  speed?: string;
}

const statusConfig: Record<
  TaskStatus,
  { label: string; dot: string; fill: string; pulse?: boolean }
> = {
  ready: {
    label: "准备中",
    dot: "bg-stone-400",
    fill: "bg-stone-200/70 dark:bg-stone-700/60",
  },
  consuming: {
    label: "执行中",
    dot: "bg-amber-500",
    fill: "bg-amber-100/90 dark:bg-amber-900/35",
    pulse: true,
  },
  downloading: {
    label: "下载中",
    dot: "bg-sky-500",
    fill: "bg-sky-100/90 dark:bg-sky-900/35",
    pulse: true,
  },
  pausing: {
    label: "暂停中",
    dot: "bg-amber-500",
    fill: "bg-amber-100/90 dark:bg-amber-900/35",
    pulse: true,
  },
  paused: {
    label: "已暂停",
    dot: "bg-stone-400",
    fill: "bg-stone-200/70 dark:bg-stone-700/60",
  },
  completed: {
    label: "已完成",
    dot: "bg-emerald-500",
    fill: "bg-emerald-100/80 dark:bg-emerald-900/35",
  },
  failed: {
    label: "失败",
    dot: "bg-rose-500",
    fill: "bg-rose-100/80 dark:bg-rose-900/35",
  },
};

export function TaskStatusBadge({
  status,
  progress,
  episodeProgress = null,
  speed = "–",
}: TaskStatusBadgeProps) {
  const config = statusConfig[status];
  const showProgress = status !== "completed" && status !== "failed";
  const percent = Math.min(Math.max(progress ?? 0, 0), 100);

  if (!showProgress) {
    return (
      <span
        aria-label={config.label}
        className="relative inline-flex h-7 items-center gap-1.5 rounded-full border border-stone-200/80 bg-surface px-2.5 text-xs font-medium text-stone-600 dark:border-stone-700 dark:text-stone-300"
      >
        <StatusDot dot={config.dot} pulse={config.pulse} />
        {config.label}
      </span>
    );
  }

  return (
    <span
      aria-label={[`${config.label} ${percent.toFixed(1)}%`, episodeProgress, speed].filter(Boolean).join("，")}
      className="status-progress-pill relative inline-flex h-7 w-full max-w-48 overflow-hidden rounded-full border border-stone-200/80 bg-surface text-stone-600 dark:border-stone-700 dark:text-stone-300"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 transition-[width] duration-300 ${config.fill}`}
        style={{ width: `${percent}%` }}
      />
      <span className="status-progress-content relative z-10 flex w-full min-w-0 flex-nowrap items-center gap-1.5 px-2.5">
        <span className="status-progress-label inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium">
          <StatusDot dot={config.dot} pulse={config.pulse} />
          {config.label}
        </span>
        {episodeProgress && (
          <span className="status-progress-episode shrink-0 whitespace-nowrap text-[10px] font-normal tabular-nums text-stone-400 dark:text-stone-500">
            {episodeProgress}
          </span>
        )}
        <span className="status-progress-details flex min-w-0 flex-1 items-center justify-end text-[10px] text-stone-400 dark:text-stone-500">
          <span className="status-progress-speed min-w-0 truncate tabular-nums">{speed}</span>
        </span>
        <span className="status-progress-percent shrink-0 whitespace-nowrap text-[10px] font-semibold tabular-nums text-ink dark:text-stone-100">
          {percent.toFixed(0)}%
        </span>
      </span>
    </span>
  );
}

function StatusDot({ dot, pulse }: { dot: string; pulse?: boolean }) {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      {pulse && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dot}`}
        />
      )}
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dot}`} />
    </span>
  );
}
