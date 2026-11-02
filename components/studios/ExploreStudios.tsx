
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Heart,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  Wallet,
  Wifi,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Studio } from "@/types/studio";
import FavoriteButton from "@/components/studios/FavoriteButton";

interface Props {
  studios: Studio[];
}

const MAX_COMPARE = 3;

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

function price(value: number) {
  return Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function ratingFor(studio: Studio) {
  if (typeof studio.rating === "number" && studio.rating > 0) {
    return { value: studio.rating, sample: false };
  }

  const sample = demoRatings[studio.title];

  return sample === undefined
    ? { value: null, sample: false }
    : { value: sample, sample: true };
}

function bookable(studio: Studio) {
  return (
    studio.isDemo !== true &&
    (studio.status == null || studio.status === "active")
  );
}

function studioOrderKey(studio: Studio) {
  let hash = 0;

  for (const char of studio._id) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }

  return hash >>> 0;
}

function mixedStudios(items: Studio[]) {
  const available = items
    .filter(bookable)
    .sort((a, b) => studioOrderKey(a) - studioOrderKey(b));

  const unavailable = items
    .filter((studio) => !bookable(studio))
    .sort((a, b) => studioOrderKey(a) - studioOrderKey(b));

  const mixed: Studio[] = [];

  while (available.length || unavailable.length) {
    const a = available.shift();
    const b = unavailable.shift();

    if (a) mixed.push(a);
    if (b) mixed.push(b);
  }

  return mixed;
}

function CategoryDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function outside(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    }

    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);

    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <div
      ref={wrapper}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
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
        ref={button}
        id="studio-category"
        type="button"
        aria-labelledby="studio-category-label studio-category"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls="studio-category-options"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium outline-none transition hover:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-500/40"
        style={{
          background: "var(--ss-surface-alt)",
          borderColor: open ? "var(--ss-accent)" : "var(--ss-border)",
          color: "var(--ss-ink)",
        }}
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          size={17}
          className={`shrink-0 text-violet-600 transition-transform dark:text-violet-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          id="studio-category-options"
          role="listbox"
          aria-labelledby="studio-category-label"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-violet-200 bg-[#fffaff] p-1.5 shadow-[0_15px_45px_rgba(87,33,138,0.20)] dark:border-violet-400/30 dark:bg-[#21172f]"
        >
          <div className="max-h-[310px] overflow-y-auto">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={value === item}
                onClick={() => {
                  onChange(item);
                  setOpen(false);
                  button.current?.focus();
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  value === item
                    ? "bg-violet-100 text-violet-800 dark:bg-violet-500/25 dark:text-white"
                    : "text-[#402658] hover:bg-violet-50 dark:text-[#e1d1ef] dark:hover:bg-violet-500/15"
                }`}
              >
                {item}
                {value === item && <Check size={17} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExploreStudios({ studios }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get("category") || "All Categories";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(
    categories.includes(initialCategory)
      ? initialCategory
      : "All Categories"
  );
  const [location, setLocation] = useState("All Locations");
  const [sortBy, setSortBy] = useState("mixed");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [minimumCapacity, setMinimumCapacity] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const [compareIds, setCompareIds] = useState<string[]>([]);

  const locations = useMemo(
    () => ["All Locations", ...new Set(studios.map((studio) => studio.location))],
    [studios]
  );

  const amenities = useMemo(() => {
    const names = new Map<string, string>();

    for (const studio of studios) {
      for (const name of studio.amenities || []) {
        if (typeof name !== "string" || !name.trim()) continue;

        const clean = name.trim();
        if (!names.has(clean.toLowerCase())) {
          names.set(clean.toLowerCase(), clean);
        }
      }
    }

    return [...names.values()].sort((a, b) => a.localeCompare(b));
  }, [studios]);

  const highestPrice = useMemo(
    () =>
      Math.max(
        50,
        Math.ceil(
          Math.max(0, ...studios.map((studio) => Number(studio.hourlyRate) || 0)) /
            10
        ) * 10
      ),
    [studios]
  );

  const highestCapacity = useMemo(
    () => Math.max(1, ...studios.map((studio) => Number(studio.maxCapacity) || 0)),
    [studios]
  );

  const maximum = priceMax === null ? highestPrice : Math.min(priceMax, highestPrice);
  const minimum = Math.min(priceMin, maximum);

  const advancedCount =
    Number(priceMin > 0) +
    Number(priceMax !== null && priceMax < highestPrice) +
    Number(minimumCapacity > 0) +
    selectedAmenities.length +
    Number(availabilityFilter !== "all");

  const filteredStudios = useMemo(() => {
    const term = search.trim().toLowerCase();

    const items = studios.filter((studio) => {
      const matchesSearch =
        studio.title.toLowerCase().includes(term) ||
        studio.location.toLowerCase().includes(term) ||
        studio.category.toLowerCase().includes(term) ||
        (studio.overview || "").toLowerCase().includes(term);

      const matchesCategory =
        category === "All Categories" || studio.category === category;

      const matchesLocation =
        location === "All Locations" || studio.location === location;

      const matchesPrice =
        Number(studio.hourlyRate) >= minimum &&
        Number(studio.hourlyRate) <= maximum;

      const matchesCapacity =
        Number(studio.maxCapacity) >= minimumCapacity;

      const ownedAmenities = new Set(
        (studio.amenities || []).map((amenity) => amenity.trim().toLowerCase())
      );

      const matchesAmenities = selectedAmenities.every((amenity) =>
        ownedAmenities.has(amenity.toLowerCase())
      );

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "bookable" && bookable(studio)) ||
        (availabilityFilter === "unavailable" && !bookable(studio));

      return (
        matchesSearch &&
        matchesCategory &&
        matchesLocation &&
        matchesPrice &&
        matchesCapacity &&
        matchesAmenities &&
        matchesAvailability
      );
    });

    if (sortBy === "mixed") return mixedStudios(items);

    return [...items].sort((a, b) => {
      if (sortBy === "price-low") return a.hourlyRate - b.hourlyRate;
      if (sortBy === "price-high") return b.hourlyRate - a.hourlyRate;
      if (sortBy === "rating") {
        return (ratingFor(b).value ?? 0) - (ratingFor(a).value ?? 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    studios,
    search,
    category,
    location,
    sortBy,
    minimum,
    maximum,
    minimumCapacity,
    selectedAmenities,
    availabilityFilter,
  ]);

  const selectedStudios = compareIds
    .map((id) => studios.find((studio) => studio._id === id))
    .filter((studio): studio is Studio => Boolean(studio));

  function toggleCompare(studio: Studio) {
    if (compareIds.includes(studio._id)) {
      setCompareIds((current) => current.filter((id) => id !== studio._id));
      return;
    }

    if (compareIds.length >= MAX_COMPARE) {
      toast.info("You can compare up to three studios.");
      return;
    }

    setCompareIds((current) => [...current, studio._id]);
  }

  function openComparison() {
    if (compareIds.length < 2) {
      toast.info("Select at least two studios to compare.");
      return;
    }

    const params = new URLSearchParams();
    params.set("studios", compareIds.join(","));
    router.push(`/compare?${params.toString()}`);
  }

  function resetAdvanced() {
    setPriceMin(0);
    setPriceMax(null);
    setMinimumCapacity(0);
    setSelectedAmenities([]);
    setAvailabilityFilter("all");
  }

  function resetFilters() {
    setSearch("");
    setCategory("All Categories");
    setLocation("All Locations");
    setSortBy("mixed");
    resetAdvanced();
    window.history.replaceState(null, "", window.location.pathname);
  }

  function toggleAmenity(amenity: string) {
    setSelectedAmenities((current) =>
      current.includes(amenity)
        ? current.filter((item) => item !== amenity)
        : [...current, amenity]
    );
  }

  const inputStyle = {
    background: "var(--ss-surface-alt)",
    borderColor: "var(--ss-border)",
    color: "var(--ss-ink)",
  };

  const chipClass =
    "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition";

  return (
    <main className="min-h-screen">
      <section
        aria-labelledby="explore-heading"
        className="relative isolate flex min-h-[360px] items-center justify-center overflow-hidden px-5 py-20 text-center text-white sm:min-h-[390px]"
        style={{
          backgroundImage:
            "linear-gradient(90deg,rgba(13,8,29,.88),rgba(30,13,54,.78),rgba(17,10,36,.72)),url('/images/studios/explore-banner.jpg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundColor: "#151026",
        }}
      >
        <div className="relative z-10 mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-white/10 px-5 py-2 text-xs font-bold text-violet-100 backdrop-blur-md">
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
            Discover inspiring photography studios, podcast lounges,
            music suites, film stages, and creative workspaces for your next project.
          </p>
          <div className="mx-auto mt-7 h-1 w-20 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" />
        </div>
      </section>

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
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: "var(--ss-muted)" }}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search studios by name, category or location..."
              aria-label="Search studios"
              className="w-full rounded-xl border py-3 pl-12 pr-4 text-sm outline-none focus:border-violet-500"
              style={inputStyle}
            />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CategoryDropdown value={category} onChange={setCategory} />

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
                onChange={(event) => setLocation(event.target.value)}
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:border-violet-500"
                style={inputStyle}
              >
                {locations.map((item) => (
                  <option key={item} value={item}>{item}</option>
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
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:border-violet-500"
                style={inputStyle}
              >
                <option value="mixed">Mixed Studios</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
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

          <div
            className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5"
            style={{ borderColor: "var(--ss-border)" }}
          >
            <button
              type="button"
              onClick={() => setAdvancedOpen((current) => !current)}
              aria-expanded={advancedOpen}
              aria-controls="advanced-studio-filters"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800"
            >
              <SlidersHorizontal size={17} />
              Advanced Filters
              {advancedCount > 0 && (
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-violet-700">
                  {advancedCount}
                </span>
              )}
              <ChevronDown
                size={16}
                className={`transition-transform ${advancedOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/favorites"
                className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:underline dark:text-violet-300"
              >
                <Heart size={16} /> My Favorites
              </Link>
              <Link
                href="/compare"
                className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:underline dark:text-violet-300"
              >
                <ArrowLeftRight size={16} /> Compare Studios
              </Link>
              <span className="text-xs" style={{ color: "var(--ss-muted)" }}>
                {filteredStudios.length} matching studios
              </span>
            </div>
          </div>

          {advancedOpen && (
            <div
              id="advanced-studio-filters"
              className="mt-5 rounded-2xl border p-5 sm:p-6"
              style={{
                background: "var(--ss-surface-alt)",
                borderColor: "var(--ss-border)",
              }}
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold" style={{ color: "var(--ss-ink)" }}>
                    Refine Your Studio Search
                  </h3>
                  <p className="mt-1 text-xs" style={{ color: "var(--ss-muted)" }}>
                    Choose your budget, group size, amenities, and listing availability.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetAdvanced}
                  className="inline-flex items-center gap-2 rounded-lg border border-violet-300/40 px-3 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300"
                >
                  <RotateCcw size={14} /> Clear Advanced
                </button>
              </div>

              <div className="grid gap-7 lg:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--ss-ink)" }}>
                    <Wallet size={18} className="text-violet-600" />
                    Hourly Price Range
                  </h4>
                  <div className="flex justify-between text-sm font-bold" style={{ color: "var(--ss-ink)" }}>
                    <span>${price(minimum)}</span>
                    <span>${price(maximum)}</span>
                  </div>
                  <div>
                    <label htmlFor="minimum-price" className="mb-2 block text-xs" style={{ color: "var(--ss-muted)" }}>
                      Minimum price
                    </label>
                    <input
                      id="minimum-price"
                      type="range"
                      min={0}
                      max={highestPrice}
                      step={1}
                      value={minimum}
                      onChange={(event) =>
                        setPriceMin(Math.min(Number(event.target.value), maximum))
                      }
                      className="w-full cursor-pointer accent-violet-700"
                    />
                  </div>
                  <div>
                    <label htmlFor="maximum-price" className="mb-2 block text-xs" style={{ color: "var(--ss-muted)" }}>
                      Maximum price
                    </label>
                    <input
                      id="maximum-price"
                      type="range"
                      min={0}
                      max={highestPrice}
                      step={1}
                      value={maximum}
                      onChange={(event) => {
                        const value = Math.max(Number(event.target.value), minimum);
                        setPriceMax(value >= highestPrice ? null : value);
                      }}
                      className="w-full cursor-pointer accent-violet-700"
                    />
                  </div>
                  <p className="text-xs" style={{ color: "var(--ss-muted)" }}>
                    Prices shown in USD per hour.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--ss-ink)" }}>
                    <Users size={18} className="text-violet-600" />
                    Studio Capacity
                  </h4>
                  <label htmlFor="minimum-capacity" className="block text-xs" style={{ color: "var(--ss-muted)" }}>
                    Minimum number of people
                  </label>
                  <select
                    id="minimum-capacity"
                    value={minimumCapacity}
                    onChange={(event) => setMinimumCapacity(Number(event.target.value))}
                    className="w-full rounded-xl border px-4 py-3 text-sm"
                    style={inputStyle}
                  >
                    <option value={0}>Any Capacity</option>
                    {Array.from({ length: highestCapacity }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>
                        {count}+ {count === 1 ? "person" : "people"}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs" style={{ color: "var(--ss-muted)" }}>
                    Only studios that fit your group will be shown.
                  </p>
                </div>
              </div>

              <div className="mt-7 border-t pt-6" style={{ borderColor: "var(--ss-border)" }}>
                <h4 className="mb-4 flex items-center gap-2 text-sm font-bold" style={{ color: "var(--ss-ink)" }}>
                  <Wifi size={18} className="text-violet-600" />
                  Studio Amenities
                </h4>
                {amenities.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--ss-muted)" }}>
                    No amenities listed yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity) => {
                      const selected = selectedAmenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleAmenity(amenity)}
                          className={`${chipClass} ${
                            selected
                              ? "border-violet-700 bg-violet-700 text-white"
                              : "border-violet-300/40 bg-violet-500/5 text-violet-700 dark:text-violet-200"
                          }`}
                        >
                          {selected && <Check size={14} />}
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="mt-3 text-xs" style={{ color: "var(--ss-muted)" }}>
                  Selected studios must include all chosen amenities.
                </p>
              </div>

              <div className="mt-7 border-t pt-6" style={{ borderColor: "var(--ss-border)" }}>
                <h4 className="mb-4 text-sm font-bold" style={{ color: "var(--ss-ink)" }}>
                  Booking Availability
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "All Studios" },
                    { value: "bookable", label: "Bookable Only" },
                    { value: "unavailable", label: "Unavailable Only" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setAvailabilityFilter(option.value)}
                      aria-pressed={availabilityFilter === option.value}
                      className={`${chipClass} ${
                        availabilityFilter === option.value
                          ? "border-violet-700 bg-violet-700 text-white"
                          : "border-violet-300/40 bg-violet-500/5 text-violet-700 dark:text-violet-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {advancedCount > 0 && (
                <div className="mt-7 flex flex-wrap items-center gap-2 border-t pt-5" style={{ borderColor: "var(--ss-border)" }}>
                  <span className="text-xs font-semibold" style={{ color: "var(--ss-muted)" }}>
                    Active Filters:
                  </span>
                  {priceMin > 0 && (
                    <button type="button" onClick={() => setPriceMin(0)} className={chipClass} style={inputStyle}>
                      Min ${price(minimum)} <X size={13} />
                    </button>
                  )}
                  {priceMax !== null && priceMax < highestPrice && (
                    <button type="button" onClick={() => setPriceMax(null)} className={chipClass} style={inputStyle}>
                      Max ${price(maximum)} <X size={13} />
                    </button>
                  )}
                  {minimumCapacity > 0 && (
                    <button type="button" onClick={() => setMinimumCapacity(0)} className={chipClass} style={inputStyle}>
                      {minimumCapacity}+ people <X size={13} />
                    </button>
                  )}
                  {selectedAmenities.map((amenity) => (
                    <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)} className={chipClass} style={inputStyle}>
                      {amenity} <X size={13} />
                    </button>
                  ))}
                  {availabilityFilter !== "all" && (
                    <button type="button" onClick={() => setAvailabilityFilter("all")} className={chipClass} style={inputStyle}>
                      {availabilityFilter === "bookable" ? "Bookable" : "Unavailable"} <X size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="my-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="ss-kicker">
              <Sparkles size={14} /> Creative Spaces
            </span>
            <h2 className="ss-heading mt-4">Explore Studio Listings</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--ss-muted)" }}>
              {filteredStudios.length}{" "}
              {filteredStudios.length === 1 ? "studio" : "studios"} found
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/favorites"
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"
              style={{
                borderColor: "var(--ss-border)",
                color: "var(--ss-accent)",
                background: "var(--ss-surface)",
              }}
            >
              <Heart size={16} /> My Favorites
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"
              style={{
                borderColor: "var(--ss-border)",
                color: "var(--ss-accent)",
                background: "var(--ss-surface)",
              }}
            >
              <ArrowLeftRight size={16} /> Compare Studios
            </Link>
          </div>
        </div>

        {filteredStudios.length === 0 ? (
          <div className="ss-card px-6 py-20 text-center">
            <Building2 size={52} className="mx-auto text-violet-600" />
            <h3 className="mt-5 text-xl font-bold" style={{ color: "var(--ss-ink)" }}>
              No studios found
            </h3>
            <p className="mt-3 text-sm" style={{ color: "var(--ss-muted)" }}>
              Try changing your search or filters.
            </p>
            <button type="button" onClick={resetFilters} className="ss-cta-primary mt-6">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStudios.map((studio) => {
              const rating = ratingFor(studio);
              const selected = compareIds.includes(studio._id);

              return (
                <article key={studio._id} className="ss-card group flex h-full flex-col">
                  <div className="relative h-[225px] overflow-hidden bg-violet-200/20 sm:h-[235px]">
                    <Link
                      href={`/studios/${studio._id}`}
                      aria-label={`View ${studio.title}`}
                      className="absolute inset-0"
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
                          <Building2 size={40} className="text-violet-500" />
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                    </Link>

                    <span className="pointer-events-none absolute left-4 top-4 z-10 max-w-[65%] truncate rounded-full border border-white/20 bg-[#f8f2ff]/95 px-3 py-1.5 text-xs font-bold text-[#682c9b] shadow-sm dark:border-violet-300/30 dark:bg-[#21172f]/95 dark:text-white">
                      {studio.category}
                    </span>

                    <FavoriteButton studioId={studio._id} studioTitle={studio.title} />

                    <span
                      aria-label={
                        rating.value === null
                          ? "Not yet rated"
                          : rating.sample
                            ? `Sample rating ${rating.value.toFixed(1)} out of 5`
                            : `Rated ${rating.value.toFixed(1)} out of 5`
                      }
                      className="pointer-events-none absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-violet-200/70 bg-[#f8f2ff]/95 px-3 py-1.5 text-xs font-extrabold text-[#321a49] dark:border-violet-300/40 dark:bg-[#21172f]/95 dark:text-white"
                    >
                      <Star size={15} className="fill-amber-400 text-amber-400" />
                      {rating.value === null ? "Unrated" : rating.value.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <Link href={`/studios/${studio._id}`}>
                      <h3
                        className="line-clamp-2 text-lg font-extrabold transition group-hover:opacity-75"
                        style={{ color: "var(--ss-ink)" }}
                      >
                        {studio.title}
                      </h3>
                    </Link>

                    <div className="mt-3 flex items-start gap-2 text-sm" style={{ color: "var(--ss-muted)" }}>
                      <MapPin size={16} className="mt-0.5 shrink-0" />
                      <span>{studio.location}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "var(--ss-muted)" }}>
                      <Users size={15} />
                      <span>Up to {studio.maxCapacity} people</span>
                    </div>

                    <div
                      className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-5"
                      style={{ borderColor: "var(--ss-border)", marginTop: "24px" }}
                    >
                      <div>
                        <span className="text-2xl font-extrabold" style={{ color: "var(--ss-accent)" }}>
                          ${price(studio.hourlyRate)}
                        </span>
                        <span className="ml-1 text-xs" style={{ color: "var(--ss-muted)" }}>
                          / hour
                        </span>
                      </div>

                      <Link
                        href={`/studios/${studio._id}`}
                        className="ss-cta-primary px-4 py-2.5 text-xs"
                      >
                        View Details <ArrowRight size={15} />
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCompare(studio)}
                      aria-pressed={selected}
                      className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                        selected
                          ? "border-violet-700 bg-violet-700 text-white"
                          : "border-violet-400/30 text-violet-700 hover:bg-violet-500/10 dark:text-violet-200"
                      }`}
                    >
                      {selected ? <Check size={16} /> : <ArrowLeftRight size={16} />}
                      {selected ? "Selected for Comparison" : "Add to Compare"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {compareIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[90] border-t border-violet-300/30 bg-white/95 p-4 shadow-[0_-10px_45px_rgba(0,0,0,.18)] backdrop-blur-xl dark:bg-[#21172f]/95">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-extrabold" style={{ color: "var(--ss-ink)" }}>
                Compare Studios ({compareIds.length}/{MAX_COMPARE})
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedStudios.map((studio) => (
                  <button
                    key={studio._id}
                    type="button"
                    onClick={() => toggleCompare(studio)}
                    aria-label={`Remove ${studio.title} from comparison`}
                    className="inline-flex max-w-[190px] items-center gap-1.5 rounded-full border border-violet-300/40 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-200"
                  >
                    <span className="truncate">{studio.title}</span>
                    <X size={13} className="shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="rounded-xl border border-violet-300/40 px-4 py-2.5 text-sm font-semibold text-violet-700 dark:text-violet-200"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={compareIds.length < 2}
                onClick={openComparison}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Compare Now <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
