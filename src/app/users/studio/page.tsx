"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { Check, ChevronLeft, Film, LockKeyhole, Pause, Play, Plus, RefreshCw, Sparkles, VolumeX, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteFooter } from "../../../components/site-footer";
import { SiteNav } from "../../../components/site-nav";
import { AmbientBackground } from "../../../components/ambient-background";
import { ScrollReveal } from "../../../components/scroll-reveal";
import { formatMediaError } from "../../../lib/captured-media";
import type { CapturedMediaRecord } from "../../../lib/offline-media";
import { createClient } from "../../../lib/supabase/client";
import { useTheme } from "../../theme-provider";

import { sanitizeTitle } from "@/lib/sanitize";

function StudioHeading() {
  return (
    <header className="feature-page-heading">
      <a href="/users" className="feature-back">
        <ChevronLeft size={16} /> Back to journal
      </a>
      <p className="workspace-eyebrow">
        <Film size={15} /> Make something from it
      </p>
      <h1>Compilation studio</h1>
      <p>Turn a handful of moments into a story you can replay.</p>
    </header>
  );
}

type StudioRange = "week" | "month";
type StudioItem = CapturedMediaRecord & { previewUrl: string };

function getRangeStart(range: StudioRange) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === "month") {
    start.setDate(1);
    return start;
  }
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start;
}

function chooseCompilationItems(items: StudioItem[]) {
  const photos = items.filter((item) => item.media_kind === "photo");
  const videos = items.filter((item) => item.media_kind === "video");
  const selected: StudioItem[] = [];
  while (selected.length < Math.min(items.length, 12) && (photos.length > 0 || videos.length > 0)) {
    if (photos.length > 0) selected.push(photos.shift() as StudioItem);
    if (videos.length > 0 && selected.length < 12) selected.push(videos.shift() as StudioItem);
  }
  return selected;
}

function loadCompilationMedia(item: StudioItem): Promise<HTMLImageElement | HTMLVideoElement> {
  if (item.media_kind === "photo") {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to load a photo for export."));
      image.src = item.previewUrl;
    });
  }
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadeddata = () => resolve(video);
    video.onerror = () => reject(new Error("Unable to load a video for export."));
    video.src = item.previewUrl;
  });
}

function StudioContent() {
  const router = useRouter();
  const [range, setRange] = useState<StudioRange>("week");
  const [title, setTitle] = useState("This week, in little pieces");
  const [mood, setMood] = useState("warm");
  const [availableItems, setAvailableItems] = useState<StudioItem[]>([]);
  const [items, setItems] = useState<StudioItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => () => { if (exportUrl) URL.revokeObjectURL(exportUrl); }, [exportUrl]);

  useEffect(() => {
    let active = true;
    const loadCompilation = async () => {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session?.user) {
        router.replace("/auth?next=/users/studio");
        return;
      }

      try {
        const { data, error: mediaError } = await supabase
          .from("captured_media")
          .select("id,user_id,storage_path,media_kind,file_name,caption,mime_type,file_size,captured_at,uploaded_at")
          .eq("user_id", session.user.id)
          .gte("captured_at", getRangeStart(range).toISOString())
          .order("captured_at", { ascending: false });
        if (mediaError) throw mediaError;

        const records = (data ?? []) as CapturedMediaRecord[];
        const withUrls: StudioItem[] = [];
        for (const record of records) {
          const { data: signed, error: signedError } = await supabase.storage.from("memories").createSignedUrl(record.storage_path, 60 * 60);
          if (!signedError && signed) withUrls.push({ ...record, previewUrl: signed.signedUrl });
        }
        if (active) {
          setAvailableItems(withUrls);
          setItems(chooseCompilationItems(withUrls));
          setActiveIndex(0);
          setTitle(range === "week" ? "This week, in little pieces" : "This month, in little pieces");
        }
      } catch (loadError) {
        if (active) setError(formatMediaError(loadError));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadCompilation();
    return () => { active = false; };
  }, [range, router]);

  useEffect(() => {
    if (!isPlaying || items.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % items.length), 4200);
    return () => window.clearInterval(timer);
  }, [isPlaying, items.length]);

  useEffect(() => {
    if (!isPreviewOpen) return;
    const handlePreviewKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsPreviewOpen(false);
      if (event.key === "ArrowLeft" && items.length > 1) setActiveIndex((index) => (index - 1 + items.length) % items.length);
      if (event.key === "ArrowRight" && items.length > 1) setActiveIndex((index) => (index + 1) % items.length);
    };
    window.addEventListener("keydown", handlePreviewKey);
    return () => window.removeEventListener("keydown", handlePreviewKey);
  }, [isPreviewOpen, items.length]);

  const activeItem = items[activeIndex];
  const moveSlide = (direction: -1 | 1) => {
    if (items.length < 2) return;
    setActiveIndex((index) => (index + direction + items.length) % items.length);
  };

  const toggleItem = (item: StudioItem) => {
    setItems((current) => {
      if (current.some((selected) => selected.id === item.id)) return current.filter((selected) => selected.id !== item.id);
      if (current.length >= 12) return current;
      return [...current, item];
    });
    setActiveIndex(0);
  };

  const exportCompilation = async () => {
    if (items.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    setError(null);
    if (exportUrl) URL.revokeObjectURL(exportUrl);
    setExportUrl(null);

    try {
      if (!window.MediaRecorder) throw new Error("Video export is not supported in this browser. Try the latest Chrome or Edge.");
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Unable to prepare the compilation canvas.");
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
      const stopped = new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });
      recorder.start();

      for (const [index, item] of items.entries()) {
        const media = await loadCompilationMedia(item);
        if (media instanceof HTMLVideoElement) {
          media.currentTime = 0;
          await media.play();
        }
        const startedAt = performance.now();
        const duration = 3500;
        await new Promise<void>((resolve) => {
          const drawFrame = () => {
            const elapsed = performance.now() - startedAt;
            context.fillStyle = "#3d1d28";
            context.fillRect(0, 0, canvas.width, canvas.height);
            const scale = Math.min(canvas.width / media.width, canvas.height / media.height);
            const width = media.width * scale;
            const height = media.height * scale;
            context.drawImage(media, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
            if (elapsed < duration) window.requestAnimationFrame(drawFrame);
            else resolve();
          };
          window.requestAnimationFrame(drawFrame);
        });
        if (media instanceof HTMLVideoElement) media.pause();
        setExportProgress(index + 1);
      }
      recorder.stop();
      await stopped;
      const webmBlob = new Blob(chunks, { type: mimeType });
      const ffmpeg = new FFmpeg();
      const coreBaseUrl = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${coreBaseUrl}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${coreBaseUrl}/ffmpeg-core.wasm`, "application/wasm"),
      });
      await ffmpeg.writeFile("compilation.webm", await fetchFile(webmBlob));
      await ffmpeg.exec(["-i", "compilation.webm", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "faststart", "compilation.mp4"]);
      const mp4 = await ffmpeg.readFile("compilation.mp4");
      const mp4Bytes = typeof mp4 === "string" ? new TextEncoder().encode(mp4) : mp4;
      const mp4Buffer = new ArrayBuffer(mp4Bytes.byteLength);
      new Uint8Array(mp4Buffer).set(mp4Bytes);
      setExportUrl(URL.createObjectURL(new Blob([mp4Buffer], { type: "video/mp4" })));
    } catch (exportError) {
      setError(formatMediaError(exportError));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="feature-content studio-page-grid">
      <div className="studio-preview studio-real-preview">
        {isLoading ? <div className="studio-preview-empty"><RefreshCw className="memories-sync-spinner" size={24} /><span>Gathering this {range}&apos;s moments</span></div> : activeItem ? (
          <>
            <div className="studio-stage-media">
              {activeItem.media_kind === "video" ? <video key={activeItem.id} src={activeItem.previewUrl} muted playsInline autoPlay={isPlaying} /> : <img key={activeItem.id} src={activeItem.previewUrl} alt={activeItem.caption || "Compilation moment"} />}
              <div className="studio-stage-shade" />
              <div className="studio-stage-topline"><span><VolumeX size={13} /> Preview is muted</span><span>{activeIndex + 1} / {items.length}</span></div>
              <button type="button" className="studio-stage-play" aria-label={isPlaying ? "Pause preview" : "Play preview"} onClick={() => setIsPlaying((playing) => !playing)}>{isPlaying ? <Pause size={21} /> : <Play size={21} fill="currentColor" />}</button>
              <button type="button" className="studio-stage-prev" aria-label="Previous moment" onClick={() => moveSlide(-1)} disabled={items.length < 2}><ChevronLeft size={20} /></button>
              <button type="button" className="studio-stage-next" aria-label="Next moment" onClick={() => moveSlide(1)} disabled={items.length < 2}><ChevronLeft size={20} /></button>
              <div className="studio-preview-copy"><span className="workspace-eyebrow">Automatic {range} preview</span><h2>{title || "Untitled story"}</h2><p>{items.length} {items.length === 1 ? "moment" : "moments"} · {activeItem.caption || (activeItem.media_kind === "photo" ? "Photo memory" : "Video memory")}</p></div>
            </div>
            <div className="studio-progress-dots">{items.map((item, index) => <button type="button" key={item.id} className={index === activeIndex ? "active" : ""} aria-label={`Show moment ${index + 1}`} onClick={() => { setActiveIndex(index); setIsPlaying(false); }} />)}</div>
          </>
        ) : (
          <div className="studio-preview-empty"><Film size={27} /><h2>No moments in this {range} yet</h2><p>Upload a few photos or videos and your preview will appear here.</p><Link href="/users/capture" className="workspace-primary">Add a moment</Link></div>
        )}
      </div>
      <div className="feature-form">
        <div className="studio-range-tabs" aria-label="Compilation period">
          <button type="button" className={range === "week" ? "active" : ""} onClick={() => setRange("week")}>This week</button>
          <button type="button" className={range === "month" ? "active" : ""} onClick={() => setRange("month")}>This month</button>
        </div>
        <label>
          Story title
          <input
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(sanitizeTitle(e.target.value, 80))}
          />
        </label>
        <label>
          Compilation mood
          <select value={mood} onChange={(event) => setMood(event.target.value)}>
            <option value="warm">Warm and nostalgic</option>
            <option value="bright">Bright and playful</option>
            <option value="quiet">Quiet and cinematic</option>
          </select>
        </label>
        <div className="studio-settings-note"><Sparkles size={16} /><p><strong>{mood === "warm" ? "Warm and nostalgic" : mood === "bright" ? "Bright and playful" : "Quiet and cinematic"}</strong><span>The preview automatically selects a balanced mix of your moments.</span></p></div>
        <button type="button" className="workspace-primary" disabled={isLoading || items.length === 0} onClick={() => { setIsPlaying(true); setIsPreviewOpen(true); }}>
          <Sparkles size={16} /> Play automatic preview
        </button>
        <div className="studio-selection-panel">
          <div className="studio-selection-heading"><div><span className="workspace-eyebrow">Edit your story</span><strong>Include moments</strong></div><span>{items.length} / 12</span></div>
          <div className="studio-selection-list">
            {availableItems.map((item) => {
              const included = items.some((selected) => selected.id === item.id);
              return <button type="button" key={item.id} className={`studio-selection-item ${included ? "included" : ""}`} aria-pressed={included} onClick={() => toggleItem(item)} disabled={!included && items.length >= 12}>
                <span className="studio-selection-thumb">{item.media_kind === "video" ? <video src={item.previewUrl} muted playsInline preload="metadata" /> : <img src={item.previewUrl} alt="" />}<span>{included ? <Check size={12} /> : <Plus size={12} />}</span></span>
                <span><strong>{item.caption || (item.media_kind === "photo" ? "Photo memory" : "Video memory")}</strong><small>{new Date(item.captured_at).toLocaleDateString()}</small></span>
              </button>;
            })}
          </div>
        </div>
        <button type="button" className="workspace-secondary studio-export-button" disabled={isLoading || items.length === 0 || isExporting} onClick={() => void exportCompilation()}>
          <Film size={16} /> {isExporting ? `Creating MP4 · ${exportProgress} of ${items.length}` : "Create MP4 compilation"}
        </button>
        {isExporting ? <div className="studio-export-status" role="status"><div className="capture-upload-progress"><span style={{ transform: `scaleX(${items.length > 0 ? exportProgress / items.length : 0})` }} /></div><span>Building your compilation in this browser.</span></div> : null}
        {exportUrl ? <a className="workspace-primary studio-download" href={exportUrl} download={`${title || "momenta-compilation"}.mp4`}><Play size={15} /> Download MP4</a> : null}
        {error ? <p className="capture-error" role="alert">{error}</p> : null}
        <p className="workspace-hint">Video export can be added after the preview feels right.</p>
      </div>
      {isPreviewOpen && activeItem ? (
        <div className="studio-preview-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsPreviewOpen(false); }}>
          <section className="studio-preview-modal-card" role="dialog" aria-modal="true" aria-labelledby="studio-preview-title">
            <button type="button" className="journal-close studio-preview-close" aria-label="Close compilation preview" onClick={() => setIsPreviewOpen(false)}><X size={18} /></button>
            <div className="studio-modal-media">
              {activeItem.media_kind === "video" ? <video key={activeItem.id} src={activeItem.previewUrl} muted playsInline autoPlay={isPlaying} /> : <img key={activeItem.id} src={activeItem.previewUrl} alt={activeItem.caption || "Compilation moment"} />}
              <div className="studio-stage-shade" />
              <div className="studio-stage-topline"><span><VolumeX size={13} /> Preview is muted</span><span>{activeIndex + 1} / {items.length}</span></div>
              <button type="button" className="studio-stage-play" aria-label={isPlaying ? "Pause preview" : "Play preview"} onClick={() => setIsPlaying((playing) => !playing)}>{isPlaying ? <Pause size={21} /> : <Play size={21} fill="currentColor" />}</button>
              <button type="button" className="studio-stage-prev" aria-label="Previous moment" onClick={() => moveSlide(-1)} disabled={items.length < 2}><ChevronLeft size={20} /></button>
              <button type="button" className="studio-stage-next" aria-label="Next moment" onClick={() => moveSlide(1)} disabled={items.length < 2}><ChevronLeft size={20} /></button>
              <div className="studio-modal-caption"><span className="workspace-eyebrow">Automatic {range} preview</span><h2 id="studio-preview-title">{title || "Untitled story"}</h2><p>{activeItem.caption || (activeItem.media_kind === "photo" ? "Photo memory" : "Video memory")}</p></div>
            </div>
            <div className="studio-progress-dots">{items.map((item, index) => <button type="button" key={item.id} className={index === activeIndex ? "active" : ""} aria-label={`Show moment ${index + 1}`} onClick={() => { setActiveIndex(index); setIsPlaying(false); }} />)}</div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default function StudioPage() {
  const { isNight } = useTheme();

  return (
    <main className={`feature-page ${isNight ? "is-night" : ""}`}>
      <AmbientBackground />
      <SiteNav variant="journal" />
      <div className="feature-page-shell">
        <ScrollReveal direction="left">
          <StudioHeading />
        </ScrollReveal>
        <ScrollReveal>
          <StudioContent />
        </ScrollReveal>
        <ScrollReveal>
          <section className="feature-note">
            <LockKeyhole size={16} />
            <span>Everything here is a design preview. Your memories stay yours.</span>
          </section>
        </ScrollReveal>
      </div>
      <SiteFooter homeHref="/users" />
    </main>
  );
}
