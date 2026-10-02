"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CalendarDays, ChevronLeft, CloudOff, Loader2, Trash2, Video, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteFooter } from "../../../components/site-footer";
import { SiteNav } from "../../../components/site-nav";
import { createClient } from "../../../lib/supabase/client";
import { formatMediaError, syncOfflineMedia } from "../../../lib/captured-media";
import { clearOfflineSnapshots, getOfflineSnapshot, removeOfflineMediaItem, type OfflineSnapshot, type OfflineMediaItem } from "../../../lib/offline-media";
import { useTheme } from "../../theme-provider";

const BUCKET = "memories";

type GallerySort = "capture-newest" | "capture-oldest" | "upload-newest" | "name-asc";

const sortLabels: Record<GallerySort, string> = {
  "capture-newest": "Capture date · newest first",
  "capture-oldest": "Capture date · oldest first",
  "upload-newest": "Upload date · newest first",
  "name-asc": "File name · A to Z",
};

function sortItems(items: OfflineMediaItem[], sortBy: GallerySort) {
  return [...items].sort((left, right) => {
    if (sortBy === "name-asc") return left.file_name.localeCompare(right.file_name, undefined, { sensitivity: "base" });
    const field = sortBy === "upload-newest" ? "uploaded_at" : "captured_at";
    const direction = sortBy === "capture-oldest" ? 1 : -1;
    const timeDifference = (new Date(left[field]).getTime() - new Date(right[field]).getTime()) * direction;
    return timeDifference || new Date(right.uploaded_at).getTime() - new Date(left.uploaded_at).getTime();
  });
}

export default function MemoriesPage() {
  const router = useRouter();
  const { isNight } = useTheme();
  const supabase = createClient();
  const [snapshot, setSnapshot] = useState<OfflineSnapshot | null>(null);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [sortBy, setSortBy] = useState<GallerySort>("capture-newest");
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<OfflineMediaItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => () => Object.values(mediaUrls).forEach((url) => {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  }), [mediaUrls]);

  useEffect(() => {
    let active = true;
    let activeUserId: string | null = null;
    let syncInFlight = false;

    const setSnapshotAndUrls = async (nextSnapshot: OfflineSnapshot, offline: boolean) => {
      if (!active) return;
      setSnapshot(nextSnapshot);
      const urls: Record<string, string> = {};
      for (const item of nextSnapshot.items) {
        if (offline && item.offlineBlob) {
          urls[item.id] = URL.createObjectURL(item.offlineBlob);
          continue;
        }
        if (!offline) {
          const { data, error: signedError } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(item.storage_path, 60 * 60);
          if (signedError && item.offlineBlob) {
            urls[item.id] = URL.createObjectURL(item.offlineBlob);
          } else if (!signedError && data) {
            urls[item.id] = data.signedUrl;
          }
        }
      }
      if (active) setMediaUrls(urls);
      else Object.values(urls).forEach((url) => url.startsWith("blob:") && URL.revokeObjectURL(url));
    };

    const refreshOnline = async (userId: string) => {
      if (!navigator.onLine || syncInFlight) return;
      syncInFlight = true;
      setIsOffline(false);
      setIsSyncing(true);
      setError(null);
      try {
        const { snapshot: nextSnapshot } = await syncOfflineMedia(supabase, userId);
        await setSnapshotAndUrls(nextSnapshot, false);
      } catch (syncError) {
        if (active) setError(formatMediaError(syncError));
      } finally {
        syncInFlight = false;
        if (active) setIsSyncing(false);
      }
    };

    const load = async () => {
      setIsOffline(!navigator.onLine);
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session?.user) {
        router.replace("/auth?next=/users/memories");
        return;
      }
      activeUserId = session.user.id;

      try {
        const saved = await getOfflineSnapshot(activeUserId);
        if (saved) await setSnapshotAndUrls(saved, !navigator.onLine);
      } catch (snapshotError) {
        if (active) setError(snapshotError instanceof Error ? snapshotError.message : "Unable to read offline memories.");
      }

      if (navigator.onLine) await refreshOnline(activeUserId);
      else setIsOffline(true);
      if (active) setIsLoading(false);
    };

    const onOnline = () => {
      setIsOffline(false);
      if (activeUserId) void refreshOnline(activeUserId);
    };
    const onOffline = () => {
      setIsOffline(true);
      if (!activeUserId) return;
      void getOfflineSnapshot(activeUserId).then((saved) => {
        if (saved) return setSnapshotAndUrls(saved, true);
      }).catch((snapshotError) => {
        if (active) setError(formatMediaError(snapshotError));
      });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        void clearOfflineSnapshots().catch((snapshotError: unknown) => console.error("Unable to clear offline memories.", snapshotError));
        router.replace("/auth?next=/users/memories");
      }
    });
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    void load();

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [router, supabase]);

  const removeItem = async (item: OfflineMediaItem) => {
    if (!snapshot || isOffline) return;
    setDeletingId(item.id);
    setError(null);
    try {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([item.storage_path]);
      if (storageError) throw storageError;
      const { error: recordError } = await supabase.from("captured_media").delete().eq("id", item.id);
      if (recordError) throw recordError;
      const updatedSnapshot = { ...snapshot, items: snapshot.items.filter((savedItem) => savedItem.id !== item.id) };
      setSnapshot(updatedSnapshot);
      setMediaUrls((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== item.id)));
      setViewing(null);
      await removeOfflineMediaItem(snapshot.userId, item.storage_path).catch((cacheError: unknown) => {
        console.error("Unable to remove deleted media from the offline snapshot.", cacheError);
      });
      try {
        const { snapshot: nextSnapshot } = await syncOfflineMedia(supabase, snapshot.userId);
        setSnapshot(nextSnapshot);
        const nextUrls: Record<string, string> = {};
        for (const savedItem of nextSnapshot.items) {
          const { data } = await supabase.storage.from(BUCKET).createSignedUrl(savedItem.storage_path, 60 * 60);
          if (data) nextUrls[savedItem.id] = data.signedUrl;
        }
        setMediaUrls(nextUrls);
      } catch (syncError) {
        setError(syncError instanceof Error ? `Deleted online. Offline sync will retry later: ${syncError.message}` : "Deleted online. Offline sync will retry later.");
      }
    } catch (deleteError) {
      setError(formatMediaError(deleteError));
    } finally {
      setDeletingId(null);
    }
  };

  const items = snapshot ? sortItems(snapshot.items, sortBy) : [];
  const uncachedCount = items.filter((item) => !item.offlineBlob).length;

  return (
    <main className={`feature-page ${isNight ? "is-night" : ""}`}>
      <SiteNav variant="journal" />
      <div className="feature-page-shell">
        <header className="feature-page-heading">
          <Link href="/users/capture" className="feature-back"><ChevronLeft size={16} /> Back to capture</Link>
          <p className="workspace-eyebrow"><CalendarDays size={15} /> Your moments</p>
          <h1>Memory gallery</h1>
          <p>Your uploaded photos and videos, in the order they happened.</p>
        </header>

        <section className="memories-gallery" aria-live="polite">
          <div className={`memories-sync-status ${isOffline ? "is-offline" : ""}`}>
            {isOffline ? <CloudOff size={16} /> : <span className="memories-online-dot" />}
            <span>{isOffline ? "Offline snapshot" : isSyncing ? "Syncing latest memories" : "Online"}</span>
            {isSyncing ? <Loader2 className="memories-sync-spinner" size={15} /> : null}
            {snapshot ? <small>Last synced {new Date(snapshot.syncedAt).toLocaleString()}</small> : null}
          </div>

          {error ? <p className="capture-error" role="alert">{error}</p> : null}
          {uncachedCount > 0 ? <p className="memories-cache-note">{uncachedCount} {uncachedCount === 1 ? "item is" : "items are"} not stored for offline viewing because of the local storage limit or an unavailable file.</p> : null}

          {isLoading ? (
            <div className="memories-empty"><Loader2 className="memories-sync-spinner" size={22} /><span>Loading your memories…</span></div>
          ) : items.length === 0 ? (
            <div className="memories-empty">
              <CalendarDays size={25} />
              <h2>{isOffline ? "Nothing saved offline yet" : "Your gallery is ready"}</h2>
              <p>{isOffline ? "Open this gallery while online after uploading to save a snapshot on this device." : "Uploads you confirm will appear here and be saved for this account."}</p>
              <Link className="workspace-primary" href="/users/capture">Open capture <ArrowUpRight size={15} /></Link>
            </div>
          ) : (
            <>
              <div className="memories-gallery-heading">
                <div><span className="workspace-eyebrow">{sortLabels[sortBy]}</span><h2>{items.length} {items.length === 1 ? "memory" : "memories"}</h2></div>
                <div className="memories-gallery-controls">
                  <label className="memories-sort-control">
                    <span>Sort by</span>
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value as GallerySort)}>
                      {Object.entries(sortLabels).map(([value, label]) => <option key={value} value={value}>{label.replace(" · ", " — ")}</option>)}
                    </select>
                  </label>
                  <Link href="/users/capture" className="workspace-secondary">Add moments <ArrowUpRight size={15} /></Link>
                </div>
              </div>
              <div className="memories-gallery-grid">
                {items.map((item, index) => (
                  <motion.article key={item.id} className="memories-gallery-item" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }}>
                    <button type="button" className="memories-gallery-open" onClick={() => setViewing(item)} disabled={!mediaUrls[item.id]} aria-label={`Open ${item.file_name}`}>
                      {mediaUrls[item.id] ? item.media_kind === "photo" || isOffline || mediaUrls[item.id].startsWith("blob:") ? (
                        <Image src={mediaUrls[item.id]} width={960} height={720} unoptimized alt={item.file_name} />
                      ) : (
                        <video src={mediaUrls[item.id]} muted playsInline preload="metadata" />
                      ) : <span className="memories-media-missing">Preview unavailable</span>}
                      {item.media_kind === "video" ? <span className="memories-video-badge"><Video size={14} /> {isOffline ? "Preview" : "Video"}</span> : null}
                    </button>
                    <div className="memories-gallery-meta">
                      <div><strong title={item.file_name}>{item.file_name}</strong><span>{new Date(item.captured_at).toLocaleDateString()} · {(item.file_size / (1024 * 1024)).toFixed(1)} MB</span></div>
                      <button type="button" className="memories-delete" aria-label={`Delete ${item.file_name}`} title="Delete memory" disabled={isOffline || deletingId === item.id} onClick={() => void removeItem(item)}>
                        {deletingId === item.id ? <Loader2 size={15} className="memories-sync-spinner" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </motion.article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
      <SiteFooter homeHref="/users" />

      <AnimatePresence>
        {viewing ? (
          <motion.div className="capture-lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(event) => { if (event.target === event.currentTarget) setViewing(null); }}>
            <motion.div className="capture-lightbox-card" initial={{ opacity: 0, y: 22, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }}>
              <button type="button" className="journal-close" aria-label="Close" onClick={() => setViewing(null)}><X size={17} /></button>
              <div className="capture-lightbox-media">
                {viewing.media_kind === "photo" || isOffline || mediaUrls[viewing.id]?.startsWith("blob:")
                  ? mediaUrls[viewing.id] ? <Image src={mediaUrls[viewing.id]} width={1280} height={960} unoptimized alt={viewing.file_name} /> : null
                  : <video src={mediaUrls[viewing.id]} controls autoPlay playsInline />}
              </div>
              <div className="capture-lightbox-meta"><span className="workspace-eyebrow">{viewing.media_kind === "photo" ? "Photo" : isOffline || mediaUrls[viewing.id]?.startsWith("blob:") ? "Video preview" : "Video"}</span><h3>{viewing.file_name}</h3><p>{new Date(viewing.captured_at).toLocaleDateString()}</p></div>
              <div className="capture-lightbox-actions"><button type="button" className="danger" aria-label="Delete" data-tooltip="Delete" disabled={isOffline} onClick={() => void removeItem(viewing)}><Trash2 size={16} /></button></div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
