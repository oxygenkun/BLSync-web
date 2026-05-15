import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../api/client";

const TASK_EVENT_NAMES = ["status", "completed", "failed"];

export function useTaskEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource(`${API_BASE_URL}/tasks/events`);
    const handleEvent = () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
    };

    TASK_EVENT_NAMES.forEach((eventName) => {
      source.addEventListener(eventName, handleEvent);
    });

    return () => {
      TASK_EVENT_NAMES.forEach((eventName) => {
        source.removeEventListener(eventName, handleEvent);
      });
      source.close();
    };
  }, [queryClient]);
}
