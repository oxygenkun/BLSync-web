import { useState } from "react";
import { FolderHeart, Plus, Trash2, X } from "lucide-react";
import type { ConfigFieldSchema, FavoriteListValue, PostprocessAction } from "../types/config";

interface FavoriteListEditorProps {
  value: Record<string, FavoriteListValue>;
  fields: ConfigFieldSchema[];
  onChange: (value: Record<string, FavoriteListValue>) => void;
}

const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white/70 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-3 focus:ring-accent/10 dark:border-stone-700 dark:bg-white/[0.04]";

const defaultNameTemplate = "[{username}]{name}({bvid})";
const defaultNameGroupTemplate = "[{username}]{title}({bvid})/P{id:0>3}-{name}";

function uniqueTaskName(items: Record<string, FavoriteListValue>) {
  let index = Object.keys(items).length + 1;
  while (`task${index}` in items) index += 1;
  return `task${index}`;
}

function fieldHint(fields: ConfigFieldSchema[], fieldKey: string) {
  const description = fields.find((field) => field.key === fieldKey)?.description;
  return description ? <span className="block text-[11px] leading-4 text-stone-400">{description}</span> : null;
}

export function FavoriteListEditor({ value, fields, onChange }: FavoriteListEditorProps) {
  const entries = Object.entries(value);
  const [activeTaskName, setActiveTaskName] = useState(() => entries[0]?.[0] ?? "");
  const selectedTaskName = value[activeTaskName] ? activeTaskName : (entries[0]?.[0] ?? "");
  const selectedItem = value[selectedTaskName];
  const updateItem = (item: FavoriteListValue) => {
    onChange({ ...value, [selectedTaskName]: item });
  };

  const renameItem = (nextName: string) => {
    if (!nextName || nextName === selectedTaskName || nextName in value) return;
    const renamed: Record<string, FavoriteListValue> = {};
    for (const [name, item] of entries) {
      renamed[name === selectedTaskName ? nextName : name] = item;
    }
    onChange(renamed);
    setActiveTaskName(nextName);
  };

  const addFavorite = () => {
    const taskName = uniqueTaskName(value);
    onChange({
      ...value,
      [taskName]: {
        fid: "",
        path: "downloads/",
        name: defaultNameTemplate,
        name_group: defaultNameGroupTemplate,
        postprocess: [],
      },
    });
    setActiveTaskName(taskName);
  };

  const deleteSelected = () => {
    if (selectedTaskName === "-1") return;
    const next = { ...value };
    delete next[selectedTaskName];
    onChange(next);
    setActiveTaskName(Object.keys(next)[0] ?? "");
  };

  if (!selectedItem) {
    return (
      <button
        type="button"
        onClick={addFavorite}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 py-4 text-sm font-medium text-stone-500 transition hover:border-accent/60 hover:bg-accent/[0.04] hover:text-accent-deep dark:border-stone-700"
      >
        <Plus className="h-4 w-4" /> 添加收藏夹
      </button>
    );
  }

  const actions = selectedItem.postprocess ?? [];

  return (
    <div className="favorite-editor-grid grid overflow-hidden rounded-2xl border border-stone-200/80 bg-white/40 dark:border-stone-800 dark:bg-white/[0.02]">
      <div className="border-b border-stone-200/80 p-3 md:border-b-0 md:border-r dark:border-stone-800">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">同步任务</span>
          <button
            type="button"
            onClick={addFavorite}
            aria-label="添加收藏夹"
            className="rounded-lg p-1.5 text-stone-400 transition hover:bg-accent/10 hover:text-accent-deep"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto md:block md:space-y-1 md:overflow-visible">
          {entries.map(([taskName, item]) => {
            const isActive = taskName === selectedTaskName;
            return (
              <button
                key={taskName}
                type="button"
                onClick={() => setActiveTaskName(taskName)}
                className={`flex min-w-[10.5rem] items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition md:w-full md:min-w-0 ${isActive ? "bg-ink text-paper" : "text-stone-500 hover:bg-stone-100 hover:text-ink dark:hover:bg-white/[0.05]"}`}
              >
                <FolderHeart className={`h-4 w-4 shrink-0 ${isActive ? "text-accent" : "text-stone-300"}`} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">{taskName === "-1" ? "直接下载" : taskName}</span>
                  <span className={`block truncate text-[10px] ${isActive ? "text-white/45" : "text-stone-400"}`}>FID {item.fid || "未设置"}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-w-0 p-4 sm:p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-ink">{selectedTaskName === "-1" ? "直接下载" : selectedTaskName}</h3>
            <p className="mt-1 text-xs text-stone-400">设置来源、输出位置和下载完成后的操作。</p>
          </div>
          {selectedTaskName !== "-1" ? (
            <button
              type="button"
              onClick={deleteSelected}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-stone-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> 删除
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-stone-500">任务名</span>
            {fieldHint(fields, "name")}
            <input
              key={selectedTaskName}
              className={inputClass}
              defaultValue={selectedTaskName}
              disabled={selectedTaskName === "-1"}
              onBlur={(event) => renameItem(event.target.value.trim())}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-stone-500">收藏夹 ID</span>
            {fieldHint(fields, "fid")}
            <input
              className={inputClass}
              inputMode="numeric"
              value={selectedItem.fid}
              onChange={(event) => updateItem({ ...selectedItem, fid: event.target.value })}
            />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-medium text-stone-500">下载路径</span>
            {fieldHint(fields, "path")}
            <input
              className={inputClass}
              value={selectedItem.path}
              onChange={(event) => updateItem({ ...selectedItem, path: event.target.value })}
            />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-medium text-stone-500">文件名模板</span>
            {fieldHint(fields, "name_template")}
            <input
              className={`${inputClass} font-mono`}
              placeholder={defaultNameTemplate}
              value={selectedItem.name}
              onChange={(event) => updateItem({ ...selectedItem, name: event.target.value })}
            />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-medium text-stone-500">文件名多P模板</span>
            {fieldHint(fields, "name_group")}
            <input
              className={`${inputClass} font-mono`}
              placeholder={defaultNameGroupTemplate}
              value={selectedItem.name_group}
              onChange={(event) => updateItem({ ...selectedItem, name_group: event.target.value })}
            />
          </label>
        </div>

        <div className="mt-5 border-t border-dashed border-stone-200 pt-4 dark:border-stone-700">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">下载后操作</span>
            <button
              type="button"
              onClick={() => updateItem({ ...selectedItem, postprocess: [...actions, { action: "remove" }] })}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-accent-deep transition hover:bg-accent/10"
            >
              <Plus className="h-3.5 w-3.5" /> 添加
            </button>
          </div>
          <p className="mb-2.5 text-[11px] leading-4 text-stone-400">可在下载完成后移动到其他收藏夹、从当前收藏夹移除，或保存到目标收藏夹。</p>
          {actions.length === 0 ? (
            <p className="rounded-xl bg-stone-50 px-3 py-2.5 text-xs text-stone-400 dark:bg-white/[0.025]">下载完成后不执行额外操作。</p>
          ) : (
            <div className="space-y-2">
              {actions.map((action, actionIndex) => (
                <div key={`${actionIndex}-${action.action}`} className="flex items-center gap-2">
                  <select
                    aria-label="下载后操作"
                    className={inputClass}
                    value={action.action}
                    onChange={(event) => {
                      const next = [...actions];
                      next[actionIndex] = { action: event.target.value as PostprocessAction["action"] };
                      updateItem({ ...selectedItem, postprocess: next });
                    }}
                  >
                    <option value="remove">从当前收藏夹移除</option>
                    <option value="move">移动到收藏夹</option>
                    <option value="save">保存到收藏夹</option>
                  </select>
                  {action.action !== "remove" ? (
                    <input
                      aria-label="目标收藏夹 ID"
                      className={inputClass}
                      inputMode="numeric"
                      placeholder="目标 FID"
                      value={action.fid ?? ""}
                      onChange={(event) => {
                        const next = [...actions];
                        next[actionIndex] = { ...action, fid: event.target.value };
                        updateItem({ ...selectedItem, postprocess: next });
                      }}
                    />
                  ) : null}
                  <button
                    type="button"
                    aria-label="移除此操作"
                    onClick={() => updateItem({ ...selectedItem, postprocess: actions.filter((_, itemIndex) => itemIndex !== actionIndex) })}
                    className="rounded-lg p-2 text-stone-300 transition hover:text-rose-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
