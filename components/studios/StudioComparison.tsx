
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  ArrowRight,
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

function amenitiesFor(studio: Studio) {
  return (studio.amenities || [])
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0
    )
    .map((value) => value.trim());
}

export default function StudioComparison({ studios }: Props) {
  const searchParams = useSearchParams();

  const studioLookup = useMemo(
    () => new Map(studios.map((studio) => [studio._id, studio])),
    [studios]
  );

  const initialIds = useMemo(() => {
    const value = searchParams.get("studios") || "";

    return [...new Set(value.split(",").filter(Boolean))]
      .filter((id) => studioLookup.has(id))
      .slice(0, MAX_COMPARE);
  }, [searchParams, studioLookup]);

  const [localSelection, setLocalSelection] = useState<{
    source: string;
    ids: string[];
  } | null>(null);

  const source = initialIds.join(",");

  const selectedIds =
    localSelection?.source === source
      ? localSelection.ids
      : initialIds;

  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedStudios = selectedIds
    .map((id) => studioLookup.get(id))
    .filter((studio): studio is Studio => Boolean(studio));

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
      for (const amenity of amenitiesFor(studio)) {
        const key = amenity.toLowerCase();
        if (!values.has(key)) values.set(key, amenity);
      }
    }

    return [...values.values()].sort((a, b) => a.localeCompare(b));
  }, [selectedStudios]);

  const lowestPrice = Math.min(
    ...selectedStudios.map((studio) => studio.hourlyRate)
  );

  const highestCapacity = Math.max(
    ...selectedStudios.map((studio) => studio.maxCapacity)
  );

  function updateSelection(ids: string[]) {
    const valid = [...new Set(ids)]
      .filter((id) => studioLookup.has(id))
      .slice(0, MAX_COMPARE);

    setLocalSelection({ source, ids: valid });

    const url = new URL(window.location.href);

    if (valid.length > 0) {
      url.searchParams.set("studios", valid.join(","));
    } else {
      url.searchParams.delete("studios");
    }

    window.history.replaceState(null, "", url.toString());
  }

  function addStudio(id: string) {
    if (selectedIds.includes(id) || selectedIds.length >= MAX_COMPARE) {
      return;
    }

    updateSelection([...selectedIds, id]);
    setPickerOpen(false);
    setSearch("");
  }

  function removeStudio(id: string) {
    updateSelection(selectedIds.filter((item) => item !== id));
  }

  const inputStyle = {
    background: "var(--ss-surface-alt)",
    borderColor: "var(--ss-border)",
    color: "var(--ss-ink)",
  };

  const comparisonRows = [
    {
      label: "Hourly Price",
      render: (studio: Studio) => (
        <div>
          <strong className="text-lg">{money(studio.hourlyRate)}</strong>
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
        <strong>{money(studio.securityDeposit)}</strong>
      ),
    },
    {
      label: "Maximum Capacity",
      render: (studio: Studio) => (
        <div>
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
          <span className="inline-flex items-center gap-2 font-semibold text-green-600">
            <CheckCircle2 size={16} /> Bookable
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 font-semibold text-amber-600">
            <ShieldAlert size={16} /> Unavailable
          </span>
        ),
    },
    {
      label: "Rating",
      render: (studio: Studio) =>
        typeof studio.rating === "number" && studio.rating > 0 ? (
          <span className="inline-flex items-center gap-2">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            {studio.rating.toFixed(1)}
          </span>
        ) : (
          <span style={{ color: "var(--ss-muted)" }}>Not rated</span>
        ),
    },
  ];

  return (
    <main className="min-h-[75vh]">
      <section className="relative overflow-hidden bg-[#171024] px-5 py-16 text-center text-white sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.25),transparent_65%)]" />

        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-300/10 px-4 py-2 text-xs font-bold text-violet-200">
            <ArrowLeftRight size={15} /> Find Your Best Match
          </span>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Compare Studios
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-violet-100 sm:text-base">
            Compare up to three creative studios side by side.
            Explore prices, capacity, amenities, and booking status.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-5 py-10 sm:py-14">
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
              <h2 className="text-lg font-extrabold" style={{ color: "var(--ss-ink)" }}>
                Choose Studios
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--ss-muted)" }}>
                {selectedIds.length} of {MAX_COMPARE} studios selected
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => updateSelection([])}
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"
                  style={{
                    borderColor: "var(--ss-border)",
                    color: "var(--ss-muted)",
                  }}
                >
                  <Trash2 size={16} /> Clear All
                </button>
              )}

              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={selectedIds.length >= MAX_COMPARE}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-50"
              >
                <Plus size={17} /> Add Studio
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
                  {studio.title} <X size={14} />
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedStudios.length < 2 && (
          <div
            className="rounded-2xl border px-6 py-6"
            style={{
              background: "var(--ss-surface-alt)",
              borderColor: "var(--ss-border)",
            }}
          >
            <h3 className="font-bold" style={{ color: "var(--ss-ink)" }}>
              Select at least two studios
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--ss-muted)" }}>
              Use Add Studio to select more spaces for comparison.
            </p>
          </div>
        )}

        <div className="overflow-x-auto pb-3">
          <div
            className="grid min-w-[700px] gap-3"
            style={{
              gridTemplateColumns: "160px repeat(3, minmax(170px, 1fr))",
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

            {Array.from({ length: MAX_COMPARE }, (_, index) => {
              const studio = selectedStudios[index];

              if (!studio) {
                return (
                  <button
                    key={`empty-${index}`}
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-5"
                    style={{
                      borderColor: "var(--ss-border)",
                      color: "var(--ss-muted)",
                    }}
                  >
                    <Plus size={26} className="text-violet-600" />
                    <span className="text-sm font-semibold">Add Studio</span>
                  </button>
                );
              }

              return (
                <div key={studio._id} className="ss-card overflow-hidden">
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
                        <Building2 size={35} className="text-violet-500" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => removeStudio(studio._id)}
                      aria-label={`Remove ${studio.title}`}
                      className="absolute right-3 top-3 rounded-full bg-white p-2 text-slate-800 shadow-md hover:text-rose-600"
                    >
                      <X size={17} />
                    </button>
                  </div>

                  <div className="space-y-3 p-4">
                    <p className="text-xs font-bold text-violet-600 dark:text-violet-300">
                      {studio.category}
                    </p>
                    <h3 className="min-h-12 text-base font-extrabold" style={{ color: "var(--ss-ink)" }}>
                      {studio.title}
                    </h3>
                    <p className="flex items-start gap-2 text-xs" style={{ color: "var(--ss-muted)" }}>
                      <MapPin size={14} className="shrink-0" />
                      {studio.location}
                    </p>
                    <Link
                      href={`/studios/${studio._id}`}
                      className="ss-cta-primary flex w-full items-center justify-center gap-2 px-3 py-2.5 text-xs"
                    >
                      View Studio <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              );
            })}

            {comparisonRows.flatMap((section) => [
              <div
                key={`${section.label}-label`}
                className="flex items-center rounded-xl border p-4 text-xs font-bold"
                style={{
                  borderColor: "var(--ss-border)",
                  color: "var(--ss-ink)",
                  background: "var(--ss-surface-alt)",
                }}
              >
                {section.label}
              </div>,
              ...Array.from({ length: MAX_COMPARE }, (_, index) => (
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
              )),
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
                ...Array.from({ length: MAX_COMPARE }, (_, index) => {
                  const studio = selectedStudios[index];

                  const included = studio
                    ? amenitiesFor(studio).some(
                        (value) => value.toLowerCase() === amenity.toLowerCase()
                      )
                    : false;

                  return (
                    <div
                      key={`amenity-${amenity}-${index}`}
                      className="flex min-h-14 items-center justify-center rounded-xl border"
                      style={{
                        borderColor: "var(--ss-border)",
                        background: "var(--ss-surface)",
                      }}
                    >
                      {!studio ? (
                        <span style={{ color: "var(--ss-muted)" }}>—</span>
                      ) : included ? (
                        <Check size={20} className="text-green-600" aria-label="Included" />
                      ) : (
                        <X size={18} className="text-slate-400" aria-label="Not included" />
                      )}
                    </div>
                  );
                }),
              ])
            )}
          </div>
        </div>

        <p className="text-xs leading-6" style={{ color: "var(--ss-muted)" }}>
          Booking status indicates whether a listing accepts reservations.
          It does not guarantee that a particular date or time is free.
          Check the studio&apos;s availability calendar before booking.
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
            <ArrowLeftRight size={17} /> Explore More Studios
          </Link>

          <Link
            href="/favorites"
            className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold"
            style={{
              borderColor: "var(--ss-border)",
              color: "var(--ss-accent)",
            }}
          >
            <Heart size={17} /> My Favorites
          </Link>
        </div>
      </section>

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
                className="rounded-lg p-2 text-slate-500 dark:text-violet-200"
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
                  onChange={(event) => setSearch(event.target.value)}
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
                      style={{ borderColor: "var(--ss-border)" }}
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
                            <Building2 size={23} className="text-violet-500" />
                          </div>
                        )}
                      </div>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold" style={{ color: "var(--ss-ink)" }}>
                          {studio.title}
                        </span>
                        <span className="mt-1 block truncate text-xs" style={{ color: "var(--ss-muted)" }}>
                          {studio.location} · {money(studio.hourlyRate)} / hour
                        </span>
                      </span>
                      <Plus size={18} className="shrink-0 text-violet-600" />
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
