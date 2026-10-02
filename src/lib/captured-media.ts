import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MAX_OFFLINE_BYTES,
  getOfflineSnapshot,
  saveOfflineSnapshot,
  type CapturedMediaRecord,
  type OfflineMediaItem,
  type OfflineSnapshot,
} from "./offline-media";

const BUCKET = "memories";
const VIDEO_PREVIEW_BUDGET = 512 * 1024;

export function formatMediaError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error !== "object" || error === null) return typeof error === "string" ? error : "An unexpected media error occurred.";

  const value = error as Record<string, unknown>;
  const code = typeof value.code === "string" ? value.code : "";
  const message = typeof value.message === "string" ? value.message : "";
  if (/column .*caption.*(does not exist|not found)/i.test(message)) {
    return "Supabase is missing the caption column. Run supabase/migrations/20261002000000_media_captions.sql in the Supabase Dashboard SQL Editor, then reload the app.";
  }
  if (code === "PGRST205" || code === "42P01" || /captured_media.*(not found|does not exist)/i.test(message)) {
    return "Supabase is missing public.captured_media. Run supabase/migrations/20261001000000_captured_media.sql in the Supabase Dashboard SQL Editor, then retry this staged upload.";
  }

  const details = [message, value.details, value.hint]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" ");
  return details || (code ? `Media request failed (${code}).` : "The browser or service returned no error details.");
}

async function createVideoPreview(url: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const timeout = window.setTimeout(() => finish(null), 12000);
    const finish = (blob: Blob | null) => {
      window.clearTimeout(timeout);
      video.removeAttribute("src");
      video.load();
      resolve(blob);
    };

    video.onloadeddata = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(video.videoWidth, 960);
        canvas.height = Math.round(canvas.width * video.videoHeight / video.videoWidth);
        const context = canvas.getContext("2d");
        if (!context || canvas.width === 0 || canvas.height === 0) {
          finish(null);
          return;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => finish(blob), "image/jpeg", 0.78);
      } catch {
        finish(null);
      }
    };
    video.onerror = () => finish(null);
    video.src = url;
  });
}

export async function syncOfflineMedia(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ snapshot: OfflineSnapshot; uncachedCount: number }> {
  const { data, error } = await supabase
    .from("captured_media")
    .select("id,user_id,storage_path,media_kind,file_name,caption,mime_type,file_size,captured_at,uploaded_at")
    .eq("user_id", userId)
    .order("captured_at", { ascending: false })
    .order("uploaded_at", { ascending: false });

  if (error) throw error;
  const records = (data ?? []) as CapturedMediaRecord[];
  const previous = await getOfflineSnapshot(userId);
  const previousById = new Map(previous?.items.map((item) => [item.id, item]) ?? []);
  const items: OfflineMediaItem[] = [];
  let cachedBytes = 0;

  for (const record of records) {
    const oldItem = previousById.get(record.id);
    let offlineBlob = oldItem?.offlineBlob ?? null;
    const budget = record.media_kind === "photo" ? record.file_size : VIDEO_PREVIEW_BUDGET;

    if (!offlineBlob && cachedBytes + budget <= MAX_OFFLINE_BYTES) {
      const { data: signed, error: signedError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(record.storage_path, 60 * 60);
      if (!signedError) {
        if (record.media_kind === "photo") {
          const response = await fetch(signed.signedUrl, { cache: "no-store" });
          if (response.ok) offlineBlob = await response.blob();
        } else {
          offlineBlob = await createVideoPreview(signed.signedUrl);
        }
      }
    }

    if (offlineBlob && cachedBytes + offlineBlob.size <= MAX_OFFLINE_BYTES) {
      cachedBytes += offlineBlob.size;
    } else {
      offlineBlob = null;
    }
    items.push({ ...record, offlineBlob });
  }

  const snapshot: OfflineSnapshot = { userId, syncedAt: new Date().toISOString(), items };
  await saveOfflineSnapshot(snapshot);
  return { snapshot, uncachedCount: items.filter((item) => !item.offlineBlob).length };
}
