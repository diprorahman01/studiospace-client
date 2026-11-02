
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ExternalLink,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { Studio } from "@/types/studio";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

type StudiosResponse = {
  success: boolean;
  message?: string;
  data?: Studio[];
};

function money(value: number) {
  return `$${Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

function isBookable(studio: Studio) {
  return (
    studio.isDemo !== true &&
    (studio.status == null ||
      studio.status === "active")
  );
}

export default function StudioLocationsPage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStudios() {
      try {
        const response = await fetch(
          `${API_URL}/api/studios`,
          {
            cache: "no-store",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          }
        );

        const result: StudiosResponse =
          await response.json();

        if (
          !response.ok ||
          !result.success ||
          !Array.isArray(result.data)
        ) {
          throw new Error(
            result.message || "Unable to load studios."
          );
        }

        if (!controller.signal.aborted) {
          setStudios(result.data);
          setError("");
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load studios."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadStudios();

    return () => controller.abort();
  }, [refreshKey]);

  const locations = useMemo(() => {
    const values = studios
      .map((studio) => studio.location?.trim())
      .filter((value): value is string => Boolean(value));

    return [...new Set(values)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [studios]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return studios.filter((studio) => {
      const matchesSearch =
        studio.title.toLowerCase().includes(term) ||
        studio.category.toLowerCase().includes(term) ||
        studio.location.toLowerCase().includes(term);

      const matchesLocation =
        location === "all" ||
        studio.location === location;

      const matchesAvailability =
        availability === "all" ||
        (availability === "bookable" &&
          isBookable(studio)) ||
        (availability === "unavailable" &&
          !isBookable(studio));

      return (
        matchesSearch &&
        matchesLocation &&
        matchesAvailability
      );
    });
  }, [studios, search, location, availability]);

  const selectedStudio =
    filtered.find((studio) => studio._id === selectedId) ??
    filtered[0] ??
    null;

  // A location string is an area/search query,
  // not an independently verified studio pin.
  const mapQuery = selectedStudio?.location?.trim() || "";

  const mapEmbedUrl = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        mapQuery
      )}&output=embed`
    : "";

  const mapSearchUrl = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        mapQuery
      )}`
    : "";

  function refresh() {
    setLoading(true);
    setRefreshKey((current) => current + 1);
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden bg-[#171024] px-5 py-16 text-center text-white sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.25),transparent_65%)]" />

        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-300/10 px-4 py-2 text-xs font-bold text-violet-200">
            <MapPin size={15} />
            Discover Studios by Location
          </span>

          <h1 className="mt-6 text-4xl font-extrabold sm:text-5xl">
            Studio Location Explorer
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-violet-100 sm:text-base">
            Browse creative studios by area, compare their
            locations, and explore the surrounding neighborhood
            before making a booking.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 md:py-14">
        {/* Filters */}
        <div
          className="mb-7 rounded-2xl border p-5"
          style={{
            background: "var(--ss-surface)",
            borderColor: "var(--ss-border)",
          }}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="location-search"
                className="mb-2 block text-sm font-semibold"
                style={{ color: "var(--ss-ink)" }}
              >
                Search Studios
              </label>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--ss-muted)" }}
                />

                <input
                  id="location-search"
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Studio, city or category..."
                  className="w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none focus:border-violet-500"
                  style={{
                    background: "var(--ss-surface-alt)",
                    borderColor: "var(--ss-border)",
                    color: "var(--ss-ink)",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="location-filter"
                className="mb-2 block text-sm font-semibold"
                style={{ color: "var(--ss-ink)" }}
              >
                Location
              </label>

              <select
                id="location-filter"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-violet-500"
                style={{
                  background: "var(--ss-surface-alt)",
                  borderColor: "var(--ss-border)",
                  color: "var(--ss-ink)",
                }}
              >
                <option value="all">All Locations</option>
                {locations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="availability-filter"
                className="mb-2 flex items-center gap-2 text-sm font-semibold"
                style={{ color: "var(--ss-ink)" }}
              >
                <SlidersHorizontal size={16} />
                Booking Status
              </label>

              <select
                id="availability-filter"
                value={availability}
                onChange={(event) =>
                  setAvailability(event.target.value)
                }
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-violet-500"
                style={{
                  background: "var(--ss-surface-alt)",
                  borderColor: "var(--ss-border)",
                  color: "var(--ss-ink)",
                }}
              >
                <option value="all">All Studios</option>
                <option value="bookable">Bookable Only</option>
                <option value="unavailable">
                  Unavailable Only
                </option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p
              className="text-xs"
              style={{ color: "var(--ss-muted)" }}
            >
              {filtered.length} matching studio
              {filtered.length === 1 ? "" : "s"}
            </p>

            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-500/10 disabled:opacity-50 dark:text-violet-300"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-3 text-violet-700 dark:text-violet-300">
            <LoaderCircle
              size={24}
              className="animate-spin"
            />
            Loading studio locations...
          </div>
        ) : error ? (
          <div className="ss-card p-10 text-center">
            <h2 className="text-lg font-bold text-red-600">
              Unable to load studios
            </h2>

            <p className="mt-3 text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={refresh}
              className="ss-cta-primary mt-5"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
            {/* Studio list */}
            <div
              className="overflow-hidden rounded-2xl border"
              style={{
                background: "var(--ss-surface)",
                borderColor: "var(--ss-border)",
              }}
            >
              <div
                className="border-b p-5"
                style={{ borderColor: "var(--ss-border)" }}
              >
                <h2
                  className="text-lg font-extrabold"
                  style={{ color: "var(--ss-ink)" }}
                >
                  Studio Listings
                </h2>

                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--ss-muted)" }}
                >
                  Select a studio to explore its area.
                </p>
              </div>

              <div className="max-h-[650px] space-y-2 overflow-y-auto p-3">
                {filtered.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <Building2
                      size={32}
                      className="mx-auto text-violet-500"
                    />

                    <p
                      className="mt-3 text-sm"
                      style={{ color: "var(--ss-muted)" }}
                    >
                      No studios match your filters.
                    </p>
                  </div>
                ) : (
                  filtered.map((studio) => {
                    const selected =
                      selectedStudio?._id === studio._id;

                    return (
                      <button
                        key={studio._id}
                        type="button"
                        onClick={() =>
                          setSelectedId(studio._id)
                        }
                        aria-pressed={selected}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                          selected
                            ? "border-violet-600 bg-violet-500/10"
                            : "border-transparent hover:border-violet-400/30 hover:bg-violet-500/5"
                        }`}
                      >
                        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-violet-100/10">
                          {studio.image ? (
                            <Image
                              src={studio.image}
                              alt=""
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Building2
                                size={25}
                                className="text-violet-500"
                              />
                            </div>
                          )}
                        </div>

                        <span className="min-w-0 flex-1">
                          <span
                            className="block truncate text-sm font-bold"
                            style={{ color: "var(--ss-ink)" }}
                          >
                            {studio.title}
                          </span>

                          <span
                            className="mt-1 flex items-start gap-1.5 text-xs"
                            style={{ color: "var(--ss-muted)" }}
                          >
                            <MapPin
                              size={13}
                              className="shrink-0"
                            />
                            {studio.location}
                          </span>

                          <span className="mt-2 block text-xs font-bold text-violet-700 dark:text-violet-300">
                            {money(studio.hourlyRate)} / hour
                          </span>

                          <span
                            className={`mt-1 block text-[11px] font-semibold ${
                              isBookable(studio)
                                ? "text-green-600 dark:text-green-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {isBookable(studio)
                              ? "Accepting bookings"
                              : "Currently unavailable"}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Map panel */}
            <div
              className="overflow-hidden rounded-2xl border"
              style={{
                background: "var(--ss-surface)",
                borderColor: "var(--ss-border)",
              }}
            >
              {selectedStudio && mapQuery ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div>
                      <h2
                        className="text-lg font-extrabold"
                        style={{ color: "var(--ss-ink)" }}
                      >
                        {selectedStudio.title}
                      </h2>

                      <p
                        className="mt-1 flex items-center gap-2 text-sm"
                        style={{ color: "var(--ss-muted)" }}
                      >
                        <MapPin size={16} />
                        {selectedStudio.location}
                      </p>
                    </div>

                    <Link
                      href={`/studios/${selectedStudio._id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-800"
                    >
                      View Studio
                      <ArrowRight size={15} />
                    </Link>
                  </div>

                  <iframe
                    key={mapQuery}
                    title={`Map search for ${selectedStudio.location}`}
                    src={mapEmbedUrl}
                    className="h-[380px] w-full border-0 sm:h-[470px] lg:h-[550px]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />

                  <div
                    className="border-t px-5 py-4"
                    style={{
                      borderColor: "var(--ss-border)",
                    }}
                  >
                    <a
                      href={mapSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:underline dark:text-violet-300"
                    >
                      Open Area in Google Maps
                      <ExternalLink size={16} />
                    </a>

                    <p
                      className="mt-3 text-xs leading-6"
                      style={{ color: "var(--ss-muted)" }}
                    >
                      This map searches the listed area,
                      not a verified studio entrance or
                      exact property location. Confirm the
                      address with the host before travelling.
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[500px] flex-col items-center justify-center gap-3 p-8 text-center">
                  <MapPin
                    size={42}
                    className="text-violet-500"
                  />
                  <h2
                    className="text-lg font-bold"
                    style={{ color: "var(--ss-ink)" }}
                  >
                    Select a Studio
                  </h2>
                  <p
                    className="text-sm"
                    style={{ color: "var(--ss-muted)" }}
                  >
                    Choose a studio from the list to
                    view its location.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
