import axios from "axios";
import { API_BASE_URL } from "./client";
import type { TaskFilesResponse } from "../types/task";

const fileClient = axios.create({
  baseURL: getFileBaseUrl(),
  timeout: 30000,
});

fileClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.message || "请求失败";
    return Promise.reject(new Error(message));
  }
);

export async function getTaskFiles(taskId: number): Promise<TaskFilesResponse> {
  return fileClient.get(`/file/${taskId}`);
}

export function buildTaskFileUrl(downloadUrl: string): string {
  return `${getFileBaseUrl()}${downloadUrl}`;
}

export async function openTaskFile(downloadUrl: string): Promise<void> {
  await fileClient.post(`${downloadUrl}/open`);
}

export function isDesktopApp(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function getFileBaseUrl(): string {
  if (!API_BASE_URL || API_BASE_URL === "/api") {
    return "";
  }

  try {
    const url = new URL(API_BASE_URL, window.location.origin);
    if (url.pathname.endsWith("/api")) {
      url.pathname = url.pathname.slice(0, -"/api".length) || "/";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}
