import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTasks, useTaskStats, useUpdateTaskStatus } from "../hooks/useTasks";
import { TaskFilters } from "../components/TaskFilters";
import { TaskTable } from "../components/TaskTable";
import type { TaskQuery } from "../types/task";

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

  const currentPage = filter.page || 1;
  const totalPages = data ? Math.ceil(data.total / (filter.page_size || 20)) : 0;

  // 更新 URL 参数
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.page) params.set("page", filter.page.toString());
    if (filter.status) params.set("status", filter.status);
    const queryString = params.toString();
    navigate(`/?${queryString}`, { replace: true });
  }, [filter]);

  const handlePageChange = (newPage: number) => {
    setFilter({ ...filter, page: newPage });
  };

  const handleStatusChange = (newFilter: TaskQuery) => {
    setFilter(newFilter);
  };

  return (
    <div className="h-screen flex flex-col animate-fade-in">
      {/* 顶部固定区域：标题 + 筛选 + 分页 */}
      <div className="flex-shrink-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
        <div className="max-w-6xl mx-auto px-6 py-4">
          {/* 页面标题 */}
          <div className="mb-3">
            <h1 className="text-xl font-bold text-slate-900">任务列表</h1>
          </div>

          {/* 状态筛选 */}
          <div className="mb-3">
            <TaskFilters filter={filter} onChange={handleStatusChange} stats={stats} />
          </div>

          {/* 分页 */}
          {data && data.total > 0 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
              >
                上一页
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-900">{currentPage}</span>
                <span className="text-sm text-slate-400">/</span>
                <span className="text-sm text-slate-600">{totalPages}</span>
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 可滚动的表格区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <TaskTable
            tasks={data?.items || []}
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
