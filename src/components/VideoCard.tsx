import { Layers, User } from "lucide-react";
import type { VideoInfo } from "../types/video";

interface VideoCardProps {
  videoInfo: VideoInfo;
}

export function VideoCard({ videoInfo }: VideoCardProps) {
  return (
    <div className="card group overflow-hidden">
      <div className="p-6">
        {/* 视频信息 */}
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-ink line-clamp-2 group-hover:text-accent-deep transition-colors duration-200">
              {videoInfo.title}
            </h3>
            <div className="flex items-center gap-2 mt-2.5">
              <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center">
                <User className="w-3 h-3 text-accent-deep" strokeWidth={2} />
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {videoInfo.owner.name}
              </p>
            </div>
          </div>

          {videoInfo.desc && (
            <p className="text-sm text-stone-400 dark:text-stone-500 line-clamp-2 leading-relaxed">
              {videoInfo.desc}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              videoInfo.videos > 1
                ? "bg-accent/10 text-accent-deep"
                : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}>
              <Layers className="w-3 h-3" strokeWidth={2} />
              {videoInfo.videos > 1 ? `共 ${videoInfo.videos} 集` : "单集视频"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
