"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { toast } from "sonner";

const PREFIX = "studiospace-favorites-";
const EVENT = "studiospace:favorites";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const initialized = new Set<string>();
const requests = new Map<string, Promise<void>>();
const pendingSave = new Map<string, Promise<void>>();

function storageKey(userId: string) { return `${PREFIX}${userId}`; }
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(EVENT, callback); };
}
function getSnapshot(userId?: string) {
  if (!userId || typeof window === "undefined") return "[]";
  try { return localStorage.getItem(storageKey(userId)) ?? "[]"; } catch { return "[]"; }
}
function parseIds(text: string): string[] {
  try {
    const parsed: unknown = JSON.parse(text);
    return Array.isArray(parsed) ? [...new Set(parsed.filter((item): item is string => typeof item === "string" && /^[a-f0-9]{24}$/i.test(item)))] : [];
  } catch { return []; }
}
function publish(userId: string, ids: string[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(ids));
  window.dispatchEvent(new Event(EVENT));
}
function loadFromMongo(userId: string) {
  if (requests.has(userId)) return requests.get(userId)!;
  const request = fetch("/api/favorites", { credentials: "include", cache: "no-store" })
    .then(async (response) => {
      const body = await response.json();
      if (!response.ok || !body.success || !Array.isArray(body.data)) throw new Error(body.message || "Unable to load favorites.");
      // Never overwrite optimistic edits while a save is still in flight.
      if (pendingSave.has(userId)) await pendingSave.get(userId)?.catch(() => undefined);
      publish(userId, body.data);
      initialized.add(userId);
    })
    .catch((error: unknown) => {
      // Keep browser cache for offline/error state; do not claim MongoDB sync succeeded.
      console.error("StudioSpace favorites sync:", error);
    })
    .finally(() => requests.delete(userId));
  requests.set(userId, request);
  return request;
}
export function useFavorites(userId?: string) {
  const snapshot = useSyncExternalStore(subscribe, () => getSnapshot(userId), () => "[]");
  const favoriteIds = useMemo(() => parseIds(snapshot), [snapshot]);
  useEffect(() => { if (userId && !initialized.has(userId)) void loadFromMongo(userId); }, [userId]);

  function save(ids: string[]) {
    if (!userId) return;
    const previous = parseIds(getSnapshot(userId));
    const updated = [...new Set(ids)];
    try { publish(userId, updated); } catch { throw new Error("Browser storage is unavailable."); }
    // Serialize writes to avoid out-of-order responses overwriting newer choices.
    const prior = pendingSave.get(userId) ?? Promise.resolve();
    const next = prior.catch(() => undefined).then(async () => {
      const response = await fetch(`${API_URL}/api/favorites`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioIds: updated }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || "Could not save favorites to MongoDB.");
      initialized.add(userId);
    }).catch((error: unknown) => {
      // Only revert if no later UI operation has replaced the optimistic value.
      if (getSnapshot(userId) === JSON.stringify(updated)) publish(userId, previous);
      toast.error(error instanceof Error ? error.message : "Favorites sync failed.");
    });
    pendingSave.set(userId, next);
    void next.finally(() => { if (pendingSave.get(userId) === next) pendingSave.delete(userId); });
  }
  function toggle(studioId: string) {
    if (!userId) return;
    const current = parseIds(getSnapshot(userId));
    save(current.includes(studioId) ? current.filter((id) => id !== studioId) : [...current, studioId]);
  }
  function remove(studioId: string) {
    if (!userId) return;
    save(parseIds(getSnapshot(userId)).filter((id) => id !== studioId));
  }
  return { favoriteIds, isFavorite: (id: string) => favoriteIds.includes(id), toggle, remove, count: favoriteIds.length };
}
