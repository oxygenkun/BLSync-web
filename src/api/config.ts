import { API_BASE_URL, apiClient } from "./client";
import type { ConfigDocument, QrLoginCreated, QrLoginResult } from "../types/config";

export async function getConfig(): Promise<ConfigDocument> {
  return apiClient.get("/config");
}

export async function updateConfig(
  revision: string,
  changes: Record<string, unknown>,
): Promise<ConfigDocument> {
  return apiClient.patch("/config", { revision, changes });
}

export async function createQrLogin(): Promise<QrLoginCreated> {
  return apiClient.post("/config/auth/qr");
}

export async function getQrLoginStatus(id: string): Promise<QrLoginResult> {
  return apiClient.get(`/config/auth/qr/${id}`);
}

export function getQrLoginImageUrl(id: string): string {
  return `${API_BASE_URL}/config/auth/qr/${encodeURIComponent(id)}/image`;
}

