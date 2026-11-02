
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ExternalLink,
  Layers,
  LoaderCircle,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { Studio } from "@/types/studio";

const MultiStudioMap = dynamic(
  () => import("@/components/studios/MultiStudioMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[450px] items-center justify-center gap-3 text-violet-700">
        <LoaderCircle
          size={22}
          className="animate-spin"
        />
        Loading interactive map...
      </div>
    ),
  }
);

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

type StudiosResponse = {
  success: boolean;
  message?: string;
  data?: Studio[];
};

type MapMode = "all" | "selected";

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

function getCoordinates(studio: Studio) {
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

  return { latitude, longitude };
}

function getMapLinks(studio: Studio) {
  const coordinates = getCoordinates(studio);

  if (coordinates) {
    const point =
      `${coordinates.latitude},${coordinates.longitude}`;

    const query = encodeURIComponent(point);

    return {
      exact: true,
      embed:
        `https://maps.google.com/maps?q=${query}&z=16&output=embed`,
      open:
        `https://www.google.com/maps/search/?api=1&query=${query}`,
      directions:
        `https://www.google.com/maps/dir/?api=1&destination=${query}`,
    };
  }

  const area = encodeURIComponent(
    studio.location?.trim() || ""
  );

  return {
    exact: false,
    embed: area
      ? `https://maps.google.com/maps?q=${area}&output=embed`
      : "",
    open: area
      ? `https://www.google.com/maps/search/?api=1&query=${area}`
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
  const [availability, setAvailability] = useState("all");
  const [exactOnly, setExactOnly] = useState(false);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [mapMode, setMapMode] = useState<MapMode>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch studio listings.
  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/api/studios`, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    })
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
            : "Unable to load studio locations."
        );

        setLoading(false);
      });

    return () => controller.abort();
  }, [refreshKey]);

  const locations = useMemo(() => {
    return [
      ...new Set(
        studios
          .map((studio) => studio.location?.trim())
          .filter(
            (value): value is string => Boolean(value)
          )
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [studios]);

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
  }, [studios, search, location, availability, exactOnly]);

  const mappedStudios = useMemo(
    () =>
      filtered.filter(
        (studio) => getCoordinates(studio) !== null
      ),
    [filtered]
  );

  const selectedStudio =
    filtered.find((studio) => studio._id === selectedId) ??
    filtered[0] ??
    null;

  const selectedCoordinates = selectedStudio
    ? getCoordinates(selectedStudio)
    : null;

  const mapLinks = selectedStudio
    ? getMapLinks(selectedStudio)
    : null;

  const exactCount = studios.filter(
    (studio) => getCoordinates(studio) !== null
  ).length;

  // A stable callback prevents the Leaflet map from
  // being rebuilt every time the page renders.
  const handlePinSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  function selectStudio(studio: Studio) {
    setSelectedId(studio._id);

    // Studios without coordinates use the original
    // area-search view instead of a guessed pin.
    if (getCoordinates(studio) === null) {
      setMapMode("selected");
    }
  }

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
    setMapMode("all");
  }

  const inputStyle = {
    background: "var(--ss-surface-alt)",
    borderColor: "var(--ss-border)",
    color: "var(--ss-ink)",
  };

  const showMultiMap =
    mapMode === "all" && mappedStudios.length > 0;

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
            Explore creative studios on an interactive map,
            compare their locations, and find the right
            studio for your next booking.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 md:py-14">
        {/* Search and filters */}
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
                  placeholder="Studio, address or city..."
                  className="w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none focus:border-violet-500"
                  style={inputStyle}
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
                className="w-full rounded-xl border px-4 py-3 text-sm"
                style={inputStyle}
              >
                <option value="all">All Locations</option>
                {locations.map((area) => (
                  <option key={area} value={area}>
                    {area}
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
                className="w-full rounded-xl border px-4 py-3 text-sm"
                style={inputStyle}
              >
                <option value="all">All Studios</option>
                <option value="bookable">Bookable Only</option>
                <option value="unavailable">
                  Unavailable Only
                </option>
              </select>
            </div>
          </div>

          <div
            className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
            style={{ borderColor: "var(--ss-border)" }}
          >
            <label
              className="flex cursor-pointer items-center gap-2 text-sm font-semibold"
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
              Exact Locations Only
            </label>

            <div className="flex flex-wrap items-center gap-4">
              <span
                className="text-xs"
                style={{ color: "var(--ss-muted)" }}
              >
                {exactCount} studios with coordinates
              </span>

              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-violet-700 dark:text-violet-300"
              >
                Clear Filters
              </button>

              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="inline-flex items-center gap-2 text-xs font-semibold text-violet-700 disabled:opacity-50 dark:text-violet-300"
              >
                <RefreshCw
                  size={15}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>

          <p
            className="mt-4 text-xs"
            style={{ color: "var(--ss-muted)" }}
          >
            {filtered.length} matching studios ·{" "}
            {mappedStudios.length} map pins
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-3 text-violet-700">
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

            <p
              className="mt-3 text-sm"
              style={{ color: "var(--ss-muted)" }}
            >
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
          <div className="grid items-start gap-6 lg:grid-cols-[370px_minmax(0,1fr)]">
            {/* Studio list */}
            <section
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
                  Select a studio to highlight it on the map.
                </p>
              </div>

              <div className="max-h-[660px] space-y-2 overflow-y-auto p-3">
                {filtered.length === 0 ? (
                  <p
                    className="py-12 text-center text-sm"
                    style={{ color: "var(--ss-muted)" }}
                  >
                    No matching studios.
                  </p>
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
                        onClick={() => selectStudio(studio)}
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
                            <MapPin size={13} />
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
                            className="mt-1 inline-flex items-center gap-1.5 text-[11px]"
                            style={{ color: "var(--ss-muted)" }}
                          >
                            {exact ? (
                              <>
                                <CheckCircle2
                                  size={13}
                                  className="text-violet-600"
                                />
                                Map coordinates provided
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
            </section>

            {/* Map and selected studio */}
            <section
              className="overflow-hidden rounded-2xl border"
              style={{
                background: "var(--ss-surface)",
                borderColor: "var(--ss-border)",
              }}
            >
              {/* Map mode controls */}
              <div
                className="flex flex-wrap items-center justify-between gap-3 border-b p-4"
                style={{ borderColor: "var(--ss-border)" }}
              >
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMapMode("all")}
                    disabled={mappedStudios.length === 0}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-40 ${
                      mapMode === "all"
                        ? "bg-violet-700 text-white"
                        : "bg-violet-500/10 text-violet-700 dark:text-violet-200"
                    }`}
                  >
                    <Layers size={15} />
                    All Studio Pins
                  </button>

                  <button
                    type="button"
                    onClick={() => setMapMode("selected")}
                    disabled={!selectedStudio}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-40 ${
                      mapMode === "selected"
                        ? "bg-violet-700 text-white"
                        : "bg-violet-500/10 text-violet-700 dark:text-violet-200"
                    }`}
                  >
                    Selected Studio
                  </button>
                </div>

                <span
                  className="text-xs"
                  style={{ color: "var(--ss-muted)" }}
                >
                  {mappedStudios.length} exact pins
                </span>
              </div>

              {showMultiMap ? (
                <div className="p-3">
                  <MultiStudioMap
                    studios={mappedStudios}
                    selectedId={selectedStudio?._id ?? null}
                    onSelect={handlePinSelect}
                  />

                  <p
                    className="mt-3 px-2 text-xs leading-6"
                    style={{ color: "var(--ss-muted)" }}
                  >
                    Click a purple marker to select a studio.
                    Scroll-wheel zoom is off to avoid
                    accidental zooming while scrolling.
                    Use the map controls to zoom.
                  </p>
                </div>
              ) : selectedStudio && mapLinks?.embed ? (
                <iframe
                  key={`${selectedStudio._id}-${mapLinks.embed}`}
                  title={
                    mapLinks.exact
                      ? `Location of ${selectedStudio.title}`
                      : `Area map for ${selectedStudio.location}`
                  }
                  src={mapLinks.embed}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="h-[400px] w-full border-0 sm:h-[510px] lg:h-[590px]"
                />
              ) : (
                <div className="flex min-h-96 flex-col items-center justify-center gap-3 p-8 text-center">
                  <MapPin
                    size={38}
                    className="text-violet-500"
                  />
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--ss-ink)" }}
                  >
                    No map locations available
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--ss-muted)" }}
                  >
                    Hosts can add coordinates when
                    editing their studios.
                  </p>
                </div>
              )}

              {/* Studio details below the map */}
              {selectedStudio && (
                <div
                  className="border-t p-5"
                  style={{ borderColor: "var(--ss-border)" }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h2
                        className="text-lg font-extrabold"
                        style={{ color: "var(--ss-ink)" }}
                      >
                        {selectedStudio.title}
                      </h2>

                      <p
                        className="mt-2 flex items-start gap-2 text-sm"
                        style={{ color: "var(--ss-muted)" }}
                      >
                        <MapPin size={16} />
                        {selectedStudio.location}
                      </p>

                      {selectedStudio.fullAddress && (
                        <p
                          className="mt-2 text-sm"
                          style={{ color: "var(--ss-ink)" }}
                        >
                          <strong>Address:</strong>{" "}
                          {selectedStudio.fullAddress}
                        </p>
                      )}

                      {selectedCoordinates && (
                        <p
                          className="mt-2 text-xs"
                          style={{ color: "var(--ss-muted)" }}
                        >
                          Coordinates:{" "}
                          {selectedCoordinates.latitude.toFixed(6)},{" "}
                          {selectedCoordinates.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/studios/${selectedStudio._id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-bold text-white"
                    >
                      View Studio
                      <ArrowRight size={15} />
                    </Link>
                  </div>

                  {mapLinks?.open && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <a
                        href={mapLinks.open}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-violet-300/40 px-4 py-2.5 text-xs font-semibold text-violet-700 dark:text-violet-300"
                      >
                        Open in Google Maps
                        <ExternalLink size={15} />
                      </a>

                      {mapLinks.directions && (
                        <a
                          href={mapLinks.directions}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-semibold text-white"
                        >
                          <Navigation size={15} />
                          Get Directions
                        </a>
                      )}
                    </div>
                  )}

                  <p
                    className="mt-4 text-xs leading-6"
                    style={{ color: "var(--ss-muted)" }}
                  >
                    {selectedCoordinates
                      ? "Map pins use coordinates submitted by studio hosts. These locations have not been independently verified. Confirm directions before travelling."
                      : "This studio has no saved coordinates, so its map shows a general area search rather than an exact pin."}
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
