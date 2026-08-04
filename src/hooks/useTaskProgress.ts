import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../api/client";
import type { Task, TaskProgressEvent } from "../types/task";

type TaskProgressMap = Record<number, TaskProgressEvent>;

export function useTaskProgress(tasks: Task[]) {
  const [progressByTaskId, setProgressByTaskId] = useState<TaskProgressMap>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource(`${API_BASE_URL}/tasks/events`);
      const handleEvent = (event: MessageEvent<string>) => {
        const payload = JSON.parse(event.data) as TaskProgressEvent;
        if (payload.task_id === null) return;
        const taskId = payload.task_id;
        setProgressByTaskId((current) => ({
          ...current,
          [taskId]: payload,
        }));
        if (payload.event !== "progress") {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["taskStats"] });
        }
      };

      source.addEventListener("status", handleEvent as EventListener);
      source.addEventListener("progress", handleEvent as EventListener);
      source.addEventListener("completed", handleEvent as EventListener);
      source.addEventListener("failed", handleEvent as EventListener);

    return () => {
      source.close();
    };
  }, [queryClient]);

  return useMemo(() => {
    const visibleTaskIds = new Set(tasks.map((task) => task.id));
    return Object.fromEntries(
      Object.entries(progressByTaskId).filter(([taskId]) =>
        visibleTaskIds.has(Number(taskId)),
      ),
    );
  }, [progressByTaskId, tasks]);
}
