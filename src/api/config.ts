import { apiClient } from "./client";
import type { ConfigDocument } from "../types/config";

export async function getConfig(): Promise<ConfigDocument> {
  return apiClient.get("/config");
}

export async function updateConfig(
  revision: string,
  changes: Record<string, unknown>,
): Promise<ConfigDocument> {
  return apiClient.patch("/config", { revision, changes });
}

