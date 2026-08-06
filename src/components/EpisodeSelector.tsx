import { Info } from "lucide-react";
import type { VideoPage } from "../types/video";

interface EpisodeSelectorProps {
  pages: VideoPage[];
  selected: number[];
  onToggle: (index: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function EpisodeSelector({
  pages,
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: EpisodeSelectorProps) {
  const allSelected = pages.length > 0 && selected.length === pages.length;

  return (
    <div className="card animate-fade-in">
      <div className="p-6">
        {/* 头部操作栏 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h4 className="text-base font-semibold tracking-tight text-ink">选择分集</h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-accent/10 text-accent-deep">
              {selected.length} / {pages.length}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onSelectAll}
              disabled={allSelected}
              className="px-3 py-1.5 text-sm font-medium text-stone-500 dark:text-stone-400 rounded-full hover:text-ink hover:bg-stone-900/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-150"
            >
              全选
            </button>
            <button
              onClick={onDeselectAll}
              disabled={selected.length === 0}
              className="px-3 py-1.5 text-sm font-medium text-stone-500 dark:text-stone-400 rounded-full hover:text-ink hover:bg-stone-900/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-150"
            >
              取消全选
            </button>
          </div>
        </div>

        {/* 分集列表 */}
        <div className="border border-stone-200/80 dark:border-stone-700 rounded-xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
          {pages.map((page, index) => {
            const isSelected = selected.includes(index);
            return (
              <label
                key={page.page}
                className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-all duration-150 border-b border-stone-100 dark:border-stone-800 last:border-b-0 ${
                  isSelected
                    ? "bg-accent/[0.05] dark:bg-accent/10 hover:bg-accent/[0.08] dark:hover:bg-accent/[0.14]"
                    : "hover:bg-stone-50 dark:hover:bg-white/[0.04]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(index)}
                  className="w-4 h-4 rounded accent-accent cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink truncate">
                    {page.part || `P${page.page}`}
                  </div>
                </div>
                <div className="text-xs text-stone-400 dark:text-stone-500 font-mono tabular-nums">
                  {formatDuration(page.duration)}
                </div>
              </label>
            );
          })}
        </div>

        {/* 提示信息 */}
        {selected.length === 0 && (
          <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 rounded-xl">
            <Info className="w-4 h-4 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              未选择任何分集，将下载全部内容
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
