import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore } from "../store/themeStore";
import type { ThemeMode } from "../lib/theme";

const modes: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
  { value: "light", label: "亮色", icon: Sun },
  { value: "dark", label: "暗色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
];

export function ThemeToggle() {
  const { mode, setMode } = useThemeStore();

  return (
    <div
      role="radiogroup"
      aria-label="主题模式"
      className="flex gap-0.5 p-0.5 rounded-full bg-stone-900/[0.05] dark:bg-white/[0.08]"
    >
      {modes.map((item) => {
        const isActive = mode === item.value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            role="radio"
            aria-checked={isActive}
            title={item.label}
            onClick={() => setMode(item.value)}
            className={`p-1.5 rounded-full transition-all duration-200 ${
              isActive
                ? "bg-white dark:bg-white/[0.16] text-ink shadow-sm"
                : "text-stone-400 dark:text-stone-500 hover:text-ink"
            }`}
          >
            <Icon className="w-4 h-4" strokeWidth={isActive ? 2.2 : 1.8} />
          </button>
        );
      })}
    </div>
  );
}
