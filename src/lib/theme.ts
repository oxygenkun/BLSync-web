export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "blsync-theme";

const media = window.matchMedia("(prefers-color-scheme: dark)");

export function getStoredMode(): ThemeMode {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export function storeMode(mode: ThemeMode): void {
  localStorage.setItem(STORAGE_KEY, mode);
}

export function applyMode(mode: ThemeMode): void {
  const dark = mode === "dark" || (mode === "system" && media.matches);
  document.documentElement.classList.toggle("dark", dark);
}

/** 应用当前主题并监听系统主题变化（仅 system 模式下生效） */
export function initTheme(): void {
  applyMode(getStoredMode());
  media.addEventListener("change", () => applyMode(getStoredMode()));
}
