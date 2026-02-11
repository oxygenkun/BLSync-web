import { useQuery } from "@tanstack/react-query";
import { getVideoInfo } from "../api/video";

export function useVideoInfo(bvid: string) {
  return useQuery({
    queryKey: ["video", bvid],
    queryFn: () => getVideoInfo(bvid),
    enabled: !!bvid,
    staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
    retry: 1,
  });
}
