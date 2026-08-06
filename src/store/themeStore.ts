import { create } from "zustand";
import { applyMode, getStoredMode, storeMode, type ThemeMode } from "../lib/theme";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: getStoredMode(),
  setMode: (mode) => {
    storeMode(mode);
    applyMode(mode);
    set({ mode });
  },
}));
