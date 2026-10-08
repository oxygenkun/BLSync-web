import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, AlertTriangle, Download, Search, Link2 } from "lucide-react";
import { useTaskStore } from "../store/taskStore";
import { useVideoInfo } from "../hooks/useVideoInfo";
import { useCreateTask } from "../hooks/useTasks";
import { extractBvid, isValidBvid } from "../lib/bvid-parser";
import { URLInput } from "../components/URLInput";
import { VideoCard } from "../components/VideoCard";
import { EpisodeSelector } from "../components/EpisodeSelector";
import type { VideoDownloadCodec, VideoQuality } from "../types/task";

const videoCodecLabels: Record<VideoDownloadCodec, string> = {
  avc: "AVC / H.264",
  hevc: "HEVC / H.265",
  av1: "AV1",
};

export function AddTask() {
  const navigate = useNavigate();
  const { url, error, setUrl, setVideoInfo, selectedEpisodes, toggleEpisode, selectAllEpisodes, deselectAllEpisodes, setError, reset } = useTaskStore();
  const [requestedBvid, setRequestedBvid] = useState("");
  const [videoQuality, setVideoQuality] = useState<VideoQuality>(127);
  const [videoDownloadCodec, setVideoDownloadCodec] = useState<VideoDownloadCodec>("avc");

  const inputBvid = extractBvid(url);
  const { data: videoInfo, isFetching, isError, refetch } = useVideoInfo(requestedBvid);
  const createTaskMutation = useCreateTask();
  const previewIsCurrent = requestedBvid !== "" && requestedBvid === inputBvid;

  const selectedPages = videoInfo?.pages.filter((_, index) =>
    selectedEpisodes.length === 0 || selectedEpisodes.includes(index),
  ) ?? [];
  const commonStreams = (selectedPages[0]?.streams ?? []).filter((stream) =>
    selectedPages.every((page) => page.streams?.some((candidate) =>
      candidate.quality === stream.quality && candidate.codec === stream.codec,
    )),
  );
  const videoQualityOptions = commonStreams.filter((stream, index, streams) =>
    streams.findIndex((candidate) => candidate.quality === stream.quality) === index,
  );
  const selectedVideoQuality = videoQualityOptions.some((stream) => stream.quality === videoQuality)
    ? videoQuality
    : videoQualityOptions[0]?.quality;
  const codecOptions = commonStreams.filter((stream) => stream.quality === selectedVideoQuality);
  const selectedVideoCodec = codecOptions.some((stream) => stream.codec === videoDownloadCodec)
    ? videoDownloadCodec
    : codecOptions[0]?.codec;
  const hasAvailableStreams = selectedVideoQuality !== undefined && selectedVideoCodec !== undefined;

  // Keep selection state aligned with the currently parsed video.
  useEffect(() => {
    setVideoInfo(videoInfo ?? null);
  }, [videoInfo, setVideoInfo]);

  const handleParse = () => {
    if (!inputBvid || !isValidBvid(inputBvid)) {
      setError("无效的 Bilibili 链接");
      return;
    }

    setError(null);
    if (inputBvid === requestedBvid) {
      void refetch();
    } else {
      setVideoInfo(null);
      setRequestedBvid(inputBvid);
    }
  };

  const handleSubmit = async () => {
    if (!requestedBvid || !previewIsCurrent || !videoInfo || isFetching || isError) {
      setError("请先解析有效的视频链接");
      return;
    }

    if (!hasAvailableStreams) {
      setError("所选分集没有共同可下载的画质与编码，请调整分集选择");
      return;
    }

    try {
      await createTaskMutation.mutateAsync({
        bid: requestedBvid,
        favid: "-1",
        selected_episodes: selectedEpisodes.length > 0 ? selectedEpisodes : undefined,
        video_quality: selectedVideoQuality,
        video_download_codec: selectedVideoCodec,
      });

      reset();
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

      <form
        className="mb-5"
        onSubmit={(event) => {
          event.preventDefault();
          handleParse();
        }}
      >
        <div className="flex items-stretch gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <URLInput
              value={url}
              onChange={(value) => {
                setUrl(value);
                if (requestedBvid) {
                  setRequestedBvid("");
                  setVideoInfo(null);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!url.trim() || isFetching}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-sm font-medium text-paper shadow-sm transition-all hover:opacity-85 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
          >
            {isFetching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="hidden sm:inline">解析视频</span>
          </button>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
          支持 b23.tv 短链、Bilibili 视频链接和 BV 号；解析后可选择分集。
        </p>
      </form>

      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* 视频信息预览 */}
      {previewIsCurrent && videoInfo && !isFetching && !isError && (
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

          <fieldset className="card p-5" disabled={createTaskMutation.isPending || !hasAvailableStreams} aria-describedby="download-options-hint">
            <legend className="sr-only">下载选项</legend>
            <h2 className="text-sm font-semibold text-ink mb-4">下载选项</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="video-quality" className="block text-sm text-ink mb-2">首选画质</label>
                <select
                  id="video-quality"
                  value={selectedVideoQuality ?? ""}
                  onChange={(event) => setVideoQuality(Number(event.target.value) as VideoQuality)}
                  className="w-full rounded-xl border border-stone-200 bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50 dark:border-stone-700"
                >
                  {videoQualityOptions.length === 0 && <option value="">无可用画质</option>}
                  {videoQualityOptions.map((option) => (
                    <option key={option.quality} value={option.quality}>{option.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="video-codec" className="block text-sm text-ink mb-2">首选编码</label>
                <select
                  id="video-codec"
                  value={selectedVideoCodec ?? ""}
                  onChange={(event) => setVideoDownloadCodec(event.target.value as VideoDownloadCodec)}
                  className="w-full rounded-xl border border-stone-200 bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50 dark:border-stone-700"
                >
                  {codecOptions.length === 0 && <option value="">无可用编码</option>}
                  {codecOptions.map((option) => (
                    <option key={option.codec} value={option.codec}>{videoCodecLabels[option.codec]}</option>
                  ))}
                </select>
              </div>
            </div>
            <p id="download-options-hint" className="mt-3 text-xs text-stone-400 dark:text-stone-500">
              {hasAvailableStreams
                ? "仅显示当前账号及所选分集共同支持的画质与编码；下载时若可用性变化，会自动回退。"
                : "所选分集没有共同可下载的画质与编码，请分别选择分集下载，或检查账号权限后重新解析。"}
            </p>
          </fieldset>

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={createTaskMutation.isPending || !hasAvailableStreams}
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

      {isFetching && (
        <div className="card p-12 text-center animate-fade-in">
          <div className="inline-flex flex-col items-center gap-3">
            <LoaderCircle className="w-7 h-7 text-accent animate-spin" strokeWidth={2} />
            <span className="text-stone-400 text-sm font-medium">解析视频信息与可下载画质中…</span>
          </div>
        </div>
      )}

      {requestedBvid && previewIsCurrent && !isFetching && (isError || !videoInfo) && (
        <div className="card p-12 text-center animate-fade-in">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-rose-500 dark:text-rose-400" strokeWidth={1.8} />
            </div>
            <div className="text-ink font-semibold">无法解析视频或可下载画质</div>
            <p className="text-stone-400 text-sm">请检查链接是否正确或稍后重试</p>
          </div>
        </div>
      )}
    </div>
  );
}
