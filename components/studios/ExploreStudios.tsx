
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
} from "lucide-react";
import type { Studio } from "@/types/studio";

interface ExploreStudiosProps {
  studios: Studio[];
}

const categories = [
  "All Categories",
  "Photo Studio",
  "Film Stage",
  "Podcast Lounge",
  "Music Suite",
  "Art Workshop",
  "Creative Workspace",
];

const demoRatings: Record<string, number> = {
  "The Fashion Editorial Studio": 4.9,
  "The Green Screen Production Studio": 4.7,
  "The Product Photography Studio": 4.8,
  "The Dance & Performance Studio": 4.6,
  "The Live Streaming Studio": 4.9,
  "The Pottery & Ceramic Art Studio": 4.8,
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function getRating(studio: Studio) {
  if (
    typeof studio.rating === "number" &&
    Number.isFinite(studio.rating) &&
    studio.rating > 0
  ) {
    return {
      value: studio.rating,
      isDemo: false,
    };
  }

  const demoRating = demoRatings[studio.title];

  if (demoRating !== undefined) {
    return { value: demoRating, isDemo: true };
  }

  return { value: null, isDemo: false };
}

function isBookable(studio: Studio) {
  return (
    studio.isDemo !== true &&
    (studio.status == null || studio.status === "active")
  );
}

// Stable order using the studio ID.
// Cards won't jump around whenever a component rerenders.
function studioOrderKey(studio: Studio) {
  let hash = 0;

  for (const char of studio._id) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }

  return hash >>> 0;
}

function mixStudios(studios: Studio[]) {
  const available = studios
    .filter(isBookable)
    .sort(
      (a, b) =>
        studioOrderKey(a) - studioOrderKey(b)
    );

  const unavailable = studios
    .filter((studio) => !isBookable(studio))
    .sort(
      (a, b) =>
        studioOrderKey(a) - studioOrderKey(b)
    );

  const mixed: Studio[] = [];

  while (available.length > 0 || unavailable.length > 0) {
    const activeStudio = available.shift();
    const inactiveStudio = unavailable.shift();

    if (activeStudio) mixed.push(activeStudio);
    if (inactiveStudio) mixed.push(inactiveStudio);
  }

  return mixed;
}

type CategoryDropdownProps = {
  value: string;
  onChange: (value: string) => void;
};

function CategoryDropdown({
  value,
  onChange,
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: PointerEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  function selectCategory(item: string) {
    onChange(item);
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onBlur={(event) => {
        if (
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          setIsOpen(false);
        }
      }}
    >
      <span
        id="studio-category-label"
        className="mb-2 block text-sm font-semibold"
        style={{ color: "var(--ss-ink)" }}
      >
        Category
      </span>

      <button
        ref={buttonRef}
        id="studio-category"
        type="button"
        aria-labelledby="studio-category-label studio-category"
        aria-haspopup="listbox"
        aria-controls="studio-category-options"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (
            event.key === "ArrowDown" ||
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        className="flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium outline-none transition hover:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-500/40"
        style={{
          background: "var(--ss-surface-alt)",
          borderColor: isOpen
            ? "var(--ss-accent)"
            : "var(--ss-border)",
          color: "var(--ss-ink)",
        }}
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          size={17}
          aria-hidden="true"
          className={`shrink-0 text-violet-600 transition-transform duration-200 dark:text-violet-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          id="studio-category-options"
          role="listbox"
          aria-labelledby="studio-category-label"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-violet-200 bg-[#fffaff] p-1.5 shadow-[0_15px_45px_rgba(87,33,138,0.20)] dark:border-violet-400/30 dark:bg-[#21172f] dark:shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
        >
          <div className="max-h-[310px] overflow-y-auto">
            {categories.map((item) => {
              const selected = value === item;

              return (
                <button
                  key={item}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectCategory(item)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium outline-none transition-colors duration-150 focus-visible:bg-violet-100 focus-visible:text-violet-800 dark:focus-visible:bg-violet-500/20 dark:focus-visible:text-white ${
                    selected
                      ? "bg-violet-100 text-violet-800 dark:bg-violet-500/25 dark:text-[#f4e5ff]"
                      : "text-[#402658] hover:bg-violet-50 hover:text-violet-700 dark:text-[#e1d1ef] dark:hover:bg-violet-500/15 dark:hover:text-white"
                  }`}
                >
                  <span>{item}</span>
                  {selected && (
                    <Check
                      size={17}
                      aria-hidden="true"
                      className="shrink-0 text-violet-700 dark:text-violet-300"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExploreStudios({
  studios,
}: ExploreStudiosProps) {
  const searchParams = useSearchParams();

  const categoryFromURL =
    searchParams.get("category") || "All Categories";

  const initialCategory = categories.includes(categoryFromURL)
    ? categoryFromURL
    : "All Categories";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [location, setLocation] = useState("All Locations");
  const [sortBy, setSortBy] = useState("mixed");

  const locations = useMemo(
    () => [
      "All Locations",
      ...new Set(studios.map((studio) => studio.location)),
    ],
    [studios]
  );

  const activeCategory = searchParams.has("category")
    ? category === initialCategory
      ? categoryFromURL
      : category
    : category;

  const filteredStudios = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    const results = studios.filter((studio) => {
      const matchesSearch =
        studio.title.toLowerCase().includes(searchText) ||
        studio.location.toLowerCase().includes(searchText) ||
        studio.category.toLowerCase().includes(searchText) ||
        studio.overview?.toLowerCase().includes(searchText);

      const matchesCategory =
        activeCategory === "All Categories" ||
        studio.category === activeCategory;

      const matchesLocation =
        location === "All Locations" ||
        studio.location === location;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesLocation
      );
    });

    if (sortBy === "mixed") {
      return mixStudios(results);
    }

    return [...results].sort((a, b) => {
      if (sortBy === "price-low") {
        return a.hourlyRate - b.hourlyRate;
      }

      if (sortBy === "price-high") {
        return b.hourlyRate - a.hourlyRate;
      }

      if (sortBy === "rating") {
        return (
          (getRating(b).value ?? 0) -
          (getRating(a).value ?? 0)
        );
      }

      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
    });
  }, [
    studios,
    search,
    activeCategory,
    location,
    sortBy,
  ]);

  function resetFilters() {
    setSearch("");
    setCategory("All Categories");
    setLocation("All Locations");
    setSortBy("mixed");
    window.history.replaceState(
      null,
      "",
      window.location.pathname
    );
  }

  return (
    <main className="min-h-screen">
      {/* Banner */}
      <section
        aria-labelledby="explore-heading"
        className="relative isolate flex min-h-[360px] items-center justify-center overflow-hidden px-5 py-20 text-center text-white sm:min-h-[390px]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(13,8,29,0.88) 0%, rgba(30,13,54,0.78) 50%, rgba(17,10,36,0.72) 100%), url('/images/studios/explore-banner.jpg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#151026",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_65%,rgba(144,61,208,0.15),transparent_65%)]"
        />

        <div className="relative z-10 mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-white/10 px-5 py-2 text-xs font-bold tracking-wide text-violet-100 backdrop-blur-md">
            <Sparkles size={15} />
            Find Your Perfect Creative Space
          </span>

          <h1
            id="explore-heading"
            className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Explore Studios
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-[#e9dff6] sm:text-base">
            Discover inspiring photography studios,
            podcast lounges, music suites, film stages,
            and creative workspaces for your next project.
          </p>

          <div className="mx-auto mt-7 h-1 w-20 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" />
        </div>
      </section>

      {/* Search and filters */}
      <section className="mx-auto max-w-7xl px-5 py-12 md:py-16">
        <div
          className="rounded-[22px] border p-5 shadow-sm sm:p-6"
          style={{
            background: "var(--ss-surface)",
            borderColor: "var(--ss-border)",
            boxShadow: "var(--ss-shadow)",
          }}
        >
          <div className="relative">
            <Search
              size={19}
              aria-hidden="true"
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: "var(--ss-muted)" }}
            />
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search studios by name, category or location..."
              aria-label="Search studios"
              className="w-full rounded-xl border py-3 pl-12 pr-4 text-sm outline-none transition focus:border-violet-500"
              style={{
                background: "var(--ss-surface-alt)",
                borderColor: "var(--ss-border)",
                color: "var(--ss-ink)",
              }}
            />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CategoryDropdown
              value={activeCategory}
              onChange={setCategory}
            />

            <div>
              <label
                htmlFor="studio-location"
                className="mb-2 block text-sm font-semibold"
                style={{ color: "var(--ss-ink)" }}
              >
                Location
              </label>
              <select
                id="studio-location"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:border-violet-500"
                style={{
                  background: "var(--ss-surface-alt)",
                  borderColor: "var(--ss-border)",
                  color: "var(--ss-ink)",
                }}
              >
                {locations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="studio-sort"
                className="mb-2 block text-sm font-semibold"
                style={{ color: "var(--ss-ink)" }}
              >
                Sort By
              </label>
              <select
                id="studio-sort"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:border-violet-500"
                style={{
                  background: "var(--ss-surface-alt)",
                  borderColor: "var(--ss-border)",
                  color: "var(--ss-ink)",
                }}
              >
                <option value="mixed">Mixed Studios</option>
                <option value="newest">Newest First</option>
                <option value="price-low">
                  Price: Low to High
                </option>
                <option value="price-high">
                  Price: High to Low
                </option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition hover:opacity-80"
                style={{
                  background: "var(--ss-surface-alt)",
                  borderColor: "var(--ss-border)",
                  color: "var(--ss-accent)",
                }}
              >
                <RotateCcw size={16} />
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results heading */}
        <div className="my-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="ss-kicker">
              <Sparkles size={14} />
              Creative Spaces
            </span>
            <h2 className="ss-heading mt-4">
              Available Studios
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--ss-muted)" }}
            >
              {filteredStudios.length}{" "}
              {filteredStudios.length === 1
                ? "studio"
                : "studios"}{" "}
              found
            </p>
          </div>

          <span
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium"
            style={{
              background: "var(--ss-surface)",
              borderColor: "var(--ss-border)",
              color: "var(--ss-muted)",
            }}
          >
            <SlidersHorizontal size={16} />
            Browse Spaces
          </span>
        </div>

        {/* Studio cards */}
        {filteredStudios.length === 0 ? (
          <div className="ss-card px-6 py-20 text-center">
            <Building2
              size={52}
              className="mx-auto"
              style={{ color: "var(--ss-accent)" }}
            />
            <h3
              className="mt-5 text-xl font-bold"
              style={{ color: "var(--ss-ink)" }}
            >
              No studios found
            </h3>
            <p
              className="mt-3 text-sm"
              style={{ color: "var(--ss-muted)" }}
            >
              Try changing your search or filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="ss-cta-primary mt-6"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStudios.map((studio) => {
              const rating = getRating(studio);

              return (
                <article
                  key={studio._id}
                  className="ss-card group flex h-full flex-col"
                >
                  <Link
                    href={`/studios/${studio._id}`}
                    aria-label={`View ${studio.title}`}
                    className="relative block h-[225px] overflow-hidden bg-violet-200/20 sm:h-[235px]"
                  >
                    {studio.image ? (
                      <Image
                        src={studio.image}
                        alt={studio.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Building2
                          size={40}
                          style={{
                            color: "var(--ss-accent)",
                          }}
                        />
                      </div>
                    )}

                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent"
                    />

                    <span className="absolute left-4 top-4 max-w-[78%] truncate rounded-full border border-white/20 bg-[#f8f2ff]/95 px-3 py-1.5 text-xs font-bold text-[#682c9b] shadow-sm dark:!border-violet-300/30 dark:!bg-[#21172f]/95 dark:!text-white">
                      {studio.category}
                    </span>

                    <span
                      aria-label={
                        rating.value === null
                          ? "Not yet rated"
                          : rating.isDemo
                            ? `Sample rating ${rating.value.toFixed(1)} out of 5`
                            : `Rated ${rating.value.toFixed(1)} out of 5`
                      }
                      className="absolute bottom-4 right-4 z-10 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-violet-200/70 bg-[#f8f2ff]/95 px-3 py-1.5 text-xs font-extrabold text-[#321a49] shadow-[0_5px_18px_rgba(0,0,0,0.18)] backdrop-blur-md dark:!border-violet-300/40 dark:!bg-[#21172f]/95 dark:!text-white"
                    >
                      <Star
                        size={15}
                        aria-hidden="true"
                        className="shrink-0 fill-amber-400 text-amber-400"
                      />
                      <span className="font-extrabold text-[#321a49] dark:!text-white">
                        {rating.value === null
                          ? "Unrated"
                          : rating.value.toFixed(1)}
                      </span>
                    </span>
                  </Link>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <Link href={`/studios/${studio._id}`}>
                      <h3
                        className="line-clamp-2 text-lg font-extrabold transition group-hover:opacity-75"
                        style={{ color: "var(--ss-ink)" }}
                      >
                        {studio.title}
                      </h3>
                    </Link>

                    <div
                      className="mt-3 flex items-start gap-2 text-sm"
                      style={{ color: "var(--ss-muted)" }}
                    >
                      <MapPin
                        size={16}
                        className="mt-0.5 shrink-0"
                      />
                      <span>{studio.location}</span>
                    </div>

                    <div
                      className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-5"
                      style={{
                        borderColor: "var(--ss-border)",
                        marginTop: "24px",
                      }}
                    >
                      <div>
                        <span
                          className="text-2xl font-extrabold"
                          style={{
                            color: "var(--ss-accent)",
                          }}
                        >
                          ${formatPrice(studio.hourlyRate)}
                        </span>
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
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
