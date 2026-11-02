
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Heart,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useFavorites } from "@/lib/favorites";
import type { Studio } from "@/types/studio";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: Studio[];
};

function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

function FavoritesContent({
  userId,
}: {
  userId: string;
}) {
  const { favoriteIds, remove } = useFavorites(userId);

  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/api/studios`, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        const result: ApiResponse = await response.json();

        if (
          !response.ok ||
          !result.success ||
          !Array.isArray(result.data)
        ) {
          throw new Error(
            result.message || "Unable to load studios."
          );
        }

        return result.data;
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setStudios(data);
        setError("");
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load studios."
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [refreshKey]);

  const favorites = useMemo(() => {
    const studioMap = new Map(
      studios.map((studio) => [studio._id, studio])
    );

    const term = search.trim().toLowerCase();

    return favoriteIds
      .map((id) => studioMap.get(id))
      .filter((studio): studio is Studio => Boolean(studio))
      .filter(
        (studio) =>
          studio.title.toLowerCase().includes(term) ||
          studio.category.toLowerCase().includes(term) ||
          studio.location.toLowerCase().includes(term)
      );
  }, [favoriteIds, studios, search]);

  function removeFavorite(studio: Studio) {
    try {
      remove(studio._id);
      toast.success(`${studio.title} removed from favorites.`);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not remove favorite."
      );
    }
  }

  return (
    <main className="min-h-[75vh] px-5 py-12 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="ss-kicker">
              <Heart size={15} />
              Your Saved Spaces
            </span>

            <h1
              className="mt-5 text-3xl font-extrabold sm:text-4xl"
              style={{ color: "var(--ss-ink)" }}
            >
              My Favorites
            </h1>

            <p
              className="mt-3 text-sm leading-7"
              style={{ color: "var(--ss-muted)" }}
            >
              Keep your favorite creative studios in one
              place and return to them whenever you like.
            </p>
          </div>

          <Link
            href="/studios"
            className="ss-cta-primary inline-flex items-center gap-2 px-5 py-3"
          >
            Explore Studios
            <ArrowRight size={17} />
          </Link>
        </div>

        <div
          className="mt-9 rounded-2xl border p-5"
          style={{
            background: "var(--ss-surface)",
            borderColor: "var(--ss-border)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--ss-ink)" }}
            >
              {favoriteIds.length} saved{" "}
              {favoriteIds.length === 1
                ? "studio"
                : "studios"}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--ss-muted)" }}
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search favorites..."
                  aria-label="Search favorites"
                  className="rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none focus:border-violet-500"
                  style={{
                    background: "var(--ss-surface-alt)",
                    borderColor: "var(--ss-border)",
                    color: "var(--ss-ink)",
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setRefreshKey((value) => value + 1);
                }}
                disabled={loading}
                aria-label="Refresh saved studios"
                className="rounded-xl border p-2.5 disabled:opacity-40"
                style={{
                  borderColor: "var(--ss-border)",
                  color: "var(--ss-accent)",
                }}
              >
                <RefreshCw
                  size={18}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-3">
            <LoaderCircle
              size={24}
              className="animate-spin text-violet-600"
            />
            <span style={{ color: "var(--ss-muted)" }}>
              Loading your saved studios...
            </span>
          </div>
        ) : error ? (
          <div className="ss-card mt-6 p-8 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setRefreshKey((value) => value + 1);
              }}
              className="ss-cta-primary mt-5"
            >
              Try Again
            </button>
          </div>
        ) : favorites.length === 0 ? (
          <div className="ss-card mt-6 px-6 py-16 text-center">
            <Heart
              size={43}
              className="mx-auto text-violet-500"
            />
            <h2
              className="mt-5 text-xl font-bold"
              style={{ color: "var(--ss-ink)" }}
            >
              {favoriteIds.length === 0
                ? "No favorite studios yet"
                : "No matching saved studios found"}
            </h2>
            <p
              className="mt-3 text-sm"
              style={{ color: "var(--ss-muted)" }}
            >
              Save studios using the heart icon on Explore
              Studios.
            </p>
            <Link
              href="/studios"
              className="ss-cta-primary mt-6 inline-flex items-center gap-2"
            >
              Browse Studios
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((studio) => (
              <article
                key={studio._id}
                className="ss-card group overflow-hidden"
              >
                <div className="relative h-56 bg-violet-100/10">
                  <Link
                    href={`/studios/${studio._id}`}
                    className="block h-full"
                    aria-label={`View ${studio.title}`}
                  >
                    {studio.image ? (
                      <Image
                        src={studio.image}
                        alt={studio.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Building2
                          size={40}
                          className="text-violet-500"
                        />
                      </div>
                    )}
                  </Link>

                  <button
                    type="button"
                    onClick={() => removeFavorite(studio)}
                    aria-label={`Remove ${studio.title} from favorites`}
                    className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-rose-600 shadow-md transition hover:scale-110"
                  >
                    <Heart
                      size={19}
                      fill="currentColor"
                    />
                  </button>
                </div>

                <div className="p-6">
                  <span
                    className="text-xs font-bold text-violet-600 dark:text-violet-300"
                  >
                    {studio.category}
                  </span>

                  <Link href={`/studios/${studio._id}`}>
                    <h2
                      className="mt-2 line-clamp-2 text-lg font-extrabold"
                      style={{ color: "var(--ss-ink)" }}
                    >
                      {studio.title}
                    </h2>
                  </Link>

                  <p
                    className="mt-3 flex items-start gap-2 text-sm"
                    style={{ color: "var(--ss-muted)" }}
                  >
                    <MapPin
                      size={16}
                      className="mt-0.5 shrink-0"
                    />
                    {studio.location}
                  </p>

                  <div
                    className="mt-5 flex items-center justify-between gap-3 border-t pt-5"
                    style={{ borderColor: "var(--ss-border)" }}
                  >
                    <div>
                      <strong
                        className="text-xl"
                        style={{ color: "var(--ss-accent)" }}
                      >
                        {formatMoney(studio.hourlyRate)}
                      </strong>
                      <span
                        className="ml-1 text-xs"
                        style={{ color: "var(--ss-muted)" }}
                      >
                        / hour
                      </span>
                    </div>

                    <Link
                      href={`/studios/${studio._id}`}
                      className="ss-cta-primary px-4 py-2.5 text-xs"
                    >
                      View Details
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFavorite(studio)}
                    className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-rose-500 hover:underline"
                  >
                    <Trash2 size={14} />
                    Remove Favorite
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function FavoritesPage() {
  const router = useRouter();

  const { data: session, isPending } =
    authClient.useSession();

  if (isPending) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle
          className="animate-spin text-violet-600"
          size={32}
        />
      </main>
    );
  }

  if (!session?.user?.id) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-5 text-center">
        <Heart size={42} className="text-violet-500" />
        <h1 className="text-2xl font-bold">
          Log in to view your favorites
        </h1>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="ss-cta-primary"
        >
          Go to Login
        </button>
      </main>
    );
  }

  return <FavoritesContent userId={session.user.id} />;
}
