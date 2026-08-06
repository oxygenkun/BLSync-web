import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, AlertTriangle, Download } from "lucide-react";
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

  // Keep selection state aligned with the currently parsed video.
  useEffect(() => {
    setVideoInfo(videoInfo ?? null);
  }, [videoInfo, setVideoInfo]);

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
    <div className="max-w-2xl mx-auto px-6 py-10 animate-fade-in">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">添加下载任务</h1>
        <p className="text-sm text-stone-400 mt-1.5">粘贴 Bilibili 视频链接，选择要下载的分集</p>
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
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-accent to-accent-deep text-white font-medium rounded-full shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
          >
            {createTaskMutation.isPending ? (
              <>
                <LoaderCircle className="w-4 h-4 animate-spin" />
                创建中…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" strokeWidth={2} />
                创建任务
              </>
            )}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="card p-12 text-center animate-fade-in">
          <div className="inline-flex flex-col items-center gap-3">
            <LoaderCircle className="w-7 h-7 text-accent animate-spin" strokeWidth={2} />
            <span className="text-stone-400 text-sm font-medium">解析视频信息中…</span>
          </div>
        </div>
      )}

      {bvid && !isLoading && !videoInfo && (
        <div className="card p-12 text-center animate-fade-in">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-rose-500 dark:text-rose-400" strokeWidth={1.8} />
            </div>
            <div className="text-ink font-semibold">无法获取视频信息</div>
            <p className="text-stone-400 text-sm">请检查链接是否正确或稍后重试</p>
          </div>
        </div>
      )}
    </div>
  );
}
