import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { batchDeleteTasks, batchUpdateTaskStatus, createTask, getTaskStats, getTasks, pauseTask, resumeTask, scanTasks, updateTaskStatus } from "../api/tasks";
import type { CreateTaskRequest, TaskQuery } from "../types/task";

/**
 * 获取任务列表
 */
export function useTasks(query: TaskQuery = {}) {
  return useQuery({
    queryKey: ["tasks", query],
    queryFn: () => getTasks(query),
  });
}

/**
 * 获取任务统计
 */
export function useTaskStats() {
  return useQuery({
    queryKey: ["taskStats"],
    queryFn: getTaskStats,
  });
}

/**
 * 创建任务
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskRequest) => createTask(data),
    onSuccess: () => {
      // 刷新任务列表
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
    },
  });
}

/**
 * 更新任务状态
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status, errorMessage }: {
      taskId: number;
      status: string;
      errorMessage?: string;
    }) => updateTaskStatus(taskId, status, errorMessage),
    onSuccess: () => {
      // 刷新任务列表和统计
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
    },
  });
}

/**
 * 立即扫描收藏夹
 */
export function useScanTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scanTasks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
    },
  });
}

/**
 * 批量更新任务状态
 */
export function useBatchUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskIds, status, errorMessage }: {
      taskIds: number[];
      status: string;
      errorMessage?: string;
    }) => batchUpdateTaskStatus(taskIds, status, errorMessage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
    },
  });
}

/**
 * 批量删除任务
 */
export function useBatchDeleteTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskIds: number[]) => batchDeleteTasks(taskIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
    },
  });
}

/**
 * 暂停任务
 */
export function usePauseTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => pauseTask(taskId),
    onSuccess: () => {
      // 刷新任务列表和统计
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
    },
  });
}

/**
 * 继续任务
 */
export function useResumeTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => resumeTask(taskId),
    onSuccess: () => {
      // 刷新任务列表和统计
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
    },
  });
}
