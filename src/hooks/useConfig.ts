import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createQrLogin, getConfig, getQrLoginStatus, updateConfig } from "../api/config";

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

export function useCreateQrLogin() {
  return useMutation({ mutationFn: createQrLogin });
}

export function useQrLoginStatus(id: string | null) {
  return useQuery({
    queryKey: ["config-auth-qr", id],
    queryFn: () => getQrLoginStatus(id!),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "confirmed" || status === "expired" ? false : 1500;
    },
    retry: false,
  });
}

