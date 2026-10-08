import { useQuery } from "@tanstack/react-query";
import { getVideoInfo } from "../api/video";

export function useVideoInfo(bvid: string) {
  return useQuery({
    queryKey: ["video", bvid],
    queryFn: () => getVideoInfo(bvid),
    enabled: !!bvid,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
