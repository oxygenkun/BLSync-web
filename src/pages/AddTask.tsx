import { useNavigate } from "react-router-dom";
import { useTaskStore } from "../store/taskStore";
import { useVideoInfo } from "../hooks/useVideoInfo";
import { useCreateTask } from "../hooks/useTasks";
import { extractBvid, isValidBvid } from "../lib/bvid-parser";
import { URLInput } from "../components/URLInput";
import { VideoCard } from "../components/VideoCard";
import { EpisodeSelector } from "../components/EpisodeSelector";

export function AddTask() {
  const navigate = useNavigate();
  const { url, setUrl, setVideoInfo, selectedEpisodes, toggleEpisode, selectAllEpisodes, deselectAllEpisodes, setError } = useTaskStore();

  const bvid = extractBvid(url);
  const { data: videoInfo, isLoading } = useVideoInfo(bvid || "");
  const createTaskMutation = useCreateTask();

  // 更新 store 中的视频信息
  if (videoInfo && videoInfo.bvid !== bvid) {
    setVideoInfo(videoInfo);
  }

  const handleSubmit = async () => {
    if (!bvid || !isValidBvid(bvid)) {
      setError("无效的 Bilibili 链接");
      return;
    }

    if (!videoInfo) {
      setError("无法获取视频信息");
      return;
    }

    try {
      await createTaskMutation.mutateAsync({
        bid: bvid,
        favid: "-1",
        selected_episodes: selectedEpisodes.length > 0 ? selectedEpisodes : undefined,
      });

      // 成功后重置并跳转到任务列表
      navigate("/");
    } catch {
      setError("创建任务失败");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 animate-fade-in">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">添加下载任务</h1>
        <p className="text-slate-500 mt-1">粘贴 Bilibili 视频链接并选择要下载的分集</p>
      </div>

      {/* URL 输入 */}
      <div className="mb-6">
        <URLInput value={url} onChange={setUrl} />
      </div>

      {/* 视频信息预览 */}
      {videoInfo && (
        <div className="space-y-4 animate-fade-in">
          <VideoCard videoInfo={videoInfo} />

          {/* 分集选择（多P视频） */}
          {videoInfo.videos > 1 && (
            <EpisodeSelector
              pages={videoInfo.pages}
              selected={selectedEpisodes}
              onToggle={toggleEpisode}
              onSelectAll={selectAllEpisodes}
              onDeselectAll={deselectAllEpisodes}
            />
          )}

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={createTaskMutation.isPending}
            className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
          >
            {createTaskMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                创建中...
              </span>
            ) : "创建任务"}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="card p-12 text-center animate-fade-in">
          <div className="inline-flex flex-col items-center gap-3">
            <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-slate-500 font-medium">解析视频信息中...</span>
          </div>
        </div>
      )}

      {bvid && !isLoading && !videoInfo && (
        <div className="card p-12 text-center animate-fade-in">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-red-700 font-medium">无法获取视频信息</div>
            <p className="text-slate-500 text-sm">请检查链接是否正确或稍后重试</p>
          </div>
        </div>
      )}
    </div>
  );
}
