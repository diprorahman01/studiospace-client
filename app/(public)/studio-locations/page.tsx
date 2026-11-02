
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Navigation,
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

type Coordinates = {
  latitude: number;
  longitude: number;
};

function money(value: number) {
  return `$${Number(value || 0).toLocaleString(
    "en-US",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}

function isBookable(studio: Studio) {
  return (
    studio.isDemo !== true &&
    (studio.status == null ||
      studio.status === "active")
  );
}

function getCoordinates(
  studio: Studio
): Coordinates | null {
  const latitude = studio.coordinates?.latitude;
  const longitude = studio.coordinates?.longitude;

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

function buildMapLinks(studio: Studio) {
  const coordinates = getCoordinates(studio);

  if (coordinates) {
    const point =
      `${coordinates.latitude},${coordinates.longitude}`;

    return {
      exact: true,
      embed:
        `https://maps.google.com/maps?q=${encodeURIComponent(
          point
        )}&z=16&output=embed`,
      open:
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          point
        )}`,
      directions:
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          point
        )}`,
    };
  }

  const area = studio.location?.trim() || "";

  return {
    exact: false,
    embed: area
      ? `https://maps.google.com/maps?q=${encodeURIComponent(
          area
        )}&output=embed`
      : "",
    open: area
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          area
        )}`
      : "",
    directions: "",
  };
}

export default function StudioLocationsPage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");
  const [availability, setAvailability] =
    useState("all");

  const [exactOnly, setExactOnly] = useState(false);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  // ==========================================
  // FETCH STUDIO DATA
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    const request = fetch(`${API_URL}/api/studios`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    request
      .then(async (response) => {
        const result: StudiosResponse =
          await response.json();

        if (
          !response.ok ||
          !result.success ||
          !Array.isArray(result.data)
        ) {
          throw new Error(
            result.message ||
              "Unable to load studios."
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

  // ==========================================
  // FILTER OPTIONS
  // ==========================================

  const locations = useMemo(() => {
    const values = studios
      .map((studio) => studio.location?.trim())
      .filter(
        (value): value is string => Boolean(value)
      );

    return [...new Set(values)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [studios]);

  const exactLocationCount = useMemo(
    () =>
      studios.filter(
        (studio) => getCoordinates(studio) !== null
      ).length,
    [studios]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return studios.filter((studio) => {
      const matchesSearch =
        studio.title.toLowerCase().includes(term) ||
        studio.category.toLowerCase().includes(term) ||
        studio.location.toLowerCase().includes(term) ||
        (studio.fullAddress || "")
          .toLowerCase()
          .includes(term);

      const matchesLocation =
        location === "all" ||
        studio.location === location;

      const matchesAvailability =
        availability === "all" ||
        (availability === "bookable" &&
          isBookable(studio)) ||
        (availability === "unavailable" &&
          !isBookable(studio));

      const matchesCoordinates =
        !exactOnly || getCoordinates(studio) !== null;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesAvailability &&
        matchesCoordinates
      );
    });
  }, [
    studios,
    search,
    location,
    availability,
    exactOnly,
  ]);

  // ==========================================
  // SELECTED STUDIO
  // ==========================================

  const selectedStudio =
    filtered.find(
      (studio) => studio._id === selectedId
    ) ??
    filtered[0] ??
    null;

  const mapLinks = selectedStudio
    ? buildMapLinks(selectedStudio)
    : null;

  const coordinates = selectedStudio
    ? getCoordinates(selectedStudio)
    : null;

  function refresh() {
    setLoading(true);
    setRefreshKey((value) => value + 1);
  }

  function clearFilters() {
    setSearch("");
    setLocation("all");
    setAvailability("all");
    setExactOnly(false);
    setSelectedId(null);
  }

  // ==========================================
  // PAGE
  // ==========================================

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
            Browse creative studios by location, explore
            their surroundings, and find directions to
            studios with published map coordinates.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 md:py-14">
        {/* Filter panel */}
        <div
          className="mb-7 rounded-2xl border p-5"
          style={{
            background: "var(--ss-surface)",
            borderColor: "var(--ss-border)",
          }}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
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
                  style={{
                    color: "var(--ss-muted)",
                  }}
                />

                <input
                  id="location-search"
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Studio, address, city..."
                  className="w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none focus:border-violet-500"
                  style={{
                    background: "var(--ss-surface-alt)",
                    borderColor: "var(--ss-border)",
                    color: "var(--ss-ink)",
                  }}
                />
              </div>
            </div>

            {/* Area */}
            <div>
              <label
                htmlFor="location-filter"
                className="mb-2 block text-sm font-semibold"
                style={{
                  color: "var(--ss-ink)",
                }}
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
                <option value="all">
                  All Locations
                </option>

                {locations.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability */}
            <div>
              <label
                htmlFor="availability-filter"
                className="mb-2 flex items-center gap-2 text-sm font-semibold"
                style={{
                  color: "var(--ss-ink)",
                }}
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
                <option value="all">
                  All Studios
                </option>

                <option value="bookable">
                  Bookable Only
                </option>

                <option value="unavailable">
                  Unavailable Only
                </option>
              </select>
            </div>
          </div>

          {/* Additional filters */}
          <div
            className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
            style={{
              borderColor: "var(--ss-border)",
            }}
          >
            <label
              className="inline-flex cursor-pointer items-center gap-3 text-sm font-semibold"
              style={{ color: "var(--ss-ink)" }}
            >
              <input
                type="checkbox"
                checked={exactOnly}
                onChange={(event) =>
                  setExactOnly(event.target.checked)
                }
                className="h-4 w-4 accent-violet-700"
              />

              <MapPin
                size={17}
                className="text-violet-600 dark:text-violet-300"
              />

              Exact Locations Only
            </label>

            <div className="flex flex-wrap items-center gap-4">
              <span
                className="text-xs"
                style={{ color: "var(--ss-muted)" }}
              >
                {exactLocationCount} studio
                {exactLocationCount === 1 ? "" : "s"}{" "}
                with coordinates
              </span>

              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300"
              >
                Clear Filters
              </button>

              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-500/10 disabled:opacity-50 dark:text-violet-300"
              >
                <RefreshCw
                  size={15}
                  className={
                    loading ? "animate-spin" : ""
                  }
                />
                Refresh
              </button>
            </div>
          </div>

          <p
            className="mt-4 text-xs"
            style={{ color: "var(--ss-muted)" }}
          >
            Showing {filtered.length} matching{" "}
            {filtered.length === 1
              ? "studio"
              : "studios"}
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-3 text-violet-700 dark:text-violet-300">
            <LoaderCircle
              size={24}
              className="animate-spin"
            />
            Loading studio locations...
          </div>
        ) : error ? (
          /* Error */
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
          /* Explorer layout */
          <div className="grid items-start gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
            {/* Studio listings */}
            <div
              className="overflow-hidden rounded-2xl border"
              style={{
                background: "var(--ss-surface)",
                borderColor: "var(--ss-border)",
              }}
            >
              <div
                className="border-b p-5"
                style={{
                  borderColor: "var(--ss-border)",
                }}
              >
                <h2
                  className="text-lg font-extrabold"
                  style={{ color: "var(--ss-ink)" }}
                >
                  Studio Listings
                </h2>

                <p
                  className="mt-1 text-xs"
                  style={{
                    color: "var(--ss-muted)",
                  }}
                >
                  Select a studio to view its map.
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
                      style={{
                        color: "var(--ss-muted)",
                      }}
                    >
                      No studios match your filters.
                    </p>
                  </div>
                ) : (
                  filtered.map((studio) => {
                    const selected =
                      selectedStudio?._id === studio._id;

                    const exact =
                      getCoordinates(studio) !== null;

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
                            style={{
                              color: "var(--ss-ink)",
                            }}
                          >
                            {studio.title}
                          </span>

                          <span
                            className="mt-1 flex items-start gap-1.5 text-xs"
                            style={{
                              color: "var(--ss-muted)",
                            }}
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

                          <span
                            className={`mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                              exact
                                ? "text-violet-700 dark:text-violet-300"
                                : "text-slate-500 dark:text-violet-200"
                            }`}
                          >
                            {exact ? (
                              <>
                                <CheckCircle2 size={13} />
                                Coordinates provided
                              </>
                            ) : (
                              <>
                                <MapPin size={13} />
                                Area map only
                              </>
                            )}
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
              {selectedStudio && mapLinks?.embed ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <h2
                        className="text-lg font-extrabold"
                        style={{
                          color: "var(--ss-ink)",
                        }}
                      >
                        {selectedStudio.title}
                      </h2>

                      <p
                        className="mt-2 flex items-start gap-2 text-sm"
                        style={{
                          color: "var(--ss-muted)",
                        }}
                      >
                        <MapPin
                          size={16}
                          className="mt-0.5 shrink-0"
                        />
                        {selectedStudio.location}
                      </p>

                      {selectedStudio.fullAddress && (
                        <p
                          className="mt-2 text-sm leading-6"
                          style={{
                            color: "var(--ss-ink)",
                          }}
                        >
                          <strong>Address:</strong>{" "}
                          {selectedStudio.fullAddress}
                        </p>
                      )}

                      {coordinates && (
                        <p
                          className="mt-2 text-xs"
                          style={{
                            color: "var(--ss-muted)",
                          }}
                        >
                          Coordinates:{" "}
                          {coordinates.latitude.toFixed(6)},{" "}
                          {coordinates.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/studios/${selectedStudio._id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-800"
                    >
                      View Studio
                      <ArrowRight size={15} />
                    </Link>
                  </div>

                  {/* Coordinates take priority over area */}
                  <iframe
                    key={`${selectedStudio._id}-${mapLinks.embed}`}
                    title={
                      mapLinks.exact
                        ? `Map for ${selectedStudio.title}`
                        : `Area map for ${selectedStudio.location}`
                    }
                    src={mapLinks.embed}
                    className="h-[380px] w-full border-0 sm:h-[470px] lg:h-[550px]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />

                  {/* Map actions */}
                  <div
                    className="border-t px-5 py-4"
                    style={{
                      borderColor: "var(--ss-border)",
                    }}
                  >
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={mapLinks.open}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-violet-300/40 px-4 py-2.5 text-xs font-semibold text-violet-700 hover:bg-violet-500/10 dark:text-violet-300"
                      >
                        Open in Google Maps
                        <ExternalLink size={15} />
                      </a>

                      {mapLinks.exact &&
                        mapLinks.directions && (
                          <a
                            href={mapLinks.directions}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-800"
                          >
                            <Navigation size={15} />
                            Get Directions
                          </a>
                        )}
                    </div>

                    <p
                      className="mt-4 text-xs leading-6"
                      style={{
                        color: "var(--ss-muted)",
                      }}
                    >
                      {mapLinks.exact
                        ? "This map uses coordinates submitted by the studio host. They have not been independently verified. Confirm the entrance and directions before travelling."
                        : "This map searches the general listed area because the host has not provided exact coordinates. It does not show a verified studio location."}
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
                    style={{
                      color: "var(--ss-ink)",
                    }}
                  >
                    Select a Studio
                  </h2>

                  <p
                    className="text-sm"
                    style={{
                      color: "var(--ss-muted)",
                    }}
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
