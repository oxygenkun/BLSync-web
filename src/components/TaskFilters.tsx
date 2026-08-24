import type { TaskStatus, TaskQuery } from "../types/task";

interface TaskFiltersProps {
  filter: TaskQuery;
  onChange: (filter: TaskQuery) => void;
  stats?: {
    ready: number;
    consuming: number;
    downloading: number;
    pausing: number;
    paused: number;
    completed: number;
    failed: number;
  };
}

const statusFilters: Array<{ value: TaskStatus | "all"; label: string }> = [
  { value: "all", label: "全部" },
  { value: "ready", label: "准备中" },
  { value: "consuming", label: "执行中" },
  { value: "downloading", label: "下载中" },
  { value: "pausing", label: "暂停中" },
  { value: "paused", label: "已暂停" },
  { value: "completed", label: "已完成" },
  { value: "failed", label: "已失败" },
];

export function TaskFilters({ filter, onChange, stats }: TaskFiltersProps) {
  const currentStatus = filter.status || "all";

  return (
    <div className="inline-flex flex-wrap gap-1 p-1 rounded-full bg-stone-900/[0.05] dark:bg-white/[0.06] border border-stone-900/[0.04] dark:border-white/[0.06] max-w-full overflow-x-auto custom-scrollbar">
      {statusFilters.map((item) => {
        const count = item.value === "all" ? 0 : stats?.[item.value] || 0;
        const isActive = currentStatus === item.value;

        return (
          <button
            key={item.value}
            onClick={() =>
              onChange({
                ...filter,
                status: item.value === "all" ? undefined : item.value,
                page: 1,
              })
            }
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              isActive
                ? "bg-white dark:bg-white/[0.14] text-ink shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-ink"
            }`}
          >
            <span>{item.label}</span>
            {count > 0 && (
              <span
                className={`px-1.5 py-px rounded-full text-[11px] font-semibold tabular-nums ${
                  isActive
                    ? "bg-accent/15 text-accent-deep"
                    : "bg-stone-900/[0.06] dark:bg-white/10 text-stone-500 dark:text-stone-400"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
