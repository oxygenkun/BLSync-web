import { create } from "zustand";
import type { VideoInfo } from "../types/video";

interface TaskStore {
  // 添加任务页面状态
  url: string;
  videoInfo: VideoInfo | null;
  selectedEpisodes: number[];
  error: string | null;

  // Actions
  setUrl: (url: string) => void;
  setVideoInfo: (info: VideoInfo | null) => void;
  setSelectedEpisodes: (episodes: number[]) => void;
  toggleEpisode: (index: number) => void;
  selectAllEpisodes: () => void;
  deselectAllEpisodes: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  // 初始状态
  url: "",
  videoInfo: null,
  selectedEpisodes: [],
  error: null,

  // Actions
  setUrl: (url) => set({ url, error: null }),

  setVideoInfo: (info) => set({ videoInfo: info }),

  setSelectedEpisodes: (episodes) => set({ selectedEpisodes: episodes }),

  toggleEpisode: (index) =>
    set((state) => {
      const isSelected = state.selectedEpisodes.includes(index);
      return {
        selectedEpisodes: isSelected
          ? state.selectedEpisodes.filter((i) => i !== index)
          : [...state.selectedEpisodes, index],
      };
    }),

  selectAllEpisodes: () =>
    set((state) => ({
      selectedEpisodes: state.videoInfo?.pages.map((_, i) => i) || [],
    })),

  deselectAllEpisodes: () => set({ selectedEpisodes: [] }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      url: "",
      videoInfo: null,
      selectedEpisodes: [],
      error: null,
    }),
}));
