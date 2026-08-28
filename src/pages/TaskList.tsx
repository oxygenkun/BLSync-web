import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RefreshCw, ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import { useScanTasks, useTasks, useTaskStats, useUpdateTaskStatus, usePauseTask, useResumeTask, useBatchUpdateTaskStatus, useBatchDeleteTasks } from "../hooks/useTasks";
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
    const status = (statusParam === "ready" || statusParam === "consuming" || statusParam === "downloading" || statusParam === "pausing" || statusParam === "paused" || statusParam === "completed" || statusParam === "failed")
      ? statusParam
      : undefined;
    return { page, page_size: 20, status };
  };

  const [filter, setFilter] = useState<TaskQuery>(getQueryParams);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data, isLoading } = useTasks(filter);
  const { data: stats } = useTaskStats();
  const updateTaskStatus = useUpdateTaskStatus();
  const pauseTask = usePauseTask();
  const resumeTask = useResumeTask();
  const batchUpdateTaskStatus = useBatchUpdateTaskStatus();
  const batchDeleteTasks = useBatchDeleteTasks();
  const scanTasks = useScanTasks();
  const taskProgress = useTaskProgress(data?.items || []);

  const currentPage = filter.page || 1;
  const totalPages = data ? Math.ceil(data.total / (filter.page_size || 20)) : 0;

  // 筛选/翻页变化时清空选中，避免误操作不可见的行
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filter]);

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

  const handlePause = async (taskId: number) => {
    await pauseTask.mutateAsync(taskId);
  };

  const handleResume = async (taskId: number) => {
    await resumeTask.mutateAsync(taskId);
  };

  const handleBatchResult = (result: { succeeded: number[]; failed: { task_id: number; detail: string }[] }) => {
    if (result.failed.length > 0) {
      alert(`部分操作失败：${result.failed.map((f) => `任务 ${f.task_id}（${f.detail}）`).join("、")}`);
    }
    setSelectedIds(new Set());
  };

  const handleBatchStatusChange = async (status: string) => {
    if (selectedIds.size === 0 || !status) return;
    const mutableTaskIds = (data?.items ?? [])
      .filter((task) => selectedIds.has(task.id) && task.status !== "completed")
      .map((task) => task.id);
    if (mutableTaskIds.length === 0) return;
    const errorMessage = status === "failed" ? "手动批量设置为失败" : undefined;
    const result = await batchUpdateTaskStatus.mutateAsync({
      taskIds: mutableTaskIds,
      status,
      errorMessage,
    });
    handleBatchResult(result);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`确定删除选中的 ${selectedIds.size} 个任务吗？此操作不可恢复。`)) return;
    const result = await batchDeleteTasks.mutateAsync([...selectedIds]);
    handleBatchResult(result);
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

          {/* 批量操作栏 */}
          {selectedIds.size > 0 && (
            <div className="mt-3 flex items-center gap-3 flex-wrap rounded-2xl border border-accent/30 bg-accent/[0.06] px-4 py-2.5">
              <span className="text-sm text-ink">
                已选 <span className="font-semibold tabular-nums">{selectedIds.size}</span> 项
              </span>
              <select
                value=""
                onChange={(e) => {
                  void handleBatchStatusChange(e.target.value);
                  e.target.value = "";
                }}
                disabled={batchUpdateTaskStatus.isPending}
                className="h-8 pl-2.5 pr-7 text-[13px] bg-white dark:bg-white/[0.06] border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 font-medium text-stone-600 dark:text-stone-300 cursor-pointer"
              >
                <option value="" disabled>
                  {batchUpdateTaskStatus.isPending ? "处理中…" : "批量修改状态"}
                </option>
                <option value="ready">准备中</option>
                <option value="consuming">执行中</option>
                <option value="downloading">下载中</option>
                <option value="completed">已完成</option>
                <option value="failed">失败</option>
              </select>
              <span className="text-xs text-stone-400 dark:text-stone-500">已完成任务不会修改状态</span>
              <button
                onClick={handleBatchDelete}
                disabled={batchDeleteTasks.isPending}
                className="flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {batchDeleteTasks.isPending ? "删除中…" : "批量删除"}
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-1 h-8 px-2.5 text-[13px] text-stone-400 dark:text-stone-500 hover:text-ink rounded-lg hover:bg-stone-900/5 dark:hover:bg-white/10 transition-all duration-150"
              >
                <X className="w-3.5 h-3.5" />
                取消选择
              </button>
            </div>
          )}
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
            onPause={handlePause}
            onResume={handleResume}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </div>
      </div>
    </div>
  );
}
