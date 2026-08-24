import { apiClient } from "./client";
import type { CreateTaskRequest, CreateTaskResponse, Task, TaskListResponse, TaskQuery, TaskStats } from "../types/task";

/**
 * 分页获取任务列表
 */
export async function getTasks(query: TaskQuery = {}): Promise<TaskListResponse> {
  return apiClient.get("/tasks", { params: query });
}

/**
 * 获取任务详情
 */
export async function getTaskDetail(taskId: number): Promise<Task> {
  return apiClient.get(`/tasks/${taskId}`);
}

/**
 * 创建下载任务
 */
export async function createTask(data: CreateTaskRequest): Promise<CreateTaskResponse> {
  return apiClient.post("/task/bili", data);
}

/**
 * 获取任务统计
 */
export async function getTaskStats(): Promise<TaskStats> {
  return apiClient.get("/tasks/status");
}

/**
 * 立即扫描收藏夹
 */
export async function scanTasks(): Promise<{ created: number; reset: number; skipped: number }> {
  return apiClient.post("/tasks/scan");
}

/**
 * 更新任务状态
 */
export async function updateTaskStatus(
  taskId: number,
  status: string,
  errorMessage?: string
): Promise<Task> {
  return apiClient.put(`/tasks/${taskId}/status`, {
    status,
    error_message: errorMessage,
  });
}

export interface BatchResult {
  succeeded: number[];
  failed: { task_id: number; detail: string }[];
}

/**
 * 批量更新任务状态
 */
export async function batchUpdateTaskStatus(
  taskIds: number[],
  status: string,
  errorMessage?: string
): Promise<BatchResult> {
  return apiClient.put("/tasks/status", {
    task_ids: taskIds,
    status,
    error_message: errorMessage,
  });
}

/**
 * 批量删除任务
 */
export async function batchDeleteTasks(taskIds: number[]): Promise<BatchResult> {
  return apiClient.delete("/tasks", { data: { task_ids: taskIds } });
}


/**
 * 暂停任务
 */
export async function pauseTask(taskId: number): Promise<Task> {
  return apiClient.post(`/tasks/${taskId}/pause`);
}

/**
 * 继续任务
 */
export async function resumeTask(taskId: number): Promise<Task> {
  return apiClient.post(`/tasks/${taskId}/resume`);
}
