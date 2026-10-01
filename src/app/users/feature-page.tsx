"use client";

import { ArrowUpRight, CalendarDays, Camera, Check, ChevronLeft, Eye, Film, Heart, ImagePlus, Loader2, LockKeyhole, Mic2, Pencil, Play, Sparkles, Trash2, Upload, Video, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import exifr from "exifr";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteFooter } from "../../components/site-footer";
import { SiteNav } from "../../components/site-nav";
import { ScrollReveal } from "../../components/scroll-reveal";
import { formatMediaError, syncOfflineMedia } from "../../lib/captured-media";
import { removeOfflineMediaItem } from "../../lib/offline-media";
import { useTheme } from "../theme-provider";
import { createClient } from "../../lib/supabase/client"; // adjust path

type Feature = "capture" | "studio" | "calendar" | "diary";
type DiaryEntry = { id: number; date: string; mood: string; title: string; text: string };

type UploadStatus = "uploading" | "done" | "error";

type CapturedItem = {
  id: string;
  url: string | null;
  kind: "photo" | "video";
  path: string | null;
  name: string;
  status: UploadStatus;
  error?: string;
};

type PendingFile = {
  id: string;
  file: File;
  kind: "photo" | "video";
  previewUrl: string;
  capturedAt: string;
};

const BUCKET = "memories";
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_BATCH_FILES = 10;

function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function readEmbeddedCaptureDate(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  try {
    const metadata = await exifr.parse(file, { pick: ["DateTimeOriginal", "CreateDate"] });
    const value = metadata?.DateTimeOriginal ?? metadata?.CreateDate;
    if (!value) return null;
    const normalizedValue = typeof value === "string"
      ? value.replace(/^(\d{4}):(\d{2}):(\d{2})\s/, "$1-$2-$3T")
      : value;
    const date = normalizedValue instanceof Date ? normalizedValue : new Date(normalizedValue);
    return Number.isNaN(date.getTime()) ? null : formatLocalDate(date);
  } catch {
    return null;
  }
}

const featureCopy = {
  capture: { eyebrow: "Keep the moment", title: "Capture together", description: "Bring in the photos and clips that make today worth remembering.", icon: ImagePlus },
  studio: { eyebrow: "Make something from it", title: "Compilation studio", description: "Turn a handful of moments into a story you can replay.", icon: Film },
  calendar: { eyebrow: "Make time for us", title: "Shared calendar", description: "A simple place for plans, dates, and the days you are already looking forward to.", icon: CalendarDays },
  diary: { eyebrow: "Put it somewhere safe", title: "Private diary", description: "A place for the full truth of the day: the frustrations, the happiness, and everything between.", icon: Heart },
};

function Heading({ feature }: { feature: Feature }) {
  const copy = featureCopy[feature]; const Icon = copy.icon;
  return <header className="feature-page-heading"><a href="/users" className="feature-back"><ChevronLeft size={16} /> Back to journal</a><p className="workspace-eyebrow"><Icon size={15} /> {copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.description}</p></header>;
}

function Capture() {
  const supabase = createClient();
  const [items, setItems] = useState<CapturedItem[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [viewing, setViewing] = useState<CapturedItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const pendingPreviewUrls = useRef(new Set<string>());

  useEffect(() => () => {
    pendingPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    pendingPreviewUrls.current.clear();
  }, []);

  const uploadingCount = items.filter((i) => i.status === "uploading").length;
  const isUploading = uploadingCount > 0;
  const doneItems = items.filter((i) => i.status === "done");

  const updateItem = (id: string, patch: Partial<CapturedItem>) => {
    setItems((current) => current.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const uploadFile = async (pendingFile: PendingFile): Promise<boolean> => {
    const { file, capturedAt } = pendingFile;
    const localId = pendingFile.id;
    const kind: "photo" | "video" = file.type.startsWith("video/") ? "video" : "photo";
    let uploadedPath: string | null = null;
    const captureDate = new Date(`${capturedAt}T12:00:00`);

    setItems((current) => current.some((item) => item.id === localId)
      ? current.map((item) => item.id === localId
        ? { ...item, url: null, path: null, status: "uploading", error: undefined }
        : item)
      : [...current, { id: localId, url: null, kind, path: null, name: file.name, status: "uploading" }]);

    if (file.size > 50 * 1024 * 1024) {
      updateItem(localId, { status: "error", error: "File is larger than 50 MB." });
      return false;
    }
    if (!capturedAt || Number.isNaN(captureDate.getTime())) {
      updateItem(localId, { status: "error", error: "Choose a valid capture date before uploading." });
      return false;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("You must be signed in to upload.");

      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      uploadedPath = path;

      const { data: signed, error: signError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60);

      if (signError) throw signError;

      const { error: recordError } = await supabase.from("captured_media").insert({
        user_id: user.id,
        storage_path: path,
        media_kind: kind,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        file_size: file.size,
        captured_at: captureDate.toISOString(),
      });
      if (recordError) throw recordError;

      updateItem(localId, { url: signed.signedUrl, path, status: "done" });
      return true;
    } catch (err) {
      let failureMessage = formatMediaError(err);
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([uploadedPath]);
        if (cleanupError) {
          console.error("Unable to clean up failed media upload", cleanupError);
          updateItem(localId, { path: uploadedPath });
          failureMessage = `${failureMessage} The uploaded file also needs cleanup.`;
        }
      }
      console.error("Media upload failed:", failureMessage, err);
      updateItem(localId, { status: "error", error: failureMessage });
      return false;
    }
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);
    const supported = selected.filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
    const unsupportedCount = selected.length - supported.length;
    const accepted = supported.filter((file) => file.size <= MAX_FILE_SIZE);
    const oversizedCount = supported.length - accepted.length;

    if (pendingFiles.length + accepted.length > MAX_BATCH_FILES) {
      setError(`Select up to ${MAX_BATCH_FILES} files per batch.`);
      return;
    }

    const fallbackDate = formatLocalDate(new Date());
    const staged = accepted.map((file): PendingFile => {
      const previewUrl = URL.createObjectURL(file);
      pendingPreviewUrls.current.add(previewUrl);
      return {
        id: crypto.randomUUID(),
        file,
        kind: file.type.startsWith("video/") ? "video" : "photo",
        previewUrl,
        capturedAt: fallbackDate,
      };
    });

    setPendingFiles((current) => [...current, ...staged]);
    for (const pendingFile of staged) {
      void readEmbeddedCaptureDate(pendingFile.file).then((capturedAt) => {
        if (!capturedAt) return;
        setPendingFiles((current) => current.map((item) => item.id === pendingFile.id && item.capturedAt === fallbackDate
          ? { ...item, capturedAt }
          : item));
      });
    }
    setError(unsupportedCount || oversizedCount
      ? `${unsupportedCount ? `${unsupportedCount} unsupported file${unsupportedCount === 1 ? " was" : "s were"} skipped. ` : ""}${oversizedCount ? `${oversizedCount} file${oversizedCount === 1 ? " is" : "s are"} over 50 MB and was skipped.` : ""}`
      : null);
  };

  const removePendingFile = (id: string) => {
    const removed = pendingFiles.find((file) => file.id === id);
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl);
      pendingPreviewUrls.current.delete(removed.previewUrl);
    }
    setPendingFiles((current) => current.filter((file) => file.id !== id));
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const clearPendingFiles = () => {
    const ids = new Set(pendingFiles.map((file) => file.id));
    pendingFiles.forEach((file) => {
      URL.revokeObjectURL(file.previewUrl);
      pendingPreviewUrls.current.delete(file.previewUrl);
    });
    setPendingFiles([]);
    setItems((current) => current.filter((item) => !ids.has(item.id)));
  };

  const updateCaptureDate = (id: string, capturedAt: string) => {
    setPendingFiles((current) => current.map((file) => file.id === id ? { ...file, capturedAt } : file));
  };

  const confirmUpload = async () => {
    if (isConfirming || pendingFiles.length === 0) return;
    setIsConfirming(true);
    const confirmedFiles = pendingFiles;
    try {
      const results = await Promise.all(confirmedFiles.map((pendingFile) => uploadFile(pendingFile)));
      const successfulIds = new Set(confirmedFiles.filter((_, index) => results[index]).map((pendingFile) => pendingFile.id));
      setPendingFiles((current) => current.filter((pendingFile) => !successfulIds.has(pendingFile.id)));
      confirmedFiles.filter((pendingFile) => successfulIds.has(pendingFile.id)).forEach((pendingFile) => {
        URL.revokeObjectURL(pendingFile.previewUrl);
        pendingPreviewUrls.current.delete(pendingFile.previewUrl);
      });
      const { data: { user } } = results.some(Boolean) ? await supabase.auth.getUser() : { data: { user: null } };
      if (user && navigator.onLine && results.some(Boolean)) {
        try {
          await syncOfflineMedia(supabase, user.id);
        } catch (syncError) {
          const message = formatMediaError(syncError);
          console.error("Uploads were persisted, but the offline snapshot could not be refreshed:", message, syncError);
          setError(`Uploads are saved, but offline copies could not be refreshed: ${message}`);
        }
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const removeItem = async (item: CapturedItem) => {
    if (item.path) {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([item.path]);
      if (storageError) {
        setError(storageError.message);
        return;
      }
      const { error: recordError } = await supabase.from("captured_media").delete().eq("storage_path", item.path);
      if (recordError) {
        setError(recordError.message);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user && navigator.onLine) {
        try {
          await removeOfflineMediaItem(user.id, item.path);
          await syncOfflineMedia(supabase, user.id);
        } catch (syncError) {
          console.error("Unable to refresh offline memories after deleting a file.", syncError);
        }
      }
    }
    setItems((current) => current.filter((i) => i.id !== item.id));
    if (viewing?.id === item.id) setViewing(null);
  };

  const openCamera = (mode: "photo" | "video") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = mode === "photo" ? "image/*" : "video/*";
    input.capture = mode === "photo" ? "environment" : "user";
    input.onchange = () => {
      addFiles(input.files);
      input.value = "";
    };
    input.click();
  };

  return (
    <div className="feature-content capture-grid">
      <label
        className={`upload-dropzone feature-dropzone ${isUploading ? "is-uploading" : ""}`}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("is-dragging"); }}
        onDragLeave={(e) => e.currentTarget.classList.remove("is-dragging")}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("is-dragging");
          addFiles(e.dataTransfer.files);
        }}
      >
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          disabled={isUploading || isConfirming}
          onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }}
        />

        <Upload size={30} />
        <strong>{isConfirming ? "Saving your selection" : "Drop photos or videos here"}</strong>
        <span>{isConfirming ? "You can add more once this batch finishes" : "or choose from your device"}</span>
        <small>Images and videos up to 50 MB · 10 per batch</small>
      </label>

      <div className="capture-side">
        <button type="button" className="capture-action" disabled={isUploading || isConfirming} onClick={() => openCamera("photo")}>
          <Camera size={20} />
          <span><strong>Take a photo</strong><small>Save a little piece of right now</small></span>
        </button>
        <button type="button" className="capture-action" disabled={isUploading || isConfirming} onClick={() => openCamera("video")}>
          <Video size={20} />
          <span><strong>Record a moment</strong><small>Make a clip for your future selves</small></span>
        </button>

      </div>

      {error ? <p className="capture-error">{error}</p> : null}

      {pendingFiles.length > 0 ? (
        <section className="capture-review">
          <header className="capture-review-heading">
            <div>
              <span className="workspace-eyebrow">Ready to save</span>
              <h2>Review your selection</h2>
              <p>Check each moment and its capture date before it leaves this device.</p>
            </div>
            <div className="capture-review-summary">
              <strong>{pendingFiles.length}</strong><span>{pendingFiles.length === 1 ? "file" : "files"}</span>
              <i />
              <strong>{(pendingFiles.reduce((total, item) => total + item.file.size, 0) / (1024 * 1024)).toFixed(1)}</strong><span>MB total</span>
            </div>
          </header>
          <div className="capture-review-grid">
            {pendingFiles.map((pendingFile, index) => (
              <article className="capture-review-item" key={pendingFile.id}>
                <div className="capture-review-preview">
                  {pendingFile.kind === "photo" ? (
                    <Image src={pendingFile.previewUrl} width={480} height={480} unoptimized alt={pendingFile.file.name} />
                  ) : (
                    <video src={pendingFile.previewUrl} muted playsInline preload="metadata" />
                  )}
                  <span>{pendingFile.kind === "photo" ? "Photo" : "Video"}</span>
                  <small>{String(index + 1).padStart(2, "0")}</small>
                </div>
                <div className="capture-review-meta">
                  <div className="capture-review-file">
                    <strong title={pendingFile.file.name}>{pendingFile.file.name}</strong>
                    <small>{(pendingFile.file.size / (1024 * 1024)).toFixed(1)} MB · {pendingFile.file.type || "Media file"}</small>
                  </div>
                  <div className="capture-review-date-row">
                    <label htmlFor={`capture-date-${pendingFile.id}`}>Capture date</label>
                    <input
                      id={`capture-date-${pendingFile.id}`}
                      type="date"
                      value={pendingFile.capturedAt}
                      disabled={isConfirming}
                      onChange={(event) => updateCaptureDate(pendingFile.id, event.target.value)}
                    />
                  </div>
                  <button className="capture-review-remove" type="button" disabled={isConfirming} onClick={() => removePendingFile(pendingFile.id)} aria-label={`Remove ${pendingFile.file.name}`} title="Remove from selection">
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="capture-review-confirm">
            <div className="capture-review-question">
              <strong>Ready to upload?</strong>
              <span>Are you sure you want to save these moments to your private gallery?</span>
            </div>
            <div className="capture-review-actions">
              <button type="button" className="workspace-secondary" disabled={isConfirming} onClick={clearPendingFiles}><X size={15} /> Clear selection</button>
              <button type="button" className="workspace-primary" disabled={isUploading || isConfirming} onClick={confirmUpload}>
                {isConfirming ? <Loader2 className="capture-submit-spinner" size={16} /> : <Upload size={15} />}
                {isConfirming ? isUploading ? `Uploading ${uploadingCount} ${uploadingCount === 1 ? "file" : "files"}…` : "Saving offline copies…" : `Upload ${pendingFiles.length} ${pendingFiles.length === 1 ? "file" : "files"}`}
              </button>
            </div>
          </div>
          {isConfirming ? <p className="capture-submit-status" role="status">Keep this page open while your memories are being saved.</p> : null}
        </section>
      ) : null}

      {/* Gallery of uploads */}
      {items.length > 0 ? (
        <section className="capture-gallery">
          <header className="capture-gallery-head">
            <div>
              <span className="workspace-eyebrow">Your uploads</span>
              <h2>Just uploaded</h2>
            </div>
            <Link href="/users/memories" className="capture-gallery-link">View full gallery <ArrowUpRight size={14} /></Link>
            <span className="capture-gallery-count">
              {doneItems.length} {doneItems.length === 1 ? "moment" : "moments"}
            </span>
          </header>

          <div className="capture-gallery-grid">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.button
                  key={item.id}
                  type="button"
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  className={`capture-tile is-${item.status}`}
                  onClick={() => item.status === "done" && setViewing(item)}
                  disabled={item.status !== "done"}
                >
                  {item.status === "done" && item.url ? (
                    item.kind === "photo" ? (
                      <img src={item.url} alt={item.name} />
                    ) : (
                      <video src={item.url} muted playsInline />
                    )
                  ) : (
                    <div className="capture-tile-skeleton">
                      {item.status === "uploading" ? (
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                        >
                          <Loader2 size={20} />
                        </motion.span>
                      ) : (
                        <X size={20} />
                      )}
                      <small>{item.name}</small>
                      {item.status === "error" && item.error ? <small className="capture-tile-error">{item.error}</small> : null}
                    </div>
                  )}

                  {item.status === "done" ? (
                    <span className="capture-tile-badge">
                      {item.kind === "video" ? <Play size={11} fill="currentColor" /> : <Check size={11} />}
                    </span>
                  ) : null}

                  <span
                    role="button"
                    tabIndex={0}
                    className="capture-tile-remove"
                    aria-label="Remove"
                    onClick={(e) => { e.stopPropagation(); removeItem(item); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); removeItem(item); } }}
                  >
                    <X size={14} />
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </section>
      ) : null}

      {/* Lightbox */}
      <AnimatePresence>
        {viewing ? (
          <motion.div
            className="capture-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setViewing(null); }}
          >
            <motion.div
              className="capture-lightbox-card"
              initial={{ opacity: 0, y: 22, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
            >
              <button
                type="button"
                className="journal-close"
                aria-label="Close"
                onClick={() => setViewing(null)}
              >
                <X size={17} />
              </button>

              <div className="capture-lightbox-media">
                {viewing.kind === "photo" ? (
                  <img src={viewing.url!} alt={viewing.name} />
                ) : (
                  <video src={viewing.url!} controls autoPlay playsInline />
                )}
              </div>

              <div className="capture-lightbox-meta">
                <span className="workspace-eyebrow">
                  {viewing.kind === "photo" ? "Photo" : "Video"}
                </span>
                <h3>{viewing.name}</h3>
              </div>

              <div className="capture-lightbox-actions">
                <button
                  type="button"
                  className="danger"
                  aria-label="Delete"
                  data-tooltip="Delete"
                  onClick={() => removeItem(viewing)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Studio() {
  return <div className="feature-content studio-page-grid"><div className="studio-preview"><div className="studio-filmstrip"><div className="memory-coral" /><div className="memory-rose" /><div className="memory-lilac" /></div><div className="studio-play"><Play size={23} fill="currentColor" /></div><div className="studio-preview-copy"><span className="workspace-eyebrow">Draft compilation</span><h2>August, in little pieces</h2><p>12 moments · 02:48 total</p></div></div><div className="feature-form"><label>Story title<input defaultValue="August, in little pieces" /></label><label>Compilation mood<select defaultValue="warm"><option value="warm">Warm and nostalgic</option><option value="bright">Bright and playful</option><option value="quiet">Quiet and cinematic</option></select></label><label>Music feeling<select defaultValue="soft"><option value="soft">Soft piano</option><option value="sunny">Sunny afternoon</option><option value="none">No music</option></select></label><button type="button" className="workspace-primary"><Sparkles size={16} /> Create mock compilation</button><p className="workspace-hint">This is a design preview. Video generation will be connected later.</p></div></div>;
}

function Calendar() {
  const days = Array.from({ length: 30 }, (_, index) => index + 1);
  return <div className="feature-content calendar-layout"><div className="calendar-card"><div className="calendar-top"><button type="button">&#8592;</button><h2>September 2026</h2><button type="button">&#8594;</button></div><div className="calendar-weekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{days.map((day) => <button type="button" key={day} className={[4, 12, 14, 25].includes(day) ? "has-event" : ""}>{day}{[4, 12, 14, 25].includes(day) ? <i /> : null}</button>)}</div></div><div className="upcoming-card"><span className="workspace-eyebrow">Coming up</span><div className="upcoming-event"><div className="date-block"><strong>14</strong><span>SEP</span></div><div><h3>Our day</h3><p>Anniversary dinner · 7:30 PM</p><span><Heart size={13} fill="currentColor" /> Both of us</span></div></div><div className="upcoming-event"><div className="date-block"><strong>25</strong><span>SEP</span></div><div><h3>Dinner at home</h3><p>Try the new pasta recipe</p><span><Heart size={13} fill="currentColor" /> Both of us</span></div></div><button type="button" className="workspace-secondary"><CalendarDays size={15} /> Add a shared plan</button></div></div>;
}

function DiaryHistory() {
  const [entries, setEntries] = useState<DiaryEntry[]>([
    { id: 1, date: "September 10, 2026", mood: "Hopeful", title: "A slow morning together", text: "We made coffee, talked about the weekend, and let the morning take its time." },
    { id: 2, date: "September 6, 2026", mood: "Bright", title: "The best kind of tired", text: "A long day, a late dinner, and laughing about absolutely nothing on the way home." },
    { id: 3, date: "August 29, 2026", mood: "Heavy", title: "A little overwhelmed", text: "Today felt full. Writing it down made the noise in my head feel a little more organized." },
    { id: 4, date: "August 22, 2026", mood: "Soft", title: "A note to future us", text: "Remember this ordinary evening: warm food, open windows, and nowhere else to be." },
  ]);
  const [viewing, setViewing] = useState<DiaryEntry | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  const beginEdit = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    setDraft(entry.text);
  };

  const updateEntry = (id: number) => {
    setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, text: draft } : entry));
    setEditingId(null);
  };

  return <section className="past-entries interactive-history"><div className="past-entries-heading"><div><span className="workspace-eyebrow">Your reflections</span><h2>Past entries</h2></div><span className="past-entry-count">{entries.length} notes</span></div><div className="history-scroll">{entries.map((entry) => <motion.article whileHover={{ y: -4 }} transition={{ duration: .2 }} className="past-entry" key={entry.id} onClick={() => setViewing(entry)}><div className="past-entry-date"><strong>{entry.date.split(" ")[1].replace(",", "")}</strong><span>{entry.date.split(" ")[0].slice(0, 3).toUpperCase()}</span></div><div><div className="past-entry-meta"><span>{entry.date}</span><span className="past-entry-mood">{entry.mood}</span></div>{editingId === entry.id ? <div className="history-editor" onClick={(event) => event.stopPropagation()}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} /><div><button type="button" className="workspace-secondary" onClick={() => setEditingId(null)}>Cancel</button><button type="button" className="workspace-primary" onClick={() => updateEntry(entry.id)}><Check size={14} /> Update</button></div></div> : <><h3>{entry.title}</h3><p>{entry.text}</p><div className="history-actions"><button type="button" aria-label="View note" data-tooltip="View" onClick={(event) => { event.stopPropagation(); setViewing(entry); }}><Eye size={15} /></button><button type="button" aria-label="Edit note" data-tooltip="Edit" onClick={(event) => { event.stopPropagation(); beginEdit(entry); }}><Pencil size={15} /></button><button type="button" className="danger" aria-label="Delete note" data-tooltip="Delete" onClick={(event) => { event.stopPropagation(); setEntries((current) => current.filter((item) => item.id !== entry.id)); }}><Trash2 size={15} /></button></div></>}</div></motion.article>)}</div><AnimatePresence>{viewing ? <motion.div className="history-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(event) => { if (event.target === event.currentTarget) setViewing(null); }}><motion.div className="history-modal-card" initial={{ opacity: 0, y: 22, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }}><button type="button" className="journal-close" onClick={() => setViewing(null)} aria-label="Close note"><X size={17} /></button><span className="workspace-eyebrow">{viewing.date} · {viewing.mood}</span><h3>{viewing.title}</h3><p>{viewing.text}</p><div className="history-modal-actions"><button type="button" aria-label="Edit note" data-tooltip="Edit" onClick={() => beginEdit(viewing)}><Pencil size={16} /></button><button type="button" className="danger" aria-label="Delete note" data-tooltip="Delete" onClick={() => { setEntries((current) => current.filter((item) => item.id !== viewing.id)); setViewing(null); }}><Trash2 size={16} /></button></div></motion.div></motion.div> : null}</AnimatePresence></section>;
}

function Diary() {
  const [mood, setMood] = useState("Soft");
  return <div className="feature-content diary-page-layout"><div className="diary-layout"><div className="diary-editor"><div className="diary-toolbar"><span>Today, September 13</span><div><button type="button" aria-label="Add photo"><ImagePlus size={16} /></button><button type="button" aria-label="Record voice note"><Mic2 size={16} /></button></div></div><textarea placeholder="What is on your heart today?" /><div className="diary-footer"><div className="mood-picker"><span>Today feels</span>{["Soft", "Bright", "Heavy", "Hopeful"].map((item) => <button key={item} type="button" className={mood === item ? "active" : ""} onClick={() => setMood(item)}>{item}</button>)}</div><button type="button" className="workspace-primary"><Check size={15} /> Save entry</button></div></div><aside className="diary-prompt"><Sparkles size={18} /><span className="workspace-eyebrow">A thought to carry</span><p>“You do not have to make a moment perfect for it to be worth keeping.”</p><small>Your diary is private by default.</small></aside></div><DiaryHistory /></div>;
}

export function FeaturePage({ feature }: { feature: Feature }) {
  const { isNight } = useTheme();
  return <main className={`feature-page ${isNight ? "is-night" : ""}`}><SiteNav variant="journal" /><div className="feature-page-shell"><ScrollReveal direction="left"><Heading feature={feature} /></ScrollReveal><ScrollReveal>{feature === "capture" ? <Capture /> : null}{feature === "studio" ? <Studio /> : null}{feature === "calendar" ? <Calendar /> : null}{feature === "diary" ? <Diary /> : null}</ScrollReveal><ScrollReveal><section className="feature-note"><LockKeyhole size={16} /><span>{feature === "capture" ? "Private to your account. Offline copies sync to this device." : "Everything here is a design preview. Your memories stay yours."}</span></section></ScrollReveal></div><SiteFooter homeHref="/users" /></main>;
}