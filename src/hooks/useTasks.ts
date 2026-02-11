import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTask, getTaskStats, getTasks, updateTaskStatus } from "../api/tasks";
import type { CreateTaskRequest, TaskQuery } from "../types/task";

/**
 * 获取任务列表
 */
export function useTasks(query: TaskQuery = {}) {
  return useQuery({
    queryKey: ["tasks", query],
    queryFn: () => getTasks(query),
    refetchInterval: 5000, // 自动刷新（5秒）
  });
}

/**
 * 获取任务统计
 */
export function useTaskStats() {
  return useQuery({
    queryKey: ["taskStats"],
    queryFn: getTaskStats,
    refetchInterval: 5000,
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
