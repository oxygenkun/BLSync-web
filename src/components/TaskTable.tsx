import { useState } from "react";
import type { Task } from "../types/task";
import { TaskStatusBadge } from "./TaskStatusBadge";

interface TaskTableProps {
  tasks: Task[];
  isLoading?: boolean;
  onStatusChange?: (taskId: number, newStatus: string, errorMessage?: string) => Promise<void>;
}

export function TaskTable({ tasks, isLoading, onStatusChange }: TaskTableProps) {
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    if (!onStatusChange) return;

    setUpdatingTaskId(taskId);
    try {
      const errorMessage = newStatus === "failed" ? "手动设置为失败" : undefined;
      await onStatusChange(taskId, newStatus, errorMessage);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="card p-8 text-center">
        <div className="inline-flex items-center gap-3 text-slate-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="card p-8 text-center min-h-[200px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="text-slate-500 font-medium text-sm">暂无任务</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="h-10 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                视频 ID
              </th>
              <th className="h-10 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                收藏夹 ID
              </th>
              <th className="h-10 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                选集
              </th>
              <th className="h-10 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                状态
              </th>
              <th className="h-10 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                操作
              </th>
              <th className="h-10 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                创建时间
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="h-10 group hover:bg-slate-50/50 transition-colors duration-150"
              >
                <td className="px-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-slate-900 font-mono">
                    {extractBvidFromTaskKey(task.task_key)}
                  </span>
                </td>
                <td className="px-4 whitespace-nowrap">
                  <span className="text-sm text-slate-600 font-mono">
                    {extractFavidFromTaskKey(task.task_key)}
                  </span>
                </td>
                <td className="px-4 whitespace-nowrap">
                  <span className="text-sm text-slate-600">
                    {formatSelectedEpisodes(task.task_data)}
                  </span>
                </td>
                <td className="px-4 whitespace-nowrap">
                  <TaskStatusBadge status={task.status} />
                </td>
                <td className="px-4 whitespace-nowrap">
                  {onStatusChange ? (
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      disabled={updatingTaskId === task.id}
                      className="h-8 px-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 font-medium text-slate-700 hover:border-slate-300 cursor-pointer py-1"
                    >
                      <option value="ready">准备中</option>
                      <option value="consuming">执行中</option>
                      <option value="downloading">下载中</option>
                      <option value="completed">已完成</option>
                      <option value="failed">失败</option>
                    </select>
                  ) : (
                    <span className="text-slate-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-4 whitespace-nowrap">
                  <span className="text-sm text-slate-600">
                    {formatDate(task.created_at)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function extractBvidFromTaskKey(taskKey: string): string {
  try {
    const key = JSON.parse(taskKey);
    return key.bvid || "N/A";
  } catch {
    return "N/A";
  }
}

function extractFavidFromTaskKey(taskKey: string): string {
  try {
    const key = JSON.parse(taskKey);
    return key.favid || "N/A";
  } catch {
    return "N/A";
  }
}

function formatSelectedEpisodes(taskData: string): string {
  try {
    const data = JSON.parse(taskData);
    const episodes = data.selected_episodes;
    if (!episodes || episodes.length === 0) {
      return "全部";
    }
    // 将索引转换为分P号（索引+1）
    return episodes.map((idx: number) => `P${idx + 1}`).join(", ");
  } catch {
    return "全部";
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
