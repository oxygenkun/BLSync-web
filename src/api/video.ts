import { apiClient } from "./client";
import type { VideoInfo } from "../types/video";

/**
 * 获取视频信息
 */
export async function getVideoInfo(bvid: string): Promise<VideoInfo> {
  return apiClient.get("/video/info", { params: { bvid } });
}
