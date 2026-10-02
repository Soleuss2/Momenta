"use client";

import { Camera, Check, ChevronLeft, FileCheck2, ImagePlus, LockKeyhole, Loader2, Trash2, Upload, Video, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { ConfirmationModal } from "../../../components/confirmation-modal";
import { AmbientBackground } from "../../../components/ambient-background";
import { SiteFooter } from "../../../components/site-footer";
import { SiteNav } from "../../../components/site-nav";
import { ScrollReveal } from "../../../components/scroll-reveal";
import { formatMediaError } from "../../../lib/captured-media";
import { createClient } from "../../../lib/supabase/client";
import { useTheme } from "../../theme-provider";

const BUCKET = "memories";
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_BATCH_SIZE = 250 * 1024 * 1024;

function CaptureHeading() {
  return (
    <header className="feature-page-heading">
      <a href="/users" className="feature-back">
        <ChevronLeft size={16} /> Back to journal
      </a>
      <p className="workspace-eyebrow">
        <ImagePlus size={15} /> Keep the moment
      </p>
      <h1>Capture together</h1>
      <p>Bring in the photos and clips that make today worth remembering.</p>
    </header>
  );
}

function MediaPreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return <span className="capture-preview-loading">Preparing preview</span>;
  return file.type.startsWith("video/") ? <video src={url} muted playsInline controls /> : <img src={url} alt={`Preview of ${file.name}`} />;
}

function CaptureContent() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [previewing, setPreviewing] = useState<File | null>(null);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [uploadFailed, setUploadFailed] = useState(false);

  const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  const addSelectedFiles = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    const rejected = selectedFiles.find((file) => {
      return (!file.type.startsWith("image/") && !file.type.startsWith("video/")) || file.size > MAX_FILE_SIZE;
    });
    if (rejected) {
      setError(`${rejected.name} must be an image or video smaller than 50 MB.`);
      return;
    }

    setError(null);
    setIsConfirmOpen(false);
    setUploadFailed(false);
    const existing = new Set(files.map(fileKey));
    const addedFiles = selectedFiles.filter((file) => !existing.has(fileKey(file)));
    setCaptions((currentCaptions) => ({ ...currentCaptions, ...Object.fromEntries(addedFiles.map((file) => [fileKey(file), ""])) }));
    setFiles((current) => [...current, ...addedFiles.filter((file) => !current.some((existingFile) => fileKey(existingFile) === fileKey(file)))]);
  };

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    addSelectedFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    addSelectedFiles(Array.from(event.dataTransfer.files));
  };

  const uploadFiles = async () => {
    if (files.length === 0 || isUploading) return;
    if (!navigator.onLine) {
      setError("You are offline. Reconnect before uploading a memory.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setIsConfirmOpen(false);
    setUploadFailed(false);
    const supabase = createClient();
    const uploadedPaths: string[] = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace("/auth?next=/users/capture");
        return;
      }

      for (const [index, file] of files.entries()) {
        if (!navigator.onLine) throw new Error("Your internet connection was interrupted. Reconnect and try again.");
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const storagePath = `${session.user.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });
        if (uploadError) throw uploadError;
        uploadedPaths.push(storagePath);

        const { error: recordError } = await supabase.from("captured_media").insert({
          user_id: session.user.id,
          storage_path: storagePath,
          media_kind: file.type.startsWith("video/") ? "video" : "photo",
          file_name: file.name,
          caption: captions[fileKey(file)]?.trim() || null,
          mime_type: file.type,
          file_size: file.size,
          captured_at: new Date(file.lastModified || Date.now()).toISOString(),
        });
        if (recordError) throw recordError;
        setUploadProgress(index + 1);
      }

      router.push("/users/memories");
    } catch (uploadError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(BUCKET).remove(uploadedPaths).catch(() => undefined);
      }
      setError(formatMediaError(uploadError));
      setUploadFailed(true);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="feature-content capture-grid">
      <label className="upload-dropzone feature-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
        <input type="file" accept="image/*,video/*" multiple onChange={addFiles} />
        <Upload size={30} />
        <strong>Drop photos or videos here</strong>
        <span>or choose from your device</span>
        <small>JPG, PNG, MP4 up to 50 MB</small>
      </label>
      <div className="capture-side">
        <input ref={cameraInputRef} className="capture-hidden-input" type="file" accept="image/*" capture="environment" onChange={addFiles} />
        <input ref={videoInputRef} className="capture-hidden-input" type="file" accept="video/*" capture="environment" onChange={addFiles} />
        <button type="button" className="capture-action" onClick={() => cameraInputRef.current?.click()}>
          <Camera size={20} />
          <span>
            <strong>Take a photo</strong>
            <small>Save a little piece of right now</small>
          </span>
        </button>
        <button type="button" className="capture-action" onClick={() => videoInputRef.current?.click()}>
          <Video size={20} />
          <span>
            <strong>Record a moment</strong>
            <small>Make a clip for your future selves</small>
          </span>
        </button>
        <div className="feature-info">
          <Sparkles size={17} />
          <p>Later, smart sorting can recognize places, people, and the feeling behind each moment.</p>
        </div>
        {error ? <p className="capture-error" role="alert">{error}</p> : null}
      </div>
      {files.length > 0 ? (
        <section className="capture-review" aria-live="polite">
          <div className="capture-review-heading">
            <div>
              <p className="workspace-eyebrow"><FileCheck2 size={14} /> Review before saving</p>
              <h2>These moments are ready to keep</h2>
              <p>Check each preview before anything leaves this device.</p>
            </div>
            <div className="capture-review-summary"><strong>{files.length}</strong><span>{files.length === 1 ? "moment" : "moments"}</span></div>
          </div>
          <div className="capture-review-grid">
            {files.map((file) => (
              <article className="capture-review-item" key={`${file.name}:${file.size}:${file.lastModified}`}>
                <button type="button" className="capture-review-preview capture-review-preview-button" onClick={() => setPreviewing(file)} aria-label={`Preview ${file.name}`}>
                  <MediaPreview file={file} />
                  <span>{file.type.startsWith("video/") ? "Video" : "Photo"}</span>
                  <small>{(file.size / (1024 * 1024)).toFixed(1)} MB</small>
                </button>
                <div className="capture-review-meta">
                  <div className="capture-review-file"><strong>{file.type.startsWith("image/") ? "Photo memory" : "Video memory"}</strong><small>{new Date(file.lastModified || Date.now()).toLocaleDateString()}</small><label><span>Caption</span><input value={captions[fileKey(file)] ?? ""} maxLength={180} placeholder="Add a note about this moment" onChange={(event) => setCaptions((current) => ({ ...current, [fileKey(file)]: event.target.value }))} /></label></div>
                  <button type="button" className="capture-review-remove" aria-label="Remove memory" disabled={isUploading} onClick={() => { setFiles((current) => current.filter((selected) => selected !== file)); setCaptions((current) => { const next = { ...current }; delete next[fileKey(file)]; return next; }); setIsConfirmOpen(false); }}><Trash2 size={14} /></button>
                </div>
              </article>
            ))}
          </div>
          <div className="capture-review-confirm">
            <div className="capture-review-actions">
              <button type="button" className="workspace-secondary" disabled={isUploading} onClick={() => { setFiles([]); setIsConfirmOpen(false); }}><X size={15} /> Clear selection</button>
              <button type="button" className="workspace-primary" disabled={isUploading} onClick={() => {
                const totalBytes = files.reduce((total, file) => total + file.size, 0);
                if (totalBytes > MAX_BATCH_SIZE) {
                  setError("This batch is larger than 250 MB. Remove a file before uploading.");
                  return;
                }
                setIsConfirmOpen(true);
              }}><Check size={15} /> {uploadFailed ? "Retry upload" : "Review complete"}</button>
            </div>
          </div>
        </section>
      ) : null}
      {previewing ? (
        <div className="capture-lightbox" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewing(null); }}>
          <div className="capture-lightbox-card" role="dialog" aria-modal="true" aria-label={`Preview ${previewing.name}`}>
            <button type="button" className="journal-close" aria-label="Close preview" onClick={() => setPreviewing(null)}><X size={17} /></button>
            <div className="capture-lightbox-media"><MediaPreview file={previewing} /></div>
            <div className="capture-lightbox-meta"><span className="workspace-eyebrow">{previewing.type.startsWith("video/") ? "Video preview" : "Photo preview"}</span><h3>{previewing.name}</h3><p>{(previewing.size / (1024 * 1024)).toFixed(1)} MB</p></div>
          </div>
        </div>
      ) : null}
      <ConfirmationModal
        open={isConfirmOpen}
        title="Upload these memories?"
        description="Are you sure you want to upload these memories? They will be saved to your private Momenta gallery."
        confirmLabel="Yes, upload"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={() => void uploadFiles()}
      />
      {isUploading ? (
        <div className="capture-upload-screen" role="dialog" aria-modal="true" aria-labelledby="capture-upload-title">
          <div className="capture-upload-screen-card">
            <div className="capture-upload-orbit"><Loader2 size={30} /></div>
            <p className="workspace-eyebrow">{isOnline ? "Saving securely" : "Connection interrupted"}</p>
            <h2 id="capture-upload-title">{isOnline ? "Uploading your moments" : "Waiting for internet"}</h2>
            <p>{isOnline ? "Momenta is syncing your memories with your private gallery." : "Reconnect to the internet to continue saving your memories."}</p>
            <div className="capture-upload-screen-progress" role="progressbar" aria-valuemin={0} aria-valuemax={files.length} aria-valuenow={uploadProgress}><span style={{ transform: `scaleX(${files.length > 0 ? uploadProgress / files.length : 0})` }} /></div>
            <div className="capture-upload-screen-meta"><strong>{uploadProgress} of {files.length}</strong><span>{isOnline ? "Please keep this window open" : "Reconnect and try again"}</span></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CapturePage() {
  const { isNight } = useTheme();

  return (
    <main className={`feature-page ${isNight ? "is-night" : ""}`}>
      <AmbientBackground />
      <SiteNav variant="journal" />
      <div className="feature-page-shell">
        <ScrollReveal direction="left">
          <CaptureHeading />
        </ScrollReveal>
        <ScrollReveal>
          <CaptureContent />
        </ScrollReveal>
        <ScrollReveal>
          <section className="feature-note">
            <LockKeyhole size={16} />
            <span>Your selected memories stay private and are only uploaded after you confirm.</span>
          </section>
        </ScrollReveal>
      </div>
      <SiteFooter homeHref="/users" />
    </main>
  );
}
