import { useState, useEffect, type FormEvent } from "react";
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
  const [pageInput, setPageInput] = useState(() => String(filter.page || 1));

  const { data, isFetching, isLoading } = useTasks(filter);
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

  // 更新 URL 参数
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.page) params.set("page", filter.page.toString());
    if (filter.status) params.set("status", filter.status);
    const queryString = params.toString();
    navigate(`/?${queryString}`, { replace: true });
  }, [filter, navigate]);

  const handlePageChange = (newPage: number) => {
    setSelectedIds(new Set());
    setPageInput(String(newPage));
    setFilter({ ...filter, page: newPage });
  };

  const handlePageJump = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requestedPage = Number.parseInt(pageInput, 10);
    if (Number.isNaN(requestedPage)) {
      setPageInput(String(currentPage));
      return;
    }

    const targetPage = Math.min(Math.max(requestedPage, 1), totalPages);
    if (targetPage !== currentPage) {
      handlePageChange(targetPage);
    } else {
      setPageInput(String(targetPage));
    }
  };

  const handleStatusChange = (newFilter: TaskQuery) => {
    setSelectedIds(new Set());
    setPageInput(String(newFilter.page || 1));
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
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden animate-fade-in">
      {/* 顶部固定区域：标题 + 筛选 + 分页 */}
      <div className="flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
          {/* 页面标题 */}
          <div className="flex items-end justify-between mb-5">
            <h1 className="text-2xl font-bold tracking-tight text-ink">任务列表</h1>
            <button
              onClick={() => scanTasks.mutate()}
              disabled={scanTasks.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-paper bg-ink rounded-full hover:opacity-85 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-[opacity,transform,box-shadow] duration-150 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
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
                  className="p-2 rounded-full text-stone-500 dark:text-stone-400 hover:text-ink hover:bg-stone-900/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-[color,background-color,opacity] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <form
                  onSubmit={handlePageJump}
                  className="flex items-center px-1 text-sm tabular-nums"
                  title="点击当前页码，输入后按回车跳转"
                >
                  <input
                    id="task-page-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pageInput}
                    onChange={(event) => setPageInput(event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                    onBlur={() => setPageInput(String(currentPage))}
                    className="h-7 w-8 rounded-md bg-transparent px-0.5 text-center font-semibold text-ink transition-[background-color,box-shadow] hover:bg-stone-900/5 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 dark:hover:bg-white/[0.06] dark:focus:bg-white/[0.08]"
                    aria-label={`当前第 ${currentPage} 页，可输入 1 到 ${totalPages} 后按回车跳转`}
                  />
                  <span className="mx-1 text-stone-300 dark:text-stone-600">/</span>
                  <span className="text-stone-400 dark:text-stone-500">{totalPages}</span>
                </form>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  aria-label="下一页"
                  className="p-2 rounded-full text-stone-500 dark:text-stone-400 hover:text-ink hover:bg-stone-900/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-[color,background-color,opacity] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
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
                aria-label="批量修改任务状态"
                value=""
                onChange={(e) => {
                  void handleBatchStatusChange(e.target.value);
                  e.target.value = "";
                }}
                disabled={batchUpdateTaskStatus.isPending}
                className="h-8 pl-2.5 pr-7 text-[13px] bg-white dark:bg-white/[0.06] border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-[color,background-color,border-color,opacity] duration-150 font-medium text-stone-600 dark:text-stone-300 cursor-pointer"
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
                className="flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-[color,background-color,border-color,opacity,transform] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {batchDeleteTasks.isPending ? "删除中…" : "批量删除"}
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-1 h-8 px-2.5 text-[13px] text-stone-400 dark:text-stone-500 hover:text-ink rounded-lg hover:bg-stone-900/5 dark:hover:bg-white/10 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <X className="w-3.5 h-3.5" />
                取消选择
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 可滚动的表格区域 */}
      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6">
          <TaskTable
            tasks={data?.items || []}
            progressByTaskId={taskProgress}
            isLoading={isLoading}
            isRefreshing={isFetching && !isLoading}
            onStatusChange={async (taskId, status, errorMessage) => {
              await updateTaskStatus.mutateAsync({ taskId, status, errorMessage });
            }}
            onPause={handlePause}
            onResume={handleResume}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
          {data && data.total > 0 && (
            <p className="mt-2 px-1 text-right text-[11px] text-stone-400 dark:text-stone-500">
              每页 <span className="tabular-nums">{data.page_size}</span> 个任务
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
