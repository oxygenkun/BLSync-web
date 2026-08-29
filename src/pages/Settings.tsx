import { useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  FileCode2,
  FolderHeart,
  Gauge,
  KeyRound,
  LoaderCircle,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FavoriteListEditor } from "../components/FavoriteListEditor";
import { useConfig, useUpdateConfig } from "../hooks/useConfig";
import type { ConfigDocument, ConfigFieldSchema, ConfigSectionSchema, ConfigValues } from "../types/config";

const controlClass =
  "w-full rounded-xl border border-stone-200 bg-white/70 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-3 focus:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-45 dark:border-stone-700 dark:bg-white/[0.04]";

const moduleIcons: Record<string, LucideIcon> = {
  runtime: Gauge,
  credential: ShieldCheck,
  favorite_list: FolderHeart,
};

function ModuleIcon({ section }: { section: ConfigSectionSchema }) {
  const Icon = moduleIcons[section.key] ?? SlidersHorizontal;
  return <Icon className="h-4.5 w-4.5" aria-hidden="true" />;
}

function valueAtPath(values: ConfigValues, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object") return (current as Record<string, unknown>)[key];
    return undefined;
  }, values);
}

function setValueAtPath(values: ConfigValues, path: string, value: unknown): ConfigValues {
  const [root, child] = path.split(".");
  if (!child) return { ...values, [root]: value };
  const nested = values[root];
  return {
    ...values,
    [root]: { ...(nested as Record<string, unknown>), [child]: value },
  };
}

function topLevelChanges(values: ConfigValues, paths: Set<string>) {
  const roots = new Set([...paths].map((path) => path.split(".")[0]));
  return Object.fromEntries([...roots].map((root) => [root, values[root]]));
}

function validateFavorites(values: ConfigValues): string | null {
  for (const [taskName, favorite] of Object.entries(values.favorite_list)) {
    if (!taskName.trim()) return "收藏夹任务名不能为空";
    if (!/^-?\d+$/.test(favorite.fid)) return `“${taskName}”的收藏夹 ID 必须是整数`;
    if (!favorite.path.trim()) return `“${taskName}”的下载路径不能为空`;
    for (const action of favorite.postprocess ?? []) {
      if (action.action !== "remove" && !/^-?\d+$/.test(action.fid ?? "")) {
        return `“${taskName}”的下载后操作需要填写目标收藏夹 ID`;
      }
    }
  }
  return null;
}

interface FieldControlProps {
  field: ConfigFieldSchema;
  values: ConfigValues;
  configuredSecrets: Record<string, boolean>;
  dirtyPaths: Set<string>;
  disabled: boolean;
  onChange: (path: string, value: unknown) => void;
}

function FieldControl({ field, values, configuredSecrets, dirtyPaths, disabled, onChange }: FieldControlProps) {
  const value = valueAtPath(values, field.key);
  const secretKey = field.key.split(".")[1];
  const secretConfigured = field.type === "secret" && configuredSecrets[secretKey];

  if (field.type === "favorite-list") {
    return (
      <FavoriteListEditor
        value={values.favorite_list}
        onChange={(next) => onChange(field.key, next)}
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(value)}
        disabled={disabled}
        onClick={() => onChange(field.key, !value)}
        className={`relative h-7 w-12 rounded-full transition-colors ${value ? "bg-accent" : "bg-stone-200 dark:bg-stone-700"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    );
  }

  if (field.type === "select") {
    return (
      <select className={controlClass} value={String(value ?? "")} disabled={disabled} onChange={(event) => onChange(field.key, event.target.value)}>
        {field.options?.map((option) => <option key={option}>{option}</option>)}
      </select>
    );
  }

  const isNumeric = field.type === "integer" || field.type === "number";
  const secretWillClear = field.type === "secret" && dirtyPaths.has(field.key) && value === "";
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          className={`${controlClass} ${field.unit ? "pr-14" : ""} ${field.type === "secret" ? "font-mono" : ""}`}
          type={field.type === "secret" ? "password" : isNumeric ? "number" : "text"}
          value={field.type === "secret" ? String(value ?? "") : String(value ?? "")}
          min={field.min}
          max={field.max}
          step={field.step ?? (field.type === "integer" ? 1 : undefined)}
          disabled={disabled}
          placeholder={secretConfigured ? "已配置 · 留空保持不变" : undefined}
          onChange={(event) => {
            if (isNumeric) {
              onChange(field.key, event.target.value === "" ? "" : Number(event.target.value));
            } else {
              onChange(field.key, event.target.value);
            }
          }}
        />
        {field.unit ? <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-stone-400">{field.unit}</span> : null}
      </div>
      {field.type === "secret" ? (
        <div className="flex items-center justify-between gap-3">
          <p className={`text-[11px] ${secretWillClear ? "text-rose-500" : "text-stone-400"}`}>
            {secretWillClear ? "保存后将清除此凭据" : secretConfigured ? "当前已安全保存" : "当前未配置"}
          </p>
          {secretConfigured && !secretWillClear ? (
            <button type="button" onClick={() => onChange(field.key, "")} className="text-[11px] text-stone-400 underline-offset-2 transition hover:text-rose-500 hover:underline">
              清除凭据
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

interface ConfigEditorProps {
  document: ConfigDocument;
  activeModule: string;
  onActiveModuleChange: (key: string) => void;
  onSaved: () => void;
}

function ConfigEditor({ document, activeModule, onActiveModuleChange, onSaved }: ConfigEditorProps) {
  const [values, setValues] = useState<ConfigValues>(() => structuredClone(document.values));
  const [dirtyPaths, setDirtyPaths] = useState<Set<string>>(() => new Set());
  const [validationError, setValidationError] = useState<string | null>(null);
  const updateConfig = useUpdateConfig();
  const overridden = new Set(document.overridden_fields);
  const isDirty = dirtyPaths.size > 0;
  const activeSection = document.sections.find((section) => section.key === activeModule) ?? document.sections[0];

  const handleChange = (path: string, value: unknown) => {
    setValues((current) => setValueAtPath(current, path, value));
    setDirtyPaths((current) => new Set(current).add(path));
    setValidationError(null);
  };

  const reset = () => {
    setValues(structuredClone(document.values));
    setDirtyPaths(new Set());
    setValidationError(null);
    updateConfig.reset();
  };

  const save = async () => {
    const favoriteError = dirtyPaths.has("favorite_list") ? validateFavorites(values) : null;
    if (favoriteError) {
      setValidationError(favoriteError);
      return;
    }
    try {
      await updateConfig.mutateAsync({
        revision: document.revision,
        changes: topLevelChanges(values, dirtyPaths),
      });
      setDirtyPaths(new Set());
      onSaved();
    } catch {
      // The mutation exposes its normalized message below.
    }
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-7">
      <aside className="min-w-0">
        <nav aria-label="配置模块" className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
          {document.sections.map((section) => {
            const isActive = section.key === activeSection.key;
            return (
              <button
                key={section.key}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => onActiveModuleChange(section.key)}
                className={`group flex min-w-max items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition lg:w-full lg:min-w-0 ${isActive ? "border-ink bg-ink text-paper shadow-sm" : "border-stone-200/80 bg-surface/55 text-stone-500 hover:border-stone-300 hover:text-ink dark:border-stone-800 dark:bg-white/[0.025]"}`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isActive ? "bg-paper/10 text-accent" : "bg-stone-100 text-stone-400 group-hover:text-accent-deep dark:bg-white/[0.05]"}`}>
                  <ModuleIcon section={section} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{section.title}</span>
                  <span className={`hidden truncate text-[11px] lg:block ${isActive ? "text-paper/55" : "text-stone-400"}`}>{section.fields.length} 项设置</span>
                </span>
                <ChevronRight className={`hidden h-4 w-4 lg:block ${isActive ? "text-paper/45" : "text-stone-300"}`} aria-hidden="true" />
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 space-y-5">
        <section key={activeSection.key} className="card animate-fade-in overflow-hidden">
          <header className="border-b border-stone-100 px-5 py-5 sm:px-6 dark:border-stone-800">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent-deep">
                <ModuleIcon section={activeSection} />
              </span>
              <h2 className="text-base font-bold tracking-tight text-ink">{activeSection.title}</h2>
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-stone-400">{activeSection.description}</p>
          </header>
          <div className="divide-y divide-stone-100 px-5 sm:px-6 dark:divide-stone-800">
            {activeSection.fields.map((field) => {
              const fieldRoot = field.key.split(".")[0];
              const disabled = overridden.has(fieldRoot);
              const isCollection = field.type === "favorite-list";
              if (isCollection) {
                return (
                  <div key={field.key} className="py-5">
                    <FieldControl field={field} values={values} configuredSecrets={document.secret_status} dirtyPaths={dirtyPaths} disabled={disabled} onChange={handleChange} />
                  </div>
                );
              }
              return (
                <div key={field.key} className="grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,19rem)] sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-ink">{field.label}</label>
                      {disabled ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">命令行接管</span> : null}
                    </div>
                    {field.description ? <p className="mt-1 text-xs leading-5 text-stone-400">{field.description}</p> : null}
                  </div>
                  <FieldControl field={field} values={values} configuredSecrets={document.secret_status} dirtyPaths={dirtyPaths} disabled={disabled} onChange={handleChange} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-stone-200 px-5 py-4 dark:border-stone-800">
          <div className="flex items-start gap-3">
            <FileCode2 className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
            <div className="min-w-0 text-xs leading-5 text-stone-400">
              <p>配置文件 <code className="break-all font-mono text-stone-500 dark:text-stone-300">{document.system.config_file}</code></p>
              <p>数据文件 <code className="break-all font-mono text-stone-500 dark:text-stone-300">{document.system.data_path}</code>（仅启动时确定）</p>
            </div>
          </div>
        </section>

        {validationError || updateConfig.error ? (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {validationError ?? updateConfig.error?.message}
          </div>
        ) : null}

        <div className={`sticky bottom-4 z-30 flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-xl transition ${isDirty ? "border-accent/30 bg-surface/90 shadow-accent/10" : "pointer-events-none translate-y-2 border-transparent bg-surface/0 opacity-0 shadow-none"}`}>
          <p className="text-xs text-stone-400"><span className="font-semibold text-ink">{dirtyPaths.size}</span> 处修改尚未保存</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={reset} className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-ink dark:hover:bg-white/[0.06]">
              <RotateCcw className="h-3.5 w-3.5" /> 放弃
            </button>
            <button type="button" onClick={() => void save()} disabled={updateConfig.isPending} className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:opacity-85 disabled:opacity-50">
              {updateConfig.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {updateConfig.isPending ? "写入中…" : "保存并应用"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Settings() {
  const { data, isLoading, error, refetch, isFetching } = useConfig();
  const [saved, setSaved] = useState(false);
  const [activeModule, setActiveModule] = useState("runtime");

  if (isLoading) {
    return <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-28 text-stone-400"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />读取配置…</div>;
  }

  if (!data || error) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
        <h1 className="mt-4 text-lg font-bold">配置读取失败</h1>
        <p className="mt-2 text-sm text-stone-400">{error?.message}</p>
        <button onClick={() => void refetch()} className="mt-5 rounded-full bg-ink px-4 py-2 text-sm text-paper">重新读取</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">配置中心</h1>
        </div>
        <div className="flex items-center gap-2">
          {saved ? <span className="hidden items-center gap-1.5 text-xs font-medium text-emerald-600 sm:flex dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" />已写入并生效</span> : null}
          <button
            type="button"
            aria-label="重新读取配置"
            onClick={() => { setSaved(false); void refetch(); }}
            disabled={isFetching}
            className="rounded-full border border-stone-200 p-2.5 text-stone-400 transition hover:border-stone-300 hover:text-ink disabled:opacity-50 dark:border-stone-800"
          >
            {isFetching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {saved ? <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700 sm:hidden dark:bg-emerald-500/10 dark:text-emerald-300"><Check className="h-4 w-4" />配置已安全写入并生效</div> : null}
      <ConfigEditor
        key={data.revision}
        document={data}
        activeModule={activeModule}
        onActiveModuleChange={setActiveModule}
        onSaved={() => setSaved(true)}
      />
    </div>
  );
}
