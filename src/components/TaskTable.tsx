import { useState } from "react";
import { ExternalLink, FileVideo, Inbox, LoaderCircle, Pause, Play } from "lucide-react";
import { buildTaskFileUrl } from "../api/files";
import type { Task, TaskFile, TaskProgressEvent } from "../types/task";
import { TaskStatusBadge } from "./TaskStatusBadge";

interface TaskTableProps {
  tasks: Task[];
  progressByTaskId?: Record<number, TaskProgressEvent>;
  isLoading?: boolean;
  onStatusChange?: (taskId: number, newStatus: string, errorMessage?: string) => Promise<void>;
  onPause?: (taskId: number) => Promise<void>;
  onResume?: (taskId: number) => Promise<void>;
  selectedIds?: Set<number>;
  onSelectionChange?: (ids: Set<number>) => void;
}

export function TaskTable({
  tasks,
  progressByTaskId = {},
  isLoading,
  onStatusChange,
  onPause,
  onResume,
  selectedIds,
  onSelectionChange,
}: TaskTableProps) {
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  const selectable = selectedIds !== undefined && onSelectionChange !== undefined;
  const allSelected = selectable && tasks.length > 0 && tasks.every((t) => selectedIds.has(t.id));
  const someSelected = selectable && tasks.some((t) => selectedIds.has(t.id));

  const toggleAll = () => {
    if (!selectable) return;
    const next = new Set(selectedIds);
    if (allSelected) {
      tasks.forEach((t) => next.delete(t.id));
    } else {
      tasks.forEach((t) => next.add(t.id));
    }
    onSelectionChange(next);
  };

  const toggleOne = (taskId: number) => {
    if (!selectable) return;
    const next = new Set(selectedIds);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
    }
    onSelectionChange(next);
  };

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

  const handlePause = async (taskId: number) => {
    if (!onPause) return;

    setUpdatingTaskId(taskId);
    try {
      await onPause(taskId);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleResume = async (taskId: number) => {
    if (!onResume) return;

    setUpdatingTaskId(taskId);
    try {
      await onResume(taskId);
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
              {selectable && (
                <th className="h-11 pl-5 pr-0 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allSelected && someSelected;
                    }}
                    onChange={toggleAll}
                    aria-label="全选"
                    className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 accent-accent cursor-pointer align-middle"
                  />
                </th>
              )}
              <th className="h-11 px-5 text-left text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em]">
                视频
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
                {selectable && (
                  <td className="pl-5 pr-0 w-10 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(task.id)}
                      onChange={() => toggleOne(task.id)}
                      aria-label={`选择任务 ${task.id}`}
                      className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 accent-accent cursor-pointer align-middle"
                    />
                  </td>
                )}
                <td className="px-5 whitespace-nowrap">
                  <TaskVideoCell task={task} />
                </td>
                <td className="px-5 whitespace-nowrap">
                  <span className="text-[13px] text-stone-500 dark:text-stone-400">
                    {formatFavorite(task.task_key)}
                  </span>
                </td>
                <td className="px-5 whitespace-nowrap">
                  <span className="text-[13px] text-stone-500 dark:text-stone-400 max-w-[140px] truncate inline-block align-middle" title={formatSelectedEpisodes(task.task_data)}>
                    {formatSelectedEpisodes(task.task_data)}
                  </span>
                </td>
                <td className="px-5 whitespace-nowrap">
                  <TaskStatusBadge status={task.status} />
                </td>
                <td className="px-5 min-w-[180px]">
                  <TaskProgressCell
                    task={task}
                    progress={progressByTaskId[task.id]}
                  />
                </td>
                <td className="px-5 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {onStatusChange && task.status !== "completed" ? (
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        disabled={updatingTaskId === task.id}
                        className="h-8 pl-2.5 pr-7 text-[13px] bg-transparent border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 font-medium text-stone-500 dark:text-stone-400 hover:text-ink hover:border-stone-200 dark:hover:border-stone-700 hover:bg-white dark:hover:bg-white/[0.06] cursor-pointer"
                      >
                        <option value="ready">准备中</option>
                        <option value="consuming">执行中</option>
                        <option value="downloading">下载中</option>
                        <option value="pausing">暂停中</option>
                        <option value="paused">已暂停</option>
                        <option value="completed">已完成</option>
                        <option value="failed">失败</option>
                      </select>
                    ) : (
                      <span className="text-[13px] font-medium text-stone-400 dark:text-stone-500">
                        {task.status === "completed" ? "已完成" : "-"}
                      </span>
                    )}
                    {onPause &&
                      (task.status === "ready" ||
                        task.status === "consuming" ||
                        task.status === "downloading") && (
                        <button
                          type="button"
                          title="暂停"
                          aria-label="暂停"
                          disabled={updatingTaskId === task.id}
                          onClick={() => handlePause(task.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-stone-500 dark:text-stone-400 hover:text-ink hover:bg-white dark:hover:bg-white/[0.06] border border-transparent hover:border-stone-200 dark:hover:border-stone-700 disabled:opacity-50 transition-all duration-150 cursor-pointer"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                    {onResume && task.status === "paused" && (
                      <button
                        type="button"
                        title="继续"
                        aria-label="继续"
                        disabled={updatingTaskId === task.id}
                        onClick={() => handleResume(task.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-stone-500 dark:text-stone-400 hover:text-ink hover:bg-white dark:hover:bg-white/[0.06] border border-transparent hover:border-stone-200 dark:hover:border-stone-700 disabled:opacity-50 transition-all duration-150 cursor-pointer"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <TaskFileLinks task={task} />
                  </div>
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

function TaskVideoCell({ task }: { task: Task }) {
  const bvid = extractBvidFromTaskKey(task.task_key);
  const video = task.video;

  if (!video?.title) {
    return (
      <span className="text-[13px] font-medium text-ink font-mono tracking-tight">
        {bvid}
      </span>
    );
  }

  return (
    <div className="flex max-w-[220px] flex-col min-w-0">
      <span
        className="text-[13px] font-medium text-ink truncate"
        title={video.title}
      >
        {video.title}
      </span>
      <span className="text-[11px] text-stone-400 dark:text-stone-500 font-mono tracking-tight">
        {video.owner_name ? `${video.owner_name} · ` : ""}
        {bvid}
      </span>
    </div>
  );
}

function TaskFileLinks({ task }: { task: Task }) {
  const files = task.files ?? [];

  if (task.status !== "completed") {
    return null;
  }

  if (files.length === 0) {
    return (
      <span className="text-xs text-stone-300 dark:text-stone-600 whitespace-nowrap">
        无文件
      </span>
    );
  }

  if (files.length > 1) {
    return (
      <div className="grid w-[172px] grid-cols-5 gap-1">
        {files.map((file) => (
          <a
            key={file.index}
            href={buildTaskFileUrl(file.download_url)}
            target="_blank"
            rel="noreferrer"
            title={`${file.name} (${formatBytes(file.size)})`}
            className="inline-flex h-7 min-w-0 items-center justify-center overflow-hidden rounded-md border border-emerald-200/80 bg-emerald-50 px-1 text-xs font-semibold tabular-nums text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
          >
            {fileLinkLabel(files.length, file)}
          </a>
        ))}
      </div>
    );
  }

  return (
    <a
      href={buildTaskFileUrl(files[0].download_url)}
      target="_blank"
      rel="noreferrer"
      title={`${files[0].name} (${formatBytes(files[0].size)})`}
      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-emerald-200/80 bg-emerald-50 px-2 text-xs font-medium text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
    >
      <FileVideo className="h-3.5 w-3.5" aria-hidden="true" />
      <span>打开</span>
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

function fileLinkLabel(fileCount: number, file: TaskFile): string {
  if (fileCount === 1) {
    return "打开";
  }
  // yutto 默认命名形如 P001-xxx.mp4，尽量提取分P号
  const pageMatch = /P(\d+)(?:[-_.\s]|$)/i.exec(file.name);
  if (pageMatch) {
    return `P${parseInt(pageMatch[1], 10)}`;
  }
  // 未识别到分P号时退化为序号，保持方块大小
  return String(file.index + 1);
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

  if (task.status === "pausing") {
    return <span className="text-[13px] font-medium text-amber-600 dark:text-amber-400">暂停中…</span>;
  }

  if (task.status === "paused" || progress.status === "paused") {
    const percent = progress.overall_percent ?? progress.episode_percent ?? 0;
    return (
      <span className="text-[13px] font-medium text-stone-500 dark:text-stone-400">
        已暂停 · {percent.toFixed(1)}%
      </span>
    );
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
    <div className="flex min-w-[180px] flex-col gap-1.5 py-1">
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

function formatFavorite(taskKey: string): string {
  const favid = extractFavidFromTaskKey(taskKey);
  return favid === "-1" ? "未归类" : favid;
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
