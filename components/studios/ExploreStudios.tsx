
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  Users,
  Wallet,
  Wifi,
  X,
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
    return {
      value: demoRating,
      isDemo: true,
    };
  }

  return {
    value: null,
    isDemo: false,
  };
}

function isBookable(studio: Studio) {
  return (
    studio.isDemo !== true &&
    (studio.status == null ||
      studio.status === "active")
  );
}

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

  while (
    available.length > 0 ||
    unavailable.length > 0
  ) {
    const activeStudio = available.shift();
    const inactiveStudio = unavailable.shift();

    if (activeStudio) {
      mixed.push(activeStudio);
    }

    if (inactiveStudio) {
      mixed.push(inactiveStudio);
    }
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
        !dropdownRef.current.contains(
          event.target as Node
        )
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

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

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
          !event.currentTarget.contains(
            event.relatedTarget
          )
        ) {
          setIsOpen(false);
        }
      }}
    >
      <span
        id="studio-category-label"
        className="mb-2 block text-sm font-semibold"
        style={{
          color: "var(--ss-ink)",
        }}
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
        onClick={() =>
          setIsOpen((open) => !open)
        }
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
        <span className="truncate">
          {value}
        </span>

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
                  onClick={() =>
                    selectCategory(item)
                  }
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
    searchParams.get("category") ||
    "All Categories";

  const initialCategory = categories.includes(
    categoryFromURL
  )
    ? categoryFromURL
    : "All Categories";

  // Existing filters
  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState(initialCategory);
  const [location, setLocation] =
    useState("All Locations");
  const [sortBy, setSortBy] =
    useState("mixed");

  // New advanced filters
  const [advancedOpen, setAdvancedOpen] =
    useState(false);

  const [priceMin, setPriceMin] =
    useState(0);

  // Null means no maximum price restriction.
  const [priceMax, setPriceMax] =
    useState<number | null>(null);

  const [minimumCapacity, setMinimumCapacity] =
    useState(0);

  const [selectedAmenities, setSelectedAmenities] =
    useState<string[]>([]);

  const [availabilityFilter, setAvailabilityFilter] =
    useState("all");

  // Available locations
  const locations = useMemo(
    () => [
      "All Locations",
      ...new Set(
        studios.map((studio) => studio.location)
      ),
    ],
    [studios]
  );

  // Available amenities are read from actual studio data.
  const amenities = useMemo(() => {
    const amenityMap = new Map<string, string>();

    for (const studio of studios) {
      for (const amenity of studio.amenities || []) {
        if (
          typeof amenity !== "string" ||
          !amenity.trim()
        ) {
          continue;
        }

        const cleanName = amenity.trim();
        const key = cleanName.toLowerCase();

        if (!amenityMap.has(key)) {
          amenityMap.set(key, cleanName);
        }
      }
    }

    return [...amenityMap.values()].sort(
      (a, b) => a.localeCompare(b)
    );
  }, [studios]);

  const highestPrice = useMemo(() => {
    const maximum = Math.max(
      0,
      ...studios.map(
        (studio) =>
          Number(studio.hourlyRate) || 0
      )
    );

    return Math.max(
      50,
      Math.ceil(maximum / 10) * 10
    );
  }, [studios]);

  const highestCapacity = useMemo(() => {
    return Math.max(
      1,
      ...studios.map(
        (studio) =>
          Number(studio.maxCapacity) || 0
      )
    );
  }, [studios]);

  const effectiveMaximum =
    priceMax === null
      ? highestPrice
      : Math.min(priceMax, highestPrice);

  const effectiveMinimum = Math.min(
    priceMin,
    effectiveMaximum
  );

  const activeCategory =
    searchParams.has("category")
      ? category === initialCategory
        ? categoryFromURL
        : category
      : category;

  // Count active advanced filters.
  const advancedFilterCount =
    Number(priceMin > 0) +
    Number(
      priceMax !== null &&
        priceMax < highestPrice
    ) +
    Number(minimumCapacity > 0) +
    selectedAmenities.length +
    Number(availabilityFilter !== "all");

  // Filter and sort studios
  const filteredStudios = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    const results = studios.filter((studio) => {
      const matchesSearch =
        studio.title
          .toLowerCase()
          .includes(searchText) ||
        studio.location
          .toLowerCase()
          .includes(searchText) ||
        studio.category
          .toLowerCase()
          .includes(searchText) ||
        studio.overview
          ?.toLowerCase()
          .includes(searchText) === true;

      const matchesCategory =
        activeCategory === "All Categories" ||
        studio.category === activeCategory;

      const matchesLocation =
        location === "All Locations" ||
        studio.location === location;

      const hourlyRate =
        Number(studio.hourlyRate) || 0;

      const matchesPrice =
        hourlyRate >= effectiveMinimum &&
        hourlyRate <= effectiveMaximum;

      const matchesCapacity =
        (Number(studio.maxCapacity) || 0) >=
        minimumCapacity;

      // All selected amenities must be included.
      const studioAmenities = new Set(
        (studio.amenities || [])
          .filter(
            (item): item is string =>
              typeof item === "string"
          )
          .map((item) =>
            item.trim().toLowerCase()
          )
      );

      const matchesAmenities =
        selectedAmenities.every((amenity) =>
          studioAmenities.has(
            amenity.toLowerCase()
          )
        );

      const bookable = isBookable(studio);

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "bookable" &&
          bookable) ||
        (availabilityFilter === "unavailable" &&
          !bookable);

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
    effectiveMinimum,
    effectiveMaximum,
    minimumCapacity,
    selectedAmenities,
    availabilityFilter,
  ]);

  function toggleAmenity(amenity: string) {
    setSelectedAmenities((current) => {
      if (current.includes(amenity)) {
        return current.filter(
          (item) => item !== amenity
        );
      }

      return [...current, amenity];
    });
  }

  function resetAdvancedFilters() {
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
    resetAdvancedFilters();

    window.history.replaceState(
      null,
      "",
      window.location.pathname
    );
  }

  const filterInputStyle = {
    background: "var(--ss-surface-alt)",
    borderColor: "var(--ss-border)",
    color: "var(--ss-ink)",
  };

  return (
    <main className="min-h-screen">
      {/* ======================================
          EXPLORE STUDIOS BANNER
          ====================================== */}

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

      {/* ======================================
          STUDIO SEARCH AND FILTERS
          ====================================== */}

      <section className="mx-auto max-w-7xl px-5 py-12 md:py-16">
        <div
          className="rounded-[22px] border p-5 shadow-sm sm:p-6"
          style={{
            background: "var(--ss-surface)",
            borderColor: "var(--ss-border)",
            boxShadow: "var(--ss-shadow)",
          }}
        >
          {/* Search */}
          <div className="relative">
            <Search
              size={19}
              aria-hidden="true"
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{
                color: "var(--ss-muted)",
              }}
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
              style={filterInputStyle}
            />
          </div>

          {/* Existing main filters */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CategoryDropdown
              value={activeCategory}
              onChange={setCategory}
            />

            {/* Location */}
            <div>
              <label
                htmlFor="studio-location"
                className="mb-2 block text-sm font-semibold"
                style={{
                  color: "var(--ss-ink)",
                }}
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
                style={filterInputStyle}
              >
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

            {/* Sort */}
            <div>
              <label
                htmlFor="studio-sort"
                className="mb-2 block text-sm font-semibold"
                style={{
                  color: "var(--ss-ink)",
                }}
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
                style={filterInputStyle}
              >
                <option value="mixed">
                  Mixed Studios
                </option>

                <option value="newest">
                  Newest First
                </option>

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

            {/* Reset */}
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

          {/* Advanced filter toggle */}
          <div
            className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5"
            style={{
              borderColor: "var(--ss-border)",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setAdvancedOpen((current) => !current)
              }
              aria-expanded={advancedOpen}
              aria-controls="advanced-studio-filters"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800"
            >
              <SlidersHorizontal size={17} />
              Advanced Filters

              {advancedFilterCount > 0 && (
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-violet-700">
                  {advancedFilterCount}
                </span>
              )}

              <ChevronDown
                size={16}
                className={`transition-transform ${
                  advancedOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <span
              className="text-xs"
              style={{
                color: "var(--ss-muted)",
              }}
            >
              {filteredStudios.length} matching{" "}
              {filteredStudios.length === 1
                ? "studio"
                : "studios"}
            </span>
          </div>

          {/* ==================================
              ADVANCED FILTER PANEL
              ================================== */}

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
                  <h3
                    className="text-lg font-extrabold"
                    style={{
                      color: "var(--ss-ink)",
                    }}
                  >
                    Refine Your Studio Search
                  </h3>

                  <p
                    className="mt-1 text-xs"
                    style={{
                      color: "var(--ss-muted)",
                    }}
                  >
                    Choose your budget, group size,
                    amenities, and listing availability.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetAdvancedFilters}
                  className="inline-flex items-center gap-2 rounded-lg border border-violet-300/40 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-500/10 dark:text-violet-300"
                >
                  <RotateCcw size={14} />
                  Clear Advanced
                </button>
              </div>

              {/* Price and capacity */}
              <div className="grid gap-7 lg:grid-cols-2">
                {/* Price range */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Wallet
                      size={18}
                      className="text-violet-600 dark:text-violet-300"
                    />
                    <h4
                      className="text-sm font-bold"
                      style={{
                        color: "var(--ss-ink)",
                      }}
                    >
                      Hourly Price Range
                    </h4>
                  </div>

                  <div
                    className="flex items-center justify-between gap-3 text-sm font-bold"
                    style={{
                      color: "var(--ss-ink)",
                    }}
                  >
                    <span>
                      ${formatPrice(effectiveMinimum)}
                    </span>

                    <span>
                      ${formatPrice(effectiveMaximum)}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="minimum-price"
                        className="mb-2 block text-xs"
                        style={{
                          color: "var(--ss-muted)",
                        }}
                      >
                        Minimum price
                      </label>

                      <input
                        id="minimum-price"
                        type="range"
                        min={0}
                        max={highestPrice}
                        step={1}
                        value={effectiveMinimum}
                        onChange={(event) =>
                          setPriceMin(
                            Math.min(
                              Number(event.target.value),
                              effectiveMaximum
                            )
                          )
                        }
                        className="w-full cursor-pointer accent-violet-700"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="maximum-price"
                        className="mb-2 block text-xs"
                        style={{
                          color: "var(--ss-muted)",
                        }}
                      >
                        Maximum price
                      </label>

                      <input
                        id="maximum-price"
                        type="range"
                        min={0}
                        max={highestPrice}
                        step={1}
                        value={effectiveMaximum}
                        onChange={(event) => {
                          const value = Math.max(
                            Number(event.target.value),
                            effectiveMinimum
                          );

                          setPriceMax(
                            value >= highestPrice
                              ? null
                              : value
                          );
                        }}
                        className="w-full cursor-pointer accent-violet-700"
                      />
                    </div>
                  </div>

                  <p
                    className="text-xs"
                    style={{
                      color: "var(--ss-muted)",
                    }}
                  >
                    Prices are shown in USD per hour.
                  </p>
                </div>

                {/* Capacity */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users
                      size={18}
                      className="text-violet-600 dark:text-violet-300"
                    />
                    <h4
                      className="text-sm font-bold"
                      style={{
                        color: "var(--ss-ink)",
                      }}
                    >
                      Studio Capacity
                    </h4>
                  </div>

                  <div>
                    <label
                      htmlFor="minimum-capacity"
                      className="mb-2 block text-xs"
                      style={{
                        color: "var(--ss-muted)",
                      }}
                    >
                      Minimum number of people
                    </label>

                    <select
                      id="minimum-capacity"
                      value={minimumCapacity}
                      onChange={(event) =>
                        setMinimumCapacity(
                          Number(event.target.value)
                        )
                      }
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-violet-500"
                      style={filterInputStyle}
                    >
                      <option value={0}>
                        Any Capacity
                      </option>

                      {Array.from(
                        {
                          length: highestCapacity,
                        },
                        (_, index) => index + 1
                      ).map((capacity) => (
                        <option
                          key={capacity}
                          value={capacity}
                        >
                          {capacity}+{" "}
                          {capacity === 1
                            ? "person"
                            : "people"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p
                    className="text-xs"
                    style={{
                      color: "var(--ss-muted)",
                    }}
                  >
                    Only studios that can accommodate
                    your group will be shown.
                  </p>
                </div>
              </div>

              {/* Amenities */}
              <div
                className="mt-7 border-t pt-6"
                style={{
                  borderColor: "var(--ss-border)",
                }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Wifi
                    size={18}
                    className="text-violet-600 dark:text-violet-300"
                  />

                  <h4
                    className="text-sm font-bold"
                    style={{
                      color: "var(--ss-ink)",
                    }}
                  >
                    Studio Amenities
                  </h4>
                </div>

                {amenities.length === 0 ? (
                  <p
                    className="text-sm"
                    style={{
                      color: "var(--ss-muted)",
                    }}
                  >
                    No amenities are listed yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity) => {
                      const selected =
                        selectedAmenities.includes(
                          amenity
                        );

                      return (
                        <button
                          key={amenity}
                          type="button"
                          aria-pressed={selected}
                          onClick={() =>
                            toggleAmenity(amenity)
                          }
                          className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
                            selected
                              ? "border-violet-700 bg-violet-700 text-white"
                              : "border-violet-300/40 bg-violet-500/5 text-violet-700 hover:bg-violet-500/15 dark:text-violet-200"
                          }`}
                        >
                          {selected && (
                            <Check size={14} />
                          )}

                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                )}

                <p
                  className="mt-3 text-xs"
                  style={{
                    color: "var(--ss-muted)",
                  }}
                >
                  Selected studios must include all
                  amenities you choose.
                </p>
              </div>

              {/* Availability */}
              <div
                className="mt-7 border-t pt-6"
                style={{
                  borderColor: "var(--ss-border)",
                }}
              >
                <h4
                  className="mb-4 text-sm font-bold"
                  style={{
                    color: "var(--ss-ink)",
                  }}
                >
                  Booking Availability
                </h4>

                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      value: "all",
                      label: "All Studios",
                    },
                    {
                      value: "bookable",
                      label: "Bookable Only",
                    },
                    {
                      value: "unavailable",
                      label: "Unavailable Only",
                    },
                  ].map((option) => {
                    const active =
                      availabilityFilter ===
                      option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setAvailabilityFilter(
                            option.value
                          )
                        }
                        className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                          active
                            ? "border-violet-700 bg-violet-700 text-white"
                            : "border-violet-300/40 bg-violet-500/5 text-violet-700 hover:bg-violet-500/15 dark:text-violet-200"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected filter chips */}
              {advancedFilterCount > 0 && (
                <div
                  className="mt-7 flex flex-wrap items-center gap-2 border-t pt-5"
                  style={{
                    borderColor: "var(--ss-border)",
                  }}
                >
                  <span
                    className="mr-1 text-xs font-semibold"
                    style={{
                      color: "var(--ss-muted)",
                    }}
                  >
                    Active Filters:
                  </span>

                  {priceMin > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setPriceMin(0)
                      }
                      className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-800 dark:bg-violet-500/20 dark:text-violet-200"
                    >
                      Min ${formatPrice(effectiveMinimum)}
                      <X size={13} />
                    </button>
                  )}

                  {priceMax !== null &&
                    priceMax < highestPrice && (
                      <button
                        type="button"
                        onClick={() =>
                          setPriceMax(null)
                        }
                        className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-800 dark:bg-violet-500/20 dark:text-violet-200"
                      >
                        Max ${formatPrice(effectiveMaximum)}
                        <X size={13} />
                      </button>
                    )}

                  {minimumCapacity > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setMinimumCapacity(0)
                      }
                      className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-800 dark:bg-violet-500/20 dark:text-violet-200"
                    >
                      {minimumCapacity}+ people
                      <X size={13} />
                    </button>
                  )}

                  {selectedAmenities.map(
                    (amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() =>
                          toggleAmenity(amenity)
                        }
                        className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-800 dark:bg-violet-500/20 dark:text-violet-200"
                      >
                        {amenity}
                        <X size={13} />
                      </button>
                    )
                  )}

                  {availabilityFilter !==
                    "all" && (
                    <button
                      type="button"
                      onClick={() =>
                        setAvailabilityFilter("all")
                      }
                      className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-800 dark:bg-violet-500/20 dark:text-violet-200"
                    >
                      {availabilityFilter ===
                      "bookable"
                        ? "Bookable"
                        : "Unavailable"}
                      <X size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======================================
            RESULTS HEADER
            ====================================== */}

        <div className="my-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="ss-kicker">
              <Sparkles size={14} />
              Creative Spaces
            </span>

            <h2 className="ss-heading mt-4">
              Explore Studio Listings
            </h2>

            <p
              className="mt-2 text-sm"
              style={{
                color: "var(--ss-muted)",
              }}
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

        {/* ======================================
            STUDIO CARDS
            ====================================== */}

        {filteredStudios.length === 0 ? (
          <div className="ss-card px-6 py-20 text-center">
            <Building2
              size={52}
              className="mx-auto"
              style={{
                color: "var(--ss-accent)",
              }}
            />

            <h3
              className="mt-5 text-xl font-bold"
              style={{
                color: "var(--ss-ink)",
              }}
            >
              No studios found
            </h3>

            <p
              className="mt-3 text-sm"
              style={{
                color: "var(--ss-muted)",
              }}
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
                  {/* Image */}
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

                    {/* Category */}
                    <span className="absolute left-4 top-4 max-w-[78%] truncate rounded-full border border-white/20 bg-[#f8f2ff]/95 px-3 py-1.5 text-xs font-bold text-[#682c9b] shadow-sm dark:!border-violet-300/30 dark:!bg-[#21172f]/95 dark:!text-white">
                      {studio.category}
                    </span>

                    {/* Rating */}
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

                  {/* Card content */}
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <Link
                      href={`/studios/${studio._id}`}
                    >
                      <h3
                        className="line-clamp-2 text-lg font-extrabold transition group-hover:opacity-75"
                        style={{
                          color: "var(--ss-ink)",
                        }}
                      >
                        {studio.title}
                      </h3>
                    </Link>

                    {/* Location */}
                    <div
                      className="mt-3 flex items-start gap-2 text-sm"
                      style={{
                        color: "var(--ss-muted)",
                      }}
                    >
                      <MapPin
                        size={16}
                        className="mt-0.5 shrink-0"
                      />

                      <span>
                        {studio.location}
                      </span>
                    </div>

                    {/* Capacity */}
                    <div
                      className="mt-3 flex items-center gap-2 text-xs"
                      style={{
                        color: "var(--ss-muted)",
                      }}
                    >
                      <Users size={15} />

                      <span>
                        Up to {studio.maxCapacity}{" "}
                        {studio.maxCapacity === 1
                          ? "person"
                          : "people"}
                      </span>
                    </div>

                    {/* Price and action */}
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
                          ${formatPrice(
                            studio.hourlyRate
                          )}
                        </span>

                        <span
                          className="ml-1 text-xs"
                          style={{
                            color: "var(--ss-muted)",
                          }}
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
