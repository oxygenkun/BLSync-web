import { type PointerEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ExternalLink, FileVideo, Inbox, LoaderCircle, Pause, Play } from "lucide-react";
import { buildTaskFileUrl, openTaskFile } from "../api/files";
import type { Task, TaskFile, TaskProgressEvent } from "../types/task";
import { TaskStatusBadge } from "./TaskStatusBadge";

interface TaskTableProps {
  tasks: Task[];
  progressByTaskId?: Record<number, TaskProgressEvent>;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onStatusChange?: (taskId: number, newStatus: string, errorMessage?: string) => Promise<void>;
  onPause?: (taskId: number) => Promise<void>;
  onResume?: (taskId: number) => Promise<void>;
  selectedIds?: Set<number>;
  onSelectionChange?: (ids: Set<number>) => void;
}

type ColumnId = "video" | "favorite" | "progress" | "actions" | "createdAt";

const COLUMN_DEFINITIONS: Record<ColumnId, { label: string; defaultWidth: number; minWidth: number; growWeight: number }> = {
  video: { label: "视频", defaultWidth: 260, minWidth: 200, growWeight: 4 },
  favorite: { label: "收藏夹", defaultWidth: 110, minWidth: 90, growWeight: 0 },
  progress: { label: "状态", defaultWidth: 224, minWidth: 120, growWeight: 0 },
  actions: { label: "操作", defaultWidth: 220, minWidth: 190, growWeight: 1 },
  createdAt: { label: "创建时间", defaultWidth: 120, minWidth: 112, growWeight: 0 },
};

const COLUMN_IDS = Object.keys(COLUMN_DEFINITIONS) as ColumnId[];
const COLUMN_WIDTHS_STORAGE_KEY = "blsync.task-table-column-widths.v4";
const SELECTION_COLUMN_WIDTH = 56;

function calculateEffectiveColumnWidths(
  widths: Record<ColumnId, number>,
  availableWidth: number,
  selectable: boolean,
): Record<ColumnId, number> {
  const selectionWidth = selectable ? SELECTION_COLUMN_WIDTH : 0;
  const baseWidth = COLUMN_IDS.reduce((total, id) => total + widths[id], selectionWidth);
  const extraWidth = Math.max(0, Math.floor(availableWidth - baseWidth));
  const totalGrowWeight = COLUMN_IDS.reduce(
    (total, id) => total + COLUMN_DEFINITIONS[id].growWeight,
    0,
  );
  let allocatedExtraWidth = 0;

  return Object.fromEntries(
    COLUMN_IDS.map((id, index) => {
      const growWeight = COLUMN_DEFINITIONS[id].growWeight;
      const isLastGrowingColumn = growWeight > 0
        && !COLUMN_IDS.slice(index + 1).some(
          (nextId) => COLUMN_DEFINITIONS[nextId].growWeight > 0,
        );
      const growShare = totalGrowWeight === 0 || growWeight === 0
        ? 0
        : isLastGrowingColumn
          ? extraWidth - allocatedExtraWidth
          : Math.floor(extraWidth * growWeight / totalGrowWeight);
      allocatedExtraWidth += growShare;
      return [id, widths[id] + growShare];
    }),
  ) as Record<ColumnId, number>;
}

function resolveBaseWidthForDrag(
  column: ColumnId,
  desiredEffectiveWidth: number,
  startWidths: Record<ColumnId, number>,
  availableWidth: number,
  selectable: boolean,
): number {
  const minWidth = COLUMN_DEFINITIONS[column].minWidth;
  let low = minWidth;
  let high = Math.max(minWidth, desiredEffectiveWidth + availableWidth);

  for (let index = 0; index < 28; index += 1) {
    const candidate = (low + high) / 2;
    const candidateWidths = { ...startWidths, [column]: candidate };
    const effectiveWidth = calculateEffectiveColumnWidths(
      candidateWidths,
      availableWidth,
      selectable,
    )[column];
    if (effectiveWidth < desiredEffectiveWidth) {
      low = candidate;
    } else {
      high = candidate;
    }
  }

  return Math.round(high);
}

function getInitialColumnWidths(): Record<ColumnId, number> {
  const defaults = Object.fromEntries(
    COLUMN_IDS.map((id) => [id, COLUMN_DEFINITIONS[id].defaultWidth]),
  ) as Record<ColumnId, number>;

  try {
    const saved = window.localStorage.getItem(COLUMN_WIDTHS_STORAGE_KEY);
    if (!saved) return defaults;
    const parsed = JSON.parse(saved) as Partial<Record<ColumnId, number>>;
    for (const id of COLUMN_IDS) {
      const width = parsed[id];
      if (typeof width === "number" && Number.isFinite(width)) {
        defaults[id] = Math.max(COLUMN_DEFINITIONS[id].minWidth, width);
      }
    }
  } catch {
    // 本地缓存不可用时使用默认列宽。
  }

  return defaults;
}

export function TaskTable({
  tasks,
  progressByTaskId = {},
  isLoading,
  isRefreshing = false,
  onStatusChange,
  onPause,
  onResume,
  selectedIds,
  onSelectionChange,
}: TaskTableProps) {
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<ColumnId, number>>(getInitialColumnWidths);
  const [availableWidth, setAvailableWidth] = useState(0);
  const tableViewportRef = useRef<HTMLDivElement>(null);
  const resizeState = useRef<{
    column: ColumnId;
    startX: number;
    startEffectiveWidth: number;
    startWidths: Record<ColumnId, number>;
    availableWidth: number;
  } | null>(null);
  const selectable = selectedIds !== undefined && onSelectionChange !== undefined;

  useEffect(() => {
    window.localStorage.setItem(COLUMN_WIDTHS_STORAGE_KEY, JSON.stringify(columnWidths));
  }, [columnWidths]);

  useLayoutEffect(() => {
    const viewport = tableViewportRef.current;
    if (!viewport) return;
    const updateWidth = () => setAvailableWidth(viewport.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [isLoading, tasks.length]);

  useEffect(() => {
    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const resize = resizeState.current;
      if (!resize) return;
      const minWidth = COLUMN_DEFINITIONS[resize.column].minWidth;
      const desiredWidth = Math.max(
        minWidth,
        resize.startEffectiveWidth + event.clientX - resize.startX,
      );
      setColumnWidths({
        ...resize.startWidths,
        [resize.column]: resolveBaseWidthForDrag(
          resize.column,
          desiredWidth,
          resize.startWidths,
          resize.availableWidth,
          selectable,
        ),
      });
    };
    const stopResize = () => {
      resizeState.current = null;
      document.body.classList.remove("task-table-resizing");
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
    };
  }, [selectable]);

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

  const startResize = (column: ColumnId, event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeState.current = {
      column,
      startX: event.clientX,
      startEffectiveWidth: effectiveColumnWidths[column],
      startWidths: columnWidths,
      availableWidth,
    };
    document.body.classList.add("task-table-resizing");
  };

  const effectiveColumnWidths = calculateEffectiveColumnWidths(columnWidths, availableWidth, selectable);
  const minimumTableWidth = COLUMN_IDS.reduce(
    (total, id) => total + columnWidths[id],
    selectable ? SELECTION_COLUMN_WIDTH : 0,
  );
  const requiresHorizontalScroll = availableWidth > 0 && minimumTableWidth > availableWidth;

  const tableWidth = COLUMN_IDS.reduce(
    (total, id) => total + effectiveColumnWidths[id],
    selectable ? SELECTION_COLUMN_WIDTH : 0,
  );

  const resizeColumnBy = (column: ColumnId, delta: number) => {
    const desiredWidth = Math.max(
      COLUMN_DEFINITIONS[column].minWidth,
      effectiveColumnWidths[column] + delta,
    );
    setColumnWidths((widths) => ({
      ...widths,
      [column]: resolveBaseWidthForDrag(
        column,
        desiredWidth,
        widths,
        availableWidth,
        selectable,
      ),
    }));
  };

  const resetColumnWidth = (column: ColumnId) => {
    setColumnWidths((widths) => ({
      ...widths,
      [column]: COLUMN_DEFINITIONS[column].defaultWidth,
    }));
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
    <div className="card relative overflow-hidden" aria-busy={isRefreshing}>
      <div
        ref={tableViewportRef}
        className={`custom-scrollbar ${requiresHorizontalScroll ? "overflow-x-auto" : "overflow-x-hidden"} transition-opacity duration-150 ${isRefreshing ? "pointer-events-none opacity-60" : "opacity-100"}`}
      >
        <table className="table-fixed" style={{ width: `${tableWidth}px` }}>
          <colgroup>
            {selectable && <col style={{ width: `${SELECTION_COLUMN_WIDTH}px` }} />}
            {COLUMN_IDS.map((id) => <col key={id} style={{ width: `${effectiveColumnWidths[id]}px` }} />)}
          </colgroup>
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
              {COLUMN_IDS.map((id) => (
                <ResizableHeader
                  key={id}
                  column={id}
                  onResizeStart={startResize}
                  onKeyboardResize={resizeColumnBy}
                  onReset={resetColumnWidth}
                />
              ))}
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
                <td className="px-5 py-1.5 align-middle min-w-0">
                  <TaskVideoCell task={task} />
                </td>
                <td className="px-5 whitespace-nowrap">
                  <span className="text-[13px] text-stone-500 dark:text-stone-400">
                    {formatFavorite(task.task_key)}
                  </span>
                </td>
                <td className="px-4">
                  <TaskProgressCell
                    task={task}
                    progress={progressByTaskId[task.id]}
                  />
                </td>
                <td className="px-5 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {onStatusChange && task.status !== "completed" ? (
                      <select
                        aria-label={`修改任务 ${task.id} 状态`}
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        disabled={updatingTaskId === task.id}
                        className="h-8 pl-2.5 pr-7 text-[13px] bg-transparent border border-transparent rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-[color,background-color,border-color,opacity] duration-150 font-medium text-stone-500 dark:text-stone-400 hover:text-ink hover:border-stone-200 dark:hover:border-stone-700 hover:bg-white dark:hover:bg-white/[0.06] cursor-pointer"
                      >
                        <option value="ready">准备中</option>
                        <option value="consuming">执行中</option>
                        <option value="downloading">下载中</option>
                        <option value="pausing">暂停中</option>
                        <option value="paused">已暂停</option>
                        <option value="completed">已完成</option>
                        <option value="failed">失败</option>
                      </select>
                    ) : task.status !== "completed" ? (
                      <span className="text-[13px] font-medium text-stone-400 dark:text-stone-500">
                        -
                      </span>
                    ) : null}
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
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-stone-500 dark:text-stone-400 hover:text-ink hover:bg-white dark:hover:bg-white/[0.06] border border-transparent hover:border-stone-200 dark:hover:border-stone-700 disabled:opacity-50 transition-[color,background-color,border-color,opacity] duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
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
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-stone-500 dark:text-stone-400 hover:text-ink hover:bg-white dark:hover:bg-white/[0.06] border border-transparent hover:border-stone-200 dark:hover:border-stone-700 disabled:opacity-50 transition-[color,background-color,border-color,opacity] duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
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

function ResizableHeader({
  column,
  onResizeStart,
  onKeyboardResize,
  onReset,
}: {
  column: ColumnId;
  onResizeStart: (column: ColumnId, event: PointerEvent<HTMLButtonElement>) => void;
  onKeyboardResize: (column: ColumnId, delta: number) => void;
  onReset: (column: ColumnId) => void;
}) {
  return (
    <th className="group/header relative h-11 px-5 text-left text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em]">
      {COLUMN_DEFINITIONS[column].label}
      <button
        type="button"
        aria-label={`拖动调整${COLUMN_DEFINITIONS[column].label}列宽`}
        title="拖动调整列宽；方向键微调；双击重置"
        onPointerDown={(event) => onResizeStart(column, event)}
        onDoubleClick={() => onReset(column)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            onKeyboardResize(column, event.key === "ArrowLeft" ? -16 : 16);
          }
        }}
        className="absolute inset-y-0 right-0 z-10 w-2 cursor-col-resize touch-none after:absolute after:inset-y-2 after:right-0 after:w-px after:bg-accent after:opacity-0 after:transition-opacity group-hover/header:after:opacity-70 focus:outline-none focus-visible:after:opacity-100"
      />
    </th>
  );
}

function TaskVideoCell({ task }: { task: Task }) {
  const bvid = extractBvidFromTaskKey(task.task_key);
  const video = task.video;
  const partCount = video?.videos_count ?? task.files?.length ?? 1;

  if (!video?.title) {
    return (
      <CopyableText value={bvid} className="text-[13px] leading-5 font-medium text-ink font-mono tracking-tight" />
    );
  }

  return (
    <div className="flex h-[2.375rem] w-full min-w-0 flex-col justify-center">
      <CopyableText value={video.title} className="list-title text-[13px] leading-5 font-medium text-ink" truncate expandOnHover />
      <span className="mt-0.5 ml-[0.0625rem] flex h-4 min-w-0 items-center whitespace-nowrap text-[11px] leading-4 text-stone-400 dark:text-stone-500 font-mono tracking-tight">
        {video.owner_name && <CopyableText value={video.owner_name} className="h-4 max-w-[48%] leading-4" truncate />}
        {video.owner_name && <span className="h-4 px-1.5 leading-4 text-stone-300 dark:text-stone-600">·</span>}
        <CopyableText value={bvid} className="h-4 shrink-0 leading-4" />
        {partCount > 1 && (
          <>
            <span className="h-4 px-1.5 leading-4 text-stone-300 dark:text-stone-600">·</span>
            <span className="h-4 shrink-0 font-sans leading-4 tabular-nums">{partCount}P</span>
          </>
        )}
      </span>
    </div>
  );
}

function CopyableText({
  value,
  className = "",
  truncate = false,
  expandOnHover = false,
}: {
  value: string;
  className?: string;
  truncate?: boolean;
  expandOnHover?: boolean;
}) {
  const textRef = useRef<HTMLButtonElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [copyAnimationKey, setCopyAnimationKey] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element || !truncate) return;
    const update = () => setIsTruncated(element.scrollWidth > element.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element.parentElement ?? element);
    return () => observer.disconnect();
  }, [truncate, value]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopyAnimationKey((key) => key + 1);
  };

  const canExpand = expandOnHover && isTruncated;

  const updateExpandedFromPointer = (event: PointerEvent<HTMLSpanElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setIsExpanded(
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom,
    );
  };

  return (
    <span
      className={`group/copy relative min-w-0 ${truncate ? `block ${expandOnHover ? "h-5" : "h-full"}` : "inline-flex items-center"} ${canExpand ? "copyable-title-group" : ""} ${canExpand && isExpanded ? "copyable-title-expanded" : ""}`}
      onPointerEnter={canExpand ? updateExpandedFromPointer : undefined}
      onPointerMove={canExpand ? updateExpandedFromPointer : undefined}
      onPointerLeave={canExpand ? () => setIsExpanded(false) : undefined}
    >
      <button
        ref={textRef}
        type="button"
        onClick={() => void copy()}
        title={canExpand ? undefined : `点击复制：${value}`}
        className={`relative max-w-full cursor-copy text-left transition-colors hover:text-accent focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-accent/40 ${truncate ? "block w-full truncate" : "inline"} ${canExpand ? "copyable-title-expand" : ""} ${className}`}
      >
        {copyAnimationKey > 0 && (
          <span
            key={copyAnimationKey}
            aria-hidden="true"
            onAnimationEnd={() => setCopyAnimationKey(0)}
            className="animate-copy-flash pointer-events-none absolute inset-0 rounded-[inherit] bg-accent/20"
          />
        )}
        <span className="relative z-10">{value}</span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copyAnimationKey > 0 ? `${value} 已复制` : ""}
      </span>
    </span>
  );
}

function TaskFileLinks({ task }: { task: Task }) {
  const files = task.files ?? [];

  const openWithSystemPlayer = async (downloadUrl: string) => {
    try {
      await openTaskFile(downloadUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : "无法调用系统播放器");
    }
  };

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
            onClick={(event) => {
              event.preventDefault();
              void openWithSystemPlayer(file.download_url);
            }}
            title={`${file.name} (${formatBytes(file.size)})`}
            className="inline-flex h-7 min-w-0 items-center justify-center overflow-hidden rounded-md border border-emerald-200/80 bg-emerald-50 px-1 text-xs font-semibold tabular-nums text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
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
      onClick={(event) => {
        event.preventDefault();
        void openWithSystemPlayer(files[0].download_url);
      }}
      title={`${files[0].name} (${formatBytes(files[0].size)})`}
      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-emerald-200/80 bg-emerald-50 px-2 text-xs font-medium text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
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
  const percent = progress?.status === "postprocessing"
    ? 100
    : progress?.overall_percent ?? progress?.episode_percent ?? 0;
  const episodeCount = progress?.episode_count ?? task.video?.videos_count ?? 1;
  const episodeProgress = episodeCount > 1
    ? progress?.episode_index
      ? `P${progress.episode_index}/${episodeCount}`
      : `P–/${episodeCount}`
    : null;
  const speed = formatSpeed(progress?.speed_bytes_per_second ?? null);

  return (
    <TaskStatusBadge
      status={task.status}
      progress={percent}
      episodeProgress={episodeProgress}
      speed={speed}
    />
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
  return favid === "-1" ? "" : favid;
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
  if (!value || value <= 0) return "–";
  return `${formatBytes(value)}/s`;
}
