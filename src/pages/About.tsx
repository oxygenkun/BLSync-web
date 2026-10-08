import { ExternalLink, Github, UserRound } from "lucide-react";

const repositoryUrl = "https://github.com/oxygenkun/BLSync";
const authorUrl = "https://github.com/oxygenkun";

export function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 animate-fade-in">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">About</p>
        <h1 className="font-display text-3xl font-bold italic text-ink">关于 BLSync</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">将 Bilibili 收藏夹中的视频同步到本地，并通过 WebUI 或桌面应用管理下载任务。</p>
      </div>

      <section className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white/55 shadow-sm dark:border-stone-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-4 border-b border-stone-200/80 p-6 dark:border-stone-800">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink font-display text-2xl font-bold italic text-accent">B</div>
          <div>
            <h2 className="text-xl font-bold text-ink">BLSync</h2>
            <p className="mt-1 text-sm text-stone-400">版本 0.7.1</p>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <a
            href={repositoryUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-stone-200/80 bg-white/60 p-4 transition hover:border-accent/50 hover:bg-accent/[0.04] dark:border-stone-700 dark:bg-white/[0.025]"
          >
            <Github className="h-5 w-5 text-stone-500 transition group-hover:text-accent-deep" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-stone-400">项目源码</span>
              <span className="block truncate text-sm font-semibold text-ink">oxygenkun/BLSync</span>
            </span>
            <ExternalLink className="h-4 w-4 text-stone-300" />
          </a>

          <a
            href={authorUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-stone-200/80 bg-white/60 p-4 transition hover:border-accent/50 hover:bg-accent/[0.04] dark:border-stone-700 dark:bg-white/[0.025]"
          >
            <UserRound className="h-5 w-5 text-stone-500 transition group-hover:text-accent-deep" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-stone-400">作者</span>
              <span className="block truncate text-sm font-semibold text-ink">oxygenkun</span>
            </span>
            <ExternalLink className="h-4 w-4 text-stone-300" />
          </a>
        </div>
      </section>
    </div>
  );
}
