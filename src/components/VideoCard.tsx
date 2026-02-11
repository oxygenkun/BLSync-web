import type { VideoInfo } from "../types/video";

interface VideoCardProps {
  videoInfo: VideoInfo;
}

export function VideoCard({ videoInfo }: VideoCardProps) {
  return (
    <div className="card group overflow-hidden">
      {/* 渐变装饰条 */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

      <div className="p-6">
        {/* 视频信息 */}
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
              {videoInfo.title}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <span className="text-white text-xs font-medium">UP</span>
              </div>
              <p className="text-sm text-slate-600">
                {videoInfo.owner.name}
              </p>
            </div>
          </div>

          {videoInfo.desc && (
            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
              {videoInfo.desc}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              videoInfo.videos > 1
                ? "bg-blue-50 text-blue-700"
                : "bg-emerald-50 text-emerald-700"
            }`}>
              {videoInfo.videos > 1 ? `${videoInfo.videos} 集` : "单集视频"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
