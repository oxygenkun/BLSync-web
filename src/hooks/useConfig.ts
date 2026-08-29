import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConfig, updateConfig } from "../api/config";

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: getConfig,
    staleTime: 30_000,
  });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ revision, changes }: { revision: string; changes: Record<string, unknown> }) =>
      updateConfig(revision, changes),
    onSuccess: (document) => {
      queryClient.setQueryData(["config"], document);
    },
  });
}

