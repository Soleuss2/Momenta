"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, CloudOff, Image as ImageIcon, Loader2, Trash2, Video, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteFooter } from "../../../components/site-footer";
import { SiteNav } from "../../../components/site-nav";
import { AmbientBackground } from "../../../components/ambient-background";
import { ConfirmationModal } from "../../../components/confirmation-modal";
import { createClient } from "../../../lib/supabase/client";
import { formatMediaError, syncOfflineMedia } from "../../../lib/captured-media";
import { clearOfflineSnapshots, getOfflineSnapshot, removeOfflineMediaItem, type OfflineSnapshot, type OfflineMediaItem } from "../../../lib/offline-media";
import { useTheme } from "../../theme-provider";

const BUCKET = "memories";

type GallerySort = "capture-newest" | "capture-oldest" | "upload-newest" | "name-asc";
type GalleryFilter = "all" | "week" | "month";

const sortLabels: Record<GallerySort, string> = {
  "capture-newest": "Capture date · newest first",
  "capture-oldest": "Capture date · oldest first",
  "upload-newest": "Upload date · newest first",
  "name-asc": "File name · A to Z",
};

const filterLabels: Record<GalleryFilter, string> = {
  all: "All uploads",
  week: "This week",
  month: "This month",
};

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfWeek(date: Date) {
  const result = startOfDay(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
}

function matchesFilter(item: OfflineMediaItem, filter: GalleryFilter) {
  if (filter === "all") return true;
  const uploadedAt = new Date(item.uploaded_at);
  const now = new Date();
  return filter === "week" ? uploadedAt >= startOfWeek(now) : uploadedAt.getFullYear() === now.getFullYear() && uploadedAt.getMonth() === now.getMonth();
}

function uploadDateLabel(timestamp: string) {
  const uploadedAt = new Date(timestamp);
  const today = startOfDay(new Date());
  const uploadDay = startOfDay(uploadedAt);
  const dayDifference = Math.round((today.getTime() - uploadDay.getTime()) / 86400000);
  if (dayDifference === 0) return "Uploaded today";
  if (dayDifference === 1) return "Uploaded yesterday";
  return `Uploaded ${uploadedAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: uploadedAt.getFullYear() === today.getFullYear() ? undefined : "numeric" })}`;
}

function groupDateLabel(timestamp: string) {
  const uploadedAt = new Date(timestamp);
  const today = startOfDay(new Date());
  const dayDifference = Math.round((today.getTime() - startOfDay(uploadedAt).getTime()) / 86400000);
  if (dayDifference === 0) return "Today";
  if (dayDifference === 1) return "Yesterday";
  return uploadedAt.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: uploadedAt.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

function groupByUploadDay(items: OfflineMediaItem[]) {
  const groups = new Map<string, OfflineMediaItem[]>();
  for (const item of items) {
    const uploadedAt = new Date(item.uploaded_at);
    const key = `${uploadedAt.getFullYear()}-${uploadedAt.getMonth()}-${uploadedAt.getDate()}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()].map(([key, groupItems]) => ({ key, label: groupDateLabel(groupItems[0].uploaded_at), items: groupItems }));
}

function sortItems(items: OfflineMediaItem[], sortBy: GallerySort) {
  return [...items].sort((left, right) => {
    const today = startOfDay(new Date()).getTime();
    const leftIsToday = startOfDay(new Date(left.uploaded_at)).getTime() === today;
    const rightIsToday = startOfDay(new Date(right.uploaded_at)).getTime() === today;
    if (leftIsToday !== rightIsToday) return leftIsToday ? -1 : 1;
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
  const [filterBy, setFilterBy] = useState<GalleryFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<OfflineMediaItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<OfflineMediaItem | null>(null);

  useEffect(() => () => Object.values(mediaUrls).forEach((url) => {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  }), [mediaUrls]);

  useEffect(() => {
    let active = true;
    let activeUserId: string | null = null;
    let syncInFlight = false;
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

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
      realtimeChannel = supabase
        .channel(`captured-media:${activeUserId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "captured_media", filter: `user_id=eq.${activeUserId}` }, () => {
          if (activeUserId) void refreshOnline(activeUserId);
        })
        .subscribe();

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
      if (realtimeChannel) void supabase.removeChannel(realtimeChannel);
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
  const filteredItems = items.filter((item) => matchesFilter(item, filterBy));
  const groupedItems = groupByUploadDay(filteredItems);
  const uncachedCount = filteredItems.filter((item) => !item.offlineBlob).length;
  const previewIndex = viewing ? filteredItems.findIndex((item) => item.id === viewing.id) : -1;
  const showAdjacentPreview = (direction: -1 | 1) => {
    if (filteredItems.length < 2 || previewIndex < 0) return;
    const nextIndex = (previewIndex + direction + filteredItems.length) % filteredItems.length;
    setViewing(filteredItems[nextIndex]);
  };

  useEffect(() => {
    if (!viewing) return;
    const handlePreviewKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const direction = event.key === "ArrowLeft" ? -1 : 1;
        const nextIndex = (previewIndex + direction + filteredItems.length) % filteredItems.length;
        if (previewIndex >= 0 && filteredItems.length > 1) setViewing(filteredItems[nextIndex]);
      }
      if (event.key === "Escape") setViewing(null);
    };
    window.addEventListener("keydown", handlePreviewKey);
    return () => window.removeEventListener("keydown", handlePreviewKey);
  }, [previewIndex, viewing, filteredItems]);

  return (
    <main className={`feature-page ${isNight ? "is-night" : ""}`}>
      <AmbientBackground />
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
                <div><span className="workspace-eyebrow">{filterLabels[filterBy]} · {sortLabels[sortBy]}</span><h2>{filteredItems.length} {filteredItems.length === 1 ? "memory" : "memories"}</h2></div>
                <div className="memories-gallery-controls">
                  <div className="memories-filter-tabs" aria-label="Filter uploads">
                    {(Object.entries(filterLabels) as [GalleryFilter, string][]).map(([value, label]) => <button type="button" key={value} className={filterBy === value ? "active" : ""} onClick={() => setFilterBy(value)}>{label}</button>)}
                  </div>
                  <label className="memories-sort-control">
                    <span>Sort by</span>
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value as GallerySort)}>
                      {Object.entries(sortLabels).map(([value, label]) => <option key={value} value={value}>{label.replace(" · ", " — ")}</option>)}
                    </select>
                  </label>
                  <Link href="/users/capture" className="workspace-secondary">Add moments <ArrowUpRight size={15} /></Link>
                </div>
              </div>
              {filteredItems.length === 0 ? <div className="memories-filter-empty"><CalendarDays size={22} /><strong>No uploads in {filterLabels[filterBy].toLowerCase()}</strong><button type="button" onClick={() => setFilterBy("all")}>Show all uploads</button></div> : groupedItems.map((group) => <section className="memories-day-group" key={group.key}>
                <div className="memories-day-heading"><div><span className="workspace-eyebrow">{group.label}</span><h3>{group.items.length} {group.items.length === 1 ? "upload" : "uploads"}</h3></div><span className="memories-day-rule" /></div>
                <div className="memories-gallery-grid">
                {group.items.map((item, index) => (
                  <motion.article key={item.id} className="memories-gallery-item" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }}>
                    <button type="button" className="memories-gallery-open" onClick={() => setViewing(item)} disabled={!mediaUrls[item.id]} aria-label={`Preview ${item.media_kind === "photo" ? "photo" : "video"} memory`}>
                      {mediaUrls[item.id] ? item.media_kind === "photo" || isOffline || mediaUrls[item.id].startsWith("blob:") ? (
                        <Image src={mediaUrls[item.id]} width={960} height={720} unoptimized alt={item.file_name} />
                      ) : (
                        <video src={mediaUrls[item.id]} muted playsInline preload="metadata" />
                      ) : <span className="memories-media-missing">Preview unavailable</span>}
                      <span className="memories-media-type-badge">{item.media_kind === "video" ? <Video size={14} /> : <ImageIcon size={14} />} {item.media_kind === "video" ? "Video" : "Photo"}</span>
                      <span className="memories-preview-hint">Open preview</span>
                    </button>
                    <div className="memories-gallery-meta">
                      <div><strong>{item.caption || (item.media_kind === "photo" ? "Photo memory" : "Video memory")}</strong><span className="memories-upload-date">{uploadDateLabel(item.uploaded_at)}</span><span>Captured {new Date(item.captured_at).toLocaleDateString()} · {(item.file_size / (1024 * 1024)).toFixed(1)} MB</span></div>
                      <button type="button" className="memories-delete" aria-label="Delete memory" title="Delete memory" disabled={isOffline || deletingId === item.id} onClick={() => setDeleteConfirm(item)}>
                        {deletingId === item.id ? <Loader2 size={15} className="memories-sync-spinner" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </motion.article>
                ))}
                </div>
              </section>)}
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
              <button type="button" className="capture-lightbox-nav capture-lightbox-nav-prev" aria-label="Previous upload" onClick={() => showAdjacentPreview(-1)} disabled={filteredItems.length < 2}><ChevronLeft size={19} /></button>
              <button type="button" className="capture-lightbox-nav capture-lightbox-nav-next" aria-label="Next upload" onClick={() => showAdjacentPreview(1)} disabled={filteredItems.length < 2}><ChevronRight size={19} /></button>
              <div className="capture-lightbox-media">
                {viewing.media_kind === "photo" || isOffline || mediaUrls[viewing.id]?.startsWith("blob:")
                  ? mediaUrls[viewing.id] ? <Image src={mediaUrls[viewing.id]} width={1280} height={960} unoptimized alt={viewing.file_name} /> : null
                  : <video src={mediaUrls[viewing.id]} controls autoPlay playsInline />}
              </div>
              <div className="capture-lightbox-meta"><span className="workspace-eyebrow">{viewing.media_kind === "photo" ? "Photo" : isOffline || mediaUrls[viewing.id]?.startsWith("blob:") ? "Video preview" : "Video"}</span><h3>{viewing.caption || (viewing.media_kind === "photo" ? "Photo memory" : "Video memory")}</h3><p>{uploadDateLabel(viewing.uploaded_at)} · Captured {new Date(viewing.captured_at).toLocaleDateString()}</p></div>
              <div className="capture-lightbox-actions"><button type="button" className="danger" aria-label="Delete memory" data-tooltip="Delete memory" disabled={isOffline} onClick={() => setDeleteConfirm(viewing)}><Trash2 size={16} /></button></div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <ConfirmationModal
        open={deleteConfirm !== null}
        title="Remove this memory?"
        description="This memory will be removed from your private gallery and cannot be restored from Momenta."
        confirmLabel="Remove memory"
        cancelLabel="Keep memory"
        isPending={deletingId !== null}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => { if (!deleteConfirm) return; const item = deleteConfirm; setDeleteConfirm(null); void removeItem(item); }}
      />
    </main>
  );
}
