import type { VideoDownloadCodec, VideoQuality } from "./task";

export interface VideoStreamOption {
  quality: VideoQuality;
  codec: VideoDownloadCodec;
  description: string;
}

// 视频所有者信息
export interface VideoOwner {
  name: string;
  face: string;
}

// 分P信息
export interface VideoPage {
  page: number;
  part: string;
  duration: number;
  streams?: VideoStreamOption[];
}

// 视频信息
export interface VideoInfo {
  bvid: string;
  title: string;
  pic: string;
  desc: string;
  videos: number;
  pages: VideoPage[];
  owner: VideoOwner;
}
