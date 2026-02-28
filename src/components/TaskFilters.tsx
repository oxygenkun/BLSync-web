import type { TaskStatus, TaskQuery } from "../types/task";

interface TaskFiltersProps {
  filter: TaskQuery;
  onChange: (filter: TaskQuery) => void;
  stats?: {
    ready: number;
    consuming: number;
    downloading: number;
    completed: number;
    failed: number;
  };
}

const statusFilters: Array<{ value: TaskStatus | "all"; label: string }> = [
  { value: "all", label: "全部" },
  { value: "ready", label: "准备中" },
  { value: "consuming", label: "执行中" },
  { value: "downloading", label: "下载中" },
  { value: "completed", label: "已完成" },
  { value: "failed", label: "已失败" },
];

export function TaskFilters({ filter, onChange, stats }: TaskFiltersProps) {
  const currentStatus = filter.status || "all";

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
      {statusFilters.map((item) => {
        const count = item.value === "all"
          ? 0
          : stats?.[item.value] || 0;
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
            className={`group relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 shadow-sm"
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{item.label}</span>
              {count > 0 && (
                <span className={`${
                  isActive
                    ? "bg-white/20"
                    : "bg-slate-100 text-slate-600"
                } px-2 py-0.5 rounded-full text-xs font-medium`}>
                  {count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
