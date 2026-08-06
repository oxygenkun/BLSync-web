import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useScanTasks, useTasks, useTaskStats, useUpdateTaskStatus } from "../hooks/useTasks";
import { TaskFilters } from "../components/TaskFilters";
import { TaskTable } from "../components/TaskTable";
import type { TaskQuery } from "../types/task";
import { useTaskProgress } from "../hooks/useTaskProgress";

export function TaskList() {
  const navigate = useNavigate();
  const location = useLocation();

  // 从 URL 解析参数
  const getQueryParams = (): TaskQuery => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get("page") || "1", 10);
    const statusParam = params.get("status");
    const status = (statusParam === "ready" || statusParam === "consuming" || statusParam === "downloading" || statusParam === "completed" || statusParam === "failed")
      ? statusParam
      : undefined;
    return { page, page_size: 20, status };
  };

  const [filter, setFilter] = useState<TaskQuery>(getQueryParams);

  const { data, isLoading } = useTasks(filter);
  const { data: stats } = useTaskStats();
  const updateTaskStatus = useUpdateTaskStatus();
  const scanTasks = useScanTasks();
  const taskProgress = useTaskProgress(data?.items || []);

  const currentPage = filter.page || 1;
  const totalPages = data ? Math.ceil(data.total / (filter.page_size || 20)) : 0;

  // 更新 URL 参数
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.page) params.set("page", filter.page.toString());
    if (filter.status) params.set("status", filter.status);
    const queryString = params.toString();
    navigate(`/?${queryString}`, { replace: true });
  }, [filter, navigate]);

  const handlePageChange = (newPage: number) => {
    setFilter({ ...filter, page: newPage });
  };

  const handleStatusChange = (newFilter: TaskQuery) => {
    setFilter(newFilter);
  };

  return (
    <div className="h-screen flex flex-col animate-fade-in">
      {/* 顶部固定区域：标题 + 筛选 + 分页 */}
      <div className="flex-shrink-0">
        <div className="max-w-6xl mx-auto px-6 pt-6 pb-4">
          {/* 页面标题 */}
          <div className="flex items-end justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">任务列表</h1>
              {data && data.total > 0 && (
                <p className="text-sm text-stone-400 dark:text-stone-500 mt-1">
                  共 <span className="font-semibold text-stone-600 dark:text-stone-300 tabular-nums">{data.total}</span> 个任务
                </p>
              )}
            </div>
            <button
              onClick={() => scanTasks.mutate()}
              disabled={scanTasks.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-paper bg-ink rounded-full hover:opacity-85 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${scanTasks.isPending ? "animate-spin" : ""}`} />
              {scanTasks.isPending ? "扫描中…" : "扫描收藏夹"}
            </button>
          </div>

          {/* 状态筛选 + 分页 */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TaskFilters filter={filter} onChange={handleStatusChange} stats={stats} />

            {data && data.total > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  aria-label="上一页"
                  className="p-2 rounded-full text-stone-500 dark:text-stone-400 hover:text-ink hover:bg-stone-900/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-150"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-2 text-sm tabular-nums">
                  <span className="font-semibold text-ink">{currentPage}</span>
                  <span className="text-stone-300 dark:text-stone-600 mx-1">/</span>
                  <span className="text-stone-400 dark:text-stone-500">{totalPages}</span>
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  aria-label="下一页"
                  className="p-2 rounded-full text-stone-500 dark:text-stone-400 hover:text-ink hover:bg-stone-900/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-150"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 可滚动的表格区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto px-6 pb-6">
          <TaskTable
            tasks={data?.items || []}
            progressByTaskId={taskProgress}
            isLoading={isLoading}
            onStatusChange={async (taskId, status, errorMessage) => {
              await updateTaskStatus.mutateAsync({ taskId, status, errorMessage });
            }}
          />
        </div>
      </div>
    </div>
  );
}
