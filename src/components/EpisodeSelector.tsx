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
            <h4 className="text-base font-semibold text-slate-900">选择分集</h4>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              {selected.length} / {pages.length}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSelectAll}
              disabled={allSelected}
              className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
            >
              全选
            </button>
            <button
              onClick={onDeselectAll}
              disabled={selected.length === 0}
              className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
            >
              取消全选
            </button>
          </div>
        </div>

        {/* 分集列表 */}
        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
          {pages.map((page, index) => {
            const isSelected = selected.includes(index);
            return (
              <label
                key={page.page}
                className={`flex items-center gap-4 p-4 cursor-pointer transition-all duration-150 border-b border-slate-100 last:border-b-0 ${
                  isSelected
                    ? "bg-blue-50/50 hover:bg-blue-50"
                    : "hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(index)}
                  className="w-5 h-5 text-blue-600 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {page.part || `P${page.page}`}
                  </div>
                </div>
                <div className="text-sm text-slate-500 font-mono">
                  {formatDuration(page.duration)}
                </div>
              </label>
            );
          })}
        </div>

        {/* 提示信息 */}
        {selected.length === 0 && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-amber-700">
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
