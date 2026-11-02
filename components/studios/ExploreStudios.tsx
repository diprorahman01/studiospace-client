
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
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

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(value);
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
  const [sortBy, setSortBy] = useState("newest");

  const locations = useMemo(() => {
    return [
      "All Locations",
      ...new Set(studios.map((studio) => studio.location)),
    ];
  }, [studios]);

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

      return matchesSearch && matchesCategory && matchesLocation;
    });

    return [...results].sort((a, b) => {
      if (sortBy === "price-low") {
        return a.hourlyRate - b.hourlyRate;
      }

      if (sortBy === "price-high") {
        return b.hourlyRate - a.hourlyRate;
      }

      if (sortBy === "rating") {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }

      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
    });
  }, [studios, search, activeCategory, location, sortBy]);

  function resetFilters() {
    setSearch("");
    setCategory("All Categories");
    setLocation("All Locations");
    setSortBy("newest");

    window.history.replaceState(
      null,
      "",
      window.location.pathname
    );
  }

  return (
    <main className="min-h-screen">
      {/* ====================================
          CINEMATIC EXPLORE STUDIOS BANNER
          ==================================== */}

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

      {/* ====================================
          SEARCH, FILTERS AND RESULTS
          ==================================== */}

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
            <div>
              <label
                htmlFor="studio-category"
                className="mb-2 block text-sm font-semibold"
                style={{ color: "var(--ss-ink)" }}
              >
                Category
              </label>

              <select
                id="studio-category"
                value={activeCategory}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:border-violet-500"
                style={{
                  background: "var(--ss-surface-alt)",
                  borderColor: "var(--ss-border)",
                  color: "var(--ss-ink)",
                }}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

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
                <option value="newest">Newest First</option>
                <option value="price-low">
                  Price: Low to High
                </option>
                <option value="price-high">
                  Price: High to Low
                </option>
                <option value="rating">
                  Highest Rated
                </option>
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

        {/* Results */}

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
            {filteredStudios.map((studio) => (
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

                  <span className="absolute left-4 top-4 max-w-[78%] truncate rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#682c9b] shadow-sm">
                    {studio.category}
                  </span>

                  {typeof studio.rating === "number" &&
                    studio.rating > 0 && (
                      <span className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#251931] shadow-sm">
                        <Star
                          size={14}
                          className="fill-amber-400 text-amber-500"
                        />
                        {studio.rating.toFixed(1)}
                      </span>
                    )}
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
                        style={{ color: "var(--ss-accent)" }}
                      >
                        ৳{formatPrice(studio.hourlyRate)}
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
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
