
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  RotateCcw,
  Building2,
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

export default function ExploreStudios({
  studios,
}: ExploreStudiosProps) {
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get("category") || "All Categories";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(
    categories.includes(initialCategory)
      ? initialCategory
      : "All Categories"
  );
  const [location, setLocation] = useState("All Locations");
  const [sortBy, setSortBy] = useState("newest");

  const locations = useMemo(() => {
    return [
      "All Locations",
      ...new Set(studios.map((studio) => studio.location)),
    ];
  }, [studios]);

  const filteredStudios = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    const filtered = studios.filter((studio) => {
      const matchesSearch =
        studio.title.toLowerCase().includes(searchText) ||
        studio.location.toLowerCase().includes(searchText) ||
        studio.category.toLowerCase().includes(searchText);

      const matchesCategory =
        category === "All Categories" ||
        studio.category === category;

      const matchesLocation =
        location === "All Locations" ||
        studio.location === location;

      return matchesSearch && matchesCategory && matchesLocation;
    });

    return filtered.sort((a, b) => {
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
  }, [studios, search, category, location, sortBy]);

  function resetFilters() {
    setSearch("");
    setCategory("All Categories");
    setLocation("All Locations");
    setSortBy("newest");
  }

  return (
    <main className="min-h-screen bg-[#f8f7fd]">
      {/* Page heading */}
      <section className="bg-gradient-to-r from-[#191136] via-[#2b185c] to-[#111026] px-5 py-20 text-white">
        <div className="mx-auto max-w-7xl text-center">
          <span className="inline-block rounded-full border border-violet-400/30 bg-violet-500/20 px-4 py-2 text-sm font-medium text-violet-200">
            Find Your Perfect Creative Space
          </span>

          <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-5xl">
            Explore Studios
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-slate-300">
            Discover photography studios, podcast lounges,
            music suites, film stages, and creative workspaces
            for your next project.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        {/* Search and filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search studios by name, category or location..."
              aria-label="Search studios"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-violet-500"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Category */}
            <div>
              <label
                htmlFor="studio-category"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Category
              </label>

              <select
                id="studio-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-violet-500"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="studio-location"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Location
              </label>

              <select
                id="studio-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-violet-500"
              >
                {locations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting */}
            <div>
              <label
                htmlFor="studio-sort"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Sort By
              </label>

              <select
                id="studio-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-violet-500"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Reset */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
              >
                <RotateCcw size={16} />
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results heading */}
        <div className="my-9 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              Available Studios
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredStudios.length}{" "}
              {filteredStudios.length === 1 ? "studio" : "studios"} found
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            <SlidersHorizontal size={16} />
            Browse Spaces
          </div>
        </div>

        {/* Studio results */}
        {filteredStudios.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center">
            <Building2 className="mx-auto h-14 w-14 text-violet-400" />

            <h3 className="mt-5 text-xl font-bold text-slate-900">
              No studios found
            </h3>

            <p className="mt-3 text-slate-500">
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 rounded-lg bg-violet-700 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-800"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStudios.map((studio) => (
              <article
                key={studio._id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-56 overflow-hidden bg-slate-100">
                  <Image
                    src={studio.image}
                    alt={studio.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />

                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-violet-700">
                    {studio.category}
                  </span>

                  {typeof studio.rating === "number" && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm">
                      <Star
                        size={14}
                        className="fill-amber-400 text-amber-400"
                      />
                      {studio.rating}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-950 group-hover:text-violet-700">
                    {studio.title}
                  </h3>

                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin size={16} />
                    {studio.location}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                    <div>
                      <span className="text-2xl font-extrabold text-violet-700">
                        ${studio.hourlyRate}
                      </span>

                      <span className="text-sm text-slate-500">
                        {" "}/ hour
                      </span>
                    </div>

                    <Link
                      href={`/studios/${studio._id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800"
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
