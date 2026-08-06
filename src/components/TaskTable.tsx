import { useState } from "react";
import { LoaderCircle, Inbox } from "lucide-react";
import type { Task, TaskProgressEvent } from "../types/task";
import { TaskStatusBadge } from "./TaskStatusBadge";

interface TaskTableProps {
  tasks: Task[];
  progressByTaskId?: Record<number, TaskProgressEvent>;
  isLoading?: boolean;
  onStatusChange?: (taskId: number, newStatus: string, errorMessage?: string) => Promise<void>;
}

export function TaskTable({
  tasks,
  progressByTaskId = {},
  isLoading,
  onStatusChange,
}: TaskTableProps) {
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
      <div className="card p-12 text-center">
        <div className="inline-flex items-center gap-3 text-stone-400">
          <LoaderCircle className="w-5 h-5 animate-spin" />
          <span className="text-sm">加载中…</span>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="card p-8 text-center min-h-[240px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-white/[0.07] flex items-center justify-center">
            <Inbox className="w-6 h-6 text-stone-400" strokeWidth={1.5} />
          </div>
          <div className="text-stone-500 dark:text-stone-400 font-medium text-sm">暂无任务</div>
          <p className="text-xs text-stone-400 dark:text-stone-500">点击右上角「扫描收藏夹」或添加新任务</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-stone-200/80 dark:border-stone-800">
              <th className="h-11 px-5 text-left text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em]">
                视频 ID
              </th>
              <th className="h-11 px-5 text-left text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em]">
                收藏夹
              </th>
              <th className="h-11 px-5 text-left text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em]">
                选集
              </th>
              <th className="h-11 px-5 text-left text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em]">
                状态
              </th>
              <th className="h-11 px-5 text-left text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em]">
                执行进度
              </th>
              <th className="h-11 px-5 text-left text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em]">
                操作
              </th>
              <th className="h-11 px-5 text-left text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em]">
                创建时间
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800/70">
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="h-12 group hover:bg-stone-50/80 dark:hover:bg-white/[0.03] transition-colors duration-150"
              >
                <td className="px-5 whitespace-nowrap">
                  <span className="text-[13px] font-medium text-ink font-mono tracking-tight">
                    {extractBvidFromTaskKey(task.task_key)}
                  </span>
                </td>
                <td className="px-5 whitespace-nowrap">
                  <span className="text-[13px] text-stone-500 dark:text-stone-400 font-mono">
                    {extractFavidFromTaskKey(task.task_key)}
                  </span>
                </td>
                <td className="px-5 whitespace-nowrap">
                  <span className="text-[13px] text-stone-500 dark:text-stone-400">
                    {formatSelectedEpisodes(task.task_data)}
                  </span>
                </td>
                <td className="px-5 whitespace-nowrap">
                  <TaskStatusBadge status={task.status} />
                </td>
                <td className="px-5 min-w-[240px]">
                  <TaskProgressCell
                    task={task}
                    progress={progressByTaskId[task.id]}
                  />
                </td>
                <td className="px-5 whitespace-nowrap">
                  {onStatusChange ? (
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      disabled={updatingTaskId === task.id}
                      className="h-8 pl-2.5 pr-7 text-[13px] bg-transparent border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 font-medium text-stone-500 dark:text-stone-400 hover:text-ink hover:border-stone-200 dark:hover:border-stone-700 hover:bg-white dark:hover:bg-white/[0.06] cursor-pointer"
                    >
                      <option value="ready">准备中</option>
                      <option value="consuming">执行中</option>
                      <option value="downloading">下载中</option>
                      <option value="completed">已完成</option>
                      <option value="failed">失败</option>
                    </select>
                  ) : (
                    <span className="text-stone-300 dark:text-stone-600 text-sm">-</span>
                  )}
                </td>
                <td className="px-5 whitespace-nowrap">
                  <span className="text-[13px] text-stone-400 dark:text-stone-500 tabular-nums">
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

function TaskProgressCell({
  task,
  progress,
}: {
  task: Task;
  progress?: TaskProgressEvent;
}) {
  if (!progress || task.status === "ready") {
    return <span className="text-[13px] text-stone-300 dark:text-stone-600">-</span>;
  }

  if (progress.event === "failed") {
    return <span className="text-[13px] text-rose-600 dark:text-rose-400">{progress.message || "失败"}</span>;
  }

  if (progress.event === "completed") {
    return <span className="text-[13px] font-medium text-emerald-600 dark:text-emerald-400">100%</span>;
  }

  if (progress.status === "postprocessing") {
    return (
      <span className="text-[13px] font-medium text-amber-600 dark:text-amber-400">
        100% · 合并/后处理中
      </span>
    );
  }

  const overallPercent = progress.overall_percent ?? 0;
  const episodeLabel =
    progress.episode_index && progress.episode_count
      ? `P${progress.episode_index}/${progress.episode_count}`
      : null;

  return (
    <div className="flex min-w-[220px] flex-col gap-1.5 py-1">
      <div className="flex items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
        <span className="truncate">
          {episodeLabel || progress.status}
          {progress.episode_percent !== null ? ` ${progress.episode_percent.toFixed(1)}%` : ""}
        </span>
        <span className="font-semibold tabular-nums text-ink">
          {overallPercent.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-stone-200/80 dark:bg-stone-700/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-deep transition-[width] duration-300"
          style={{ width: `${Math.min(Math.max(overallPercent, 0), 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-3 text-[11px] text-stone-400 dark:text-stone-500 tabular-nums">
        <span>{formatBytes(progress.downloaded_bytes)} / {formatBytes(progress.total_bytes)}</span>
        <span>{formatSpeed(progress.speed_bytes_per_second)}</span>
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

function formatBytes(value: number | null): string {
  if (value === null) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let amount = value;
  let unitIndex = 0;
  while (amount >= 1024 && unitIndex < units.length - 1) {
    amount /= 1024;
    unitIndex += 1;
  }
  return `${amount.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatSpeed(value: number | null): string {
  if (value === null) return "-";
  return `${formatBytes(value)}/s`;
}
