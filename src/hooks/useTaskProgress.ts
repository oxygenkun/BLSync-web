import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../api/client";
import type { Task, TaskProgressEvent } from "../types/task";

type TaskProgressMap = Record<number, TaskProgressEvent>;

const STREAMABLE_STATUSES = new Set(["ready", "consuming", "downloading"]);

export function useTaskProgress(tasks: Task[]) {
  const [progressByTaskId, setProgressByTaskId] = useState<TaskProgressMap>({});
  const queryClient = useQueryClient();
  const activeTaskIds = tasks
    .filter((task) => STREAMABLE_STATUSES.has(task.status))
    .map((task) => task.id)
    .sort((left, right) => left - right)
    .join(",");

  useEffect(() => {
    const sources = activeTaskIds
      .split(",")
      .filter(Boolean)
      .map(Number)
      .map((taskId) => {
      const source = new EventSource(buildEventsUrl(taskId));
      const handleEvent = (event: MessageEvent<string>) => {
        const payload = JSON.parse(event.data) as TaskProgressEvent;
        setProgressByTaskId((current) => ({
          ...current,
          [taskId]: payload,
        }));
        if (payload.event === "completed" || payload.event === "failed") {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["taskStats"] });
        }
      };

      source.addEventListener("status", handleEvent as EventListener);
      source.addEventListener("progress", handleEvent as EventListener);
      source.addEventListener("completed", handleEvent as EventListener);
      source.addEventListener("failed", handleEvent as EventListener);
      return source;
    });

    return () => {
      sources.forEach((source) => source.close());
    };
  }, [activeTaskIds, queryClient]);

  return progressByTaskId;
}

function buildEventsUrl(taskId: number): string {
  if (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")) {
    return `${API_BASE_URL}/tasks/${taskId}/events`;
  }
  return `${API_BASE_URL}/tasks/${taskId}/events`;
}
