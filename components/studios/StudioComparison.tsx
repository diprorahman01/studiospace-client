
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeftRight,
  Building2,
  Check,
  CheckCircle2,
  Heart,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { Studio } from "@/types/studio";

type Props = {
  studios: Studio[];
};

const MAX_COMPARE = 3;

function money(value: number) {
  return `$${Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

function bookable(studio: Studio) {
  return (
    studio.isDemo !== true &&
    (studio.status == null || studio.status === "active")
  );
}

function normalizedAmenities(studio: Studio) {
  return (studio.amenities || [])
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0
    )
    .map((value) => value.trim());
}

export default function StudioComparison({
  studios,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    []
  );
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedStudios = useMemo(() => {
    const lookup = new Map(
      studios.map((studio) => [studio._id, studio])
    );

    return selectedIds
      .map((id) => lookup.get(id))
      .filter((studio): studio is Studio => Boolean(studio));
  }, [selectedIds, studios]);

  const candidates = useMemo(() => {
    const term = search.trim().toLowerCase();

    return studios
      .filter((studio) => !selectedIds.includes(studio._id))
      .filter(
        (studio) =>
          studio.title.toLowerCase().includes(term) ||
          studio.category.toLowerCase().includes(term) ||
          studio.location.toLowerCase().includes(term)
      )
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [studios, selectedIds, search]);

  const allAmenities = useMemo(() => {
    const values = new Map<string, string>();

    for (const studio of selectedStudios) {
      for (const amenity of normalizedAmenities(studio)) {
        const key = amenity.toLowerCase();

        if (!values.has(key)) {
          values.set(key, amenity);
        }
      }
    }

    return [...values.values()].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [selectedStudios]);

  const lowestPrice = Math.min(
    ...selectedStudios.map((studio) => studio.hourlyRate)
  );

  const highestCapacity = Math.max(
    ...selectedStudios.map((studio) => studio.maxCapacity)
  );

  function addStudio(id: string) {
    setSelectedIds((current) => {
      if (
        current.includes(id) ||
        current.length >= MAX_COMPARE
      ) {
        return current;
      }

      return [...current, id];
    });

    setPickerOpen(false);
    setSearch("");
  }

  function removeStudio(id: string) {
    setSelectedIds((current) =>
      current.filter((item) => item !== id)
    );
  }

  const inputStyle = {
    background: "var(--ss-surface-alt)",
    borderColor: "var(--ss-border)",
    color: "var(--ss-ink)",
  };

  return (
    <main className="min-h-[75vh]">
      {/* Header */}
      <section className="relative overflow-hidden bg-[#171024] px-5 py-16 text-center text-white sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.25),transparent_65%)]" />

        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-300/10 px-4 py-2 text-xs font-bold text-violet-200">
            <ArrowLeftRight size={15} />
            Find Your Best Match
          </span>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Compare Studios
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-violet-100 sm:text-base">
            Compare up to three creative studios side by side.
            Explore prices, capacity, amenities, and booking
            status before choosing the right space.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-5 py-10 sm:py-14">
        {/* Selection toolbar */}
        <div
          className="rounded-2xl border p-5 sm:p-6"
          style={{
            background: "var(--ss-surface)",
            borderColor: "var(--ss-border)",
            boxShadow: "var(--ss-shadow)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2
                className="text-lg font-extrabold"
                style={{ color: "var(--ss-ink)" }}
              >
                Choose Studios
              </h2>

              <p
                className="mt-1 text-sm"
                style={{ color: "var(--ss-muted)" }}
              >
                {selectedStudios.length} of {MAX_COMPARE}{" "}
                studios selected
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"
                  style={{
                    borderColor: "var(--ss-border)",
                    color: "var(--ss-muted)",
                  }}
                >
                  <Trash2 size={16} />
                  Clear All
                </button>
              )}

              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={
                  selectedStudios.length >= MAX_COMPARE
                }
                className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={17} />
                Add Studio
              </button>
            </div>
          </div>

          {selectedStudios.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {selectedStudios.map((studio) => (
                <button
                  key={studio._id}
                  type="button"
                  onClick={() => removeStudio(studio._id)}
                  className="inline-flex items-center gap-2 rounded-full border border-violet-300/40 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-700 dark:text-violet-200"
                >
                  {studio.title}
                  <X size={14} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comparison instructions */}
        {selectedStudios.length < 2 && (
          <div
            className="rounded-2xl border px-6 py-6"
            style={{
              background: "var(--ss-surface-alt)",
              borderColor: "var(--ss-border)",
            }}
          >
            <div className="flex items-start gap-3">
              <ArrowLeftRight
                size={23}
                className="shrink-0 text-violet-600 dark:text-violet-300"
              />

              <div>
                <h3
                  className="font-bold"
                  style={{ color: "var(--ss-ink)" }}
                >
                  Select at least two studios
                </h3>

                <p
                  className="mt-1 text-sm leading-6"
                  style={{ color: "var(--ss-muted)" }}
                >
                  Click Add Studio to choose your first
                  studio, then add another to compare them.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comparison grid */}
        <div className="overflow-x-auto pb-3">
          <div
            className="grid min-w-[700px] gap-3"
            style={{
              gridTemplateColumns:
                "160px repeat(3, minmax(170px, 1fr))",
            }}
          >
            <div className="flex items-end pb-4">
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--ss-muted)" }}
              >
                Studio Details
              </span>
            </div>

            {Array.from({ length: MAX_COMPARE }).map(
              (_, index) => {
                const studio = selectedStudios[index];

                if (!studio) {
                  return (
                    <button
                      key={`empty-${index}`}
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-5 transition hover:border-violet-500"
                      style={{
                        borderColor: "var(--ss-border)",
                        color: "var(--ss-muted)",
                      }}
                    >
                      <Plus
                        size={26}
                        className="text-violet-600"
                      />
                      <span className="text-sm font-semibold">
                        Add Studio
                      </span>
                    </button>
                  );
                }

                return (
                  <div
                    key={studio._id}
                    className="ss-card overflow-hidden"
                  >
                    <div className="relative h-40">
                      {studio.image ? (
                        <Image
                          src={studio.image}
                          alt={studio.title}
                          fill
                          sizes="240px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Building2
                            size={35}
                            className="text-violet-500"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        aria-label={`Remove ${studio.title}`}
                        onClick={() =>
                          removeStudio(studio._id)
                        }
                        className="absolute right-3 top-3 rounded-full bg-white p-2 text-slate-800 shadow-md transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <X size={17} />
                      </button>
                    </div>

                    <div className="space-y-3 p-4">
                      <p className="text-xs font-bold text-violet-600 dark:text-violet-300">
                        {studio.category}
                      </p>

                      <h3
                        className="min-h-12 text-base font-extrabold"
                        style={{ color: "var(--ss-ink)" }}
                      >
                        {studio.title}
                      </h3>

                      <p
                        className="flex items-start gap-2 text-xs"
                        style={{ color: "var(--ss-muted)" }}
                      >
                        <MapPin
                          size={14}
                          className="shrink-0"
                        />
                        {studio.location}
                      </p>

                      <Link
                        href={`/studios/${studio._id}`}
                        className="ss-cta-primary flex w-full items-center justify-center gap-2 px-3 py-2.5 text-xs"
                      >
                        View Studio
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                );
              }
            )}

            {/* Comparison rows */}
            {[
              {
                label: "Hourly Price",
                render: (studio: Studio) => (
                  <div className="space-y-1">
                    <strong className="text-lg">
                      {money(studio.hourlyRate)}
                    </strong>

                    {selectedStudios.length >= 2 &&
                      studio.hourlyRate === lowestPrice && (
                        <span className="block text-xs font-semibold text-green-600">
                          Lowest price
                        </span>
                      )}
                  </div>
                ),
              },
              {
                label: "Security Deposit",
                render: (studio: Studio) => (
                  <strong>
                    {money(studio.securityDeposit)}
                  </strong>
                ),
              },
              {
                label: "Maximum Capacity",
                render: (studio: Studio) => (
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-2">
                      <Users size={16} />
                      {studio.maxCapacity} people
                    </span>

                    {selectedStudios.length >= 2 &&
                      studio.maxCapacity === highestCapacity && (
                        <span className="block text-xs font-semibold text-green-600">
                          Highest capacity
                        </span>
                      )}
                  </div>
                ),
              },
              {
                label: "Booking Status",
                render: (studio: Studio) =>
                  bookable(studio) ? (
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-600">
                      <CheckCircle2 size={16} />
                      Bookable
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600">
                      <ShieldAlert size={16} />
                      Unavailable
                    </span>
                  ),
              },
              {
                label: "Rating",
                render: (studio: Studio) =>
                  typeof studio.rating === "number" &&
                  studio.rating > 0 ? (
                    <span className="inline-flex items-center gap-2">
                      <Star
                        size={16}
                        className="fill-amber-400 text-amber-400"
                      />
                      {studio.rating.toFixed(1)}
                    </span>
                  ) : (
                    <span style={{ color: "var(--ss-muted)" }}>
                      Not rated
                    </span>
                  ),
              },
            ].flatMap((section) => [
              <div
                key={`${section.label}-title`}
                className="flex items-center rounded-xl border p-4 text-xs font-bold"
                style={{
                  borderColor: "var(--ss-border)",
                  color: "var(--ss-ink)",
                  background: "var(--ss-surface-alt)",
                }}
              >
                {section.label}
              </div>,

              ...Array.from({ length: MAX_COMPARE }).map(
                (_, index) => (
                  <div
                    key={`${section.label}-${index}`}
                    className="flex min-h-16 items-center rounded-xl border p-4 text-sm"
                    style={{
                      borderColor: "var(--ss-border)",
                      color: "var(--ss-ink)",
                      background: "var(--ss-surface)",
                    }}
                  >
                    {selectedStudios[index]
                      ? section.render(selectedStudios[index])
                      : "—"}
                  </div>
                )
              ),
            ])}

            <div
              className="col-span-4 rounded-xl border px-4 py-3 text-sm font-extrabold"
              style={{
                borderColor: "var(--ss-border)",
                color: "var(--ss-ink)",
                background: "var(--ss-surface-alt)",
              }}
            >
              Amenities Comparison
            </div>

            {allAmenities.length === 0 ? (
              <div
                className="col-span-4 rounded-xl border p-5 text-sm"
                style={{
                  borderColor: "var(--ss-border)",
                  color: "var(--ss-muted)",
                }}
              >
                Select studios to compare their amenities.
              </div>
            ) : (
              allAmenities.flatMap((amenity) => [
                <div
                  key={`amenity-${amenity}`}
                  className="flex items-center rounded-xl border p-4 text-xs font-semibold"
                  style={{
                    borderColor: "var(--ss-border)",
                    color: "var(--ss-ink)",
                    background: "var(--ss-surface-alt)",
                  }}
                >
                  {amenity}
                </div>,

                ...Array.from({
                  length: MAX_COMPARE,
                }).map((_, index) => {
                  const studio = selectedStudios[index];

                  const hasAmenity =
                    studio &&
                    normalizedAmenities(studio).some(
                      (value) =>
                        value.toLowerCase() ===
                        amenity.toLowerCase()
                    );

                  return (
                    <div
                      key={`amenity-${amenity}-${index}`}
                      className="flex min-h-14 items-center justify-center rounded-xl border"
                      style={{
                        borderColor: "var(--ss-border)",
                        background: "var(--ss-surface)",
                      }}
                    >
                      {studio ? (
                        hasAmenity ? (
                          <Check
                            size={20}
                            className="text-green-600"
                            aria-label="Included"
                          />
                        ) : (
                          <X
                            size={18}
                            className="text-slate-400"
                            aria-label="Not included"
                          />
                        )
                      ) : (
                        <span
                          style={{ color: "var(--ss-muted)" }}
                        >
                          —
                        </span>
                      )}
                    </div>
                  );
                }),
              ])
            )}
          </div>
        </div>

        {/* Corrected JSX apostrophe */}
        <p
          className="text-xs leading-6"
          style={{ color: "var(--ss-muted)" }}
        >
          Booking status indicates whether a listing accepts
          reservations. It does not guarantee that a specific
          date or time is available. Check the studio&apos;s
          availability calendar before booking.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/studios"
            className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold"
            style={{
              borderColor: "var(--ss-border)",
              color: "var(--ss-accent)",
            }}
          >
            <ArrowLeftRight size={17} />
            Explore More Studios
          </Link>

          <Link
            href="/favorites"
            className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold"
            style={{
              borderColor: "var(--ss-border)",
              color: "var(--ss-accent)",
            }}
          >
            <Heart size={17} />
            My Favorites
          </Link>
        </div>
      </section>

      {/* Studio picker modal */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPickerOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="studio-picker-title"
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-violet-300/20 bg-white shadow-2xl dark:bg-[#21172f]"
          >
            <div className="flex items-center justify-between border-b border-violet-100 p-5 dark:border-violet-400/20">
              <div>
                <h2
                  id="studio-picker-title"
                  className="text-xl font-extrabold text-slate-950 dark:text-white"
                >
                  Add a Studio
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-violet-200">
                  Select a studio to include in your comparison.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                aria-label="Close studio picker"
                className="rounded-lg p-2 text-slate-500 hover:bg-violet-50 dark:text-violet-200"
              >
                <X size={21} />
              </button>
            </div>

            <div className="p-5">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-500"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search by name, location or category..."
                  aria-label="Search studios for comparison"
                  className="w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none focus:border-violet-500"
                  style={inputStyle}
                />
              </div>

              <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto">
                {candidates.length === 0 ? (
                  <p className="py-12 text-center text-sm text-slate-500 dark:text-violet-200">
                    No matching studios found.
                  </p>
                ) : (
                  candidates.map((studio) => (
                    <button
                      key={studio._id}
                      type="button"
                      onClick={() => addStudio(studio._id)}
                      className="flex w-full items-center gap-4 rounded-xl border p-3 text-left transition hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10"
                      style={{
                        borderColor: "var(--ss-border)",
                      }}
                    >
                      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-violet-100/10">
                        {studio.image ? (
                          <Image
                            src={studio.image}
                            alt=""
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Building2
                              size={23}
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
                          className="mt-1 block truncate text-xs"
                          style={{ color: "var(--ss-muted)" }}
                        >
                          {studio.location} ·{" "}
                          {money(studio.hourlyRate)} / hour
                        </span>
                      </span>

                      <Plus
                        size={18}
                        className="shrink-0 text-violet-600"
                      />
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
