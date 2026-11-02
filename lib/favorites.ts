
"use client";

import { useMemo, useSyncExternalStore } from "react";

const PREFIX = "studiospace-favorites-";
const EVENT = "studiospace:favorites";

function storageKey(userId: string) {
  return `${PREFIX}${userId}`;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

function getSnapshot(userId?: string) {
  if (!userId || typeof window === "undefined") {
    return "[]";
  }

  try {
    return (
      window.localStorage.getItem(storageKey(userId)) ??
      "[]"
    );
  } catch {
    return "[]";
  }
}

function getServerSnapshot() {
  return "[]";
}

function parseFavorites(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) return [];

    return [
      ...new Set(
        parsed.filter(
          (item): item is string =>
            typeof item === "string"
        )
      ),
    ];
  } catch {
    return [];
  }
}

export function useFavorites(userId?: string) {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => getSnapshot(userId),
    getServerSnapshot
  );

  const favoriteIds = useMemo(
    () => parseFavorites(snapshot),
    [snapshot]
  );

  function save(ids: string[]) {
    if (!userId) return;

    try {
      window.localStorage.setItem(
        storageKey(userId),
        JSON.stringify([...new Set(ids)])
      );

      window.dispatchEvent(new Event(EVENT));
    } catch {
      throw new Error(
        "Browser storage is unavailable. Could not save favorites."
      );
    }
  }

  function toggle(studioId: string) {
    if (!userId) return;

    // Read the latest value to avoid using an outdated
    // snapshot after a separate component changes favorites.
    const current = parseFavorites(getSnapshot(userId));

    save(
      current.includes(studioId)
        ? current.filter((id) => id !== studioId)
        : [...current, studioId]
    );
  }

  function remove(studioId: string) {
    if (!userId) return;

    const current = parseFavorites(getSnapshot(userId));

    save(current.filter((id) => id !== studioId));
  }

  return {
    favoriteIds,
    isFavorite: (studioId: string) =>
      favoriteIds.includes(studioId),
    toggle,
    remove,
    count: favoriteIds.length,
  };
}
