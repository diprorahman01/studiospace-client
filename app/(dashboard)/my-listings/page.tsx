
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type StudioStatus = "active" | "inactive";

type OwnerStudio = {
  _id: string;
  title: string;
  category: string;
  location: string;
  overview?: string;
  image?: string;
  hourlyRate: number;
  securityDeposit?: number;
  maxCapacity?: number;
  status?: StudioStatus;
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
};

type StudioApiResponse = {
  success: boolean;
  message?: string;
  count?: number;
  data?: OwnerStudio[];
};

type ListingFilter = "all" | "active" | "inactive";

const filters: { label: string; value: ListingFilter }[] = [
  { label: "All Listings", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

function formatMoney(value: number) {
  return `৳${Number(value || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ListingStatus({ status }: { status?: StudioStatus }) {
  if (status === "inactive") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
        <Clock3 size={14} />
        Inactive
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
      <CheckCircle2 size={14} />
      Active
    </span>
  );
}

function StudioImage({
  src,
  title,
}: {
  src?: string;
  title: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div className="flex h-52 items-center justify-center bg-violet-50">
        <Building2 size={46} className="text-violet-300" />
      </div>
    );
  }

  return (
    // Image URLs may be external or local; domains are not yet configured.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      onError={() => setFailedSrc(src)}
      className="h-52 w-full object-cover"
    />
  );
}

export default function MyListingsPage() {
  const router = useRouter();

  const { data: session, isPending: checkingSession } =
    authClient.useSession();

  const userId = session?.user?.id;

  const [studios, setStudios] = useState<OwnerStudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ListingFilter>("all");

  const loadStudios = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch(
          `${API_URL}/api/studios/mine`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            signal,
          }
        );

        if (response.status === 401) {
          if (!signal?.aborted) {
            toast.error("Please log in to view your listings.");
            router.replace("/login");
          }
          return;
        }

        const result: StudioApiResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Could not load your studios."
          );
        }

        if (!signal?.aborted) {
          setStudios(result.data ?? []);
          setError("");
        }
      } catch (err) {
        if (signal?.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your listings."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [router]
  );

  useEffect(() => {
    if (checkingSession) return;

    if (!userId) {
      router.replace("/login");
      return;
    }

    const controller = new AbortController();

    // Perform the network request asynchronously.
    async function fetchInitialStudios() {
      try {
        const response = await fetch(
          `${API_URL}/api/studios/mine`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        const result: StudioApiResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Could not load your studios."
          );
        }

        if (!controller.signal.aborted) {
          setStudios(result.data ?? []);
          setError("");
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your listings."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchInitialStudios();

    return () => controller.abort();
  }, [checkingSession, userId, router]);

  async function handleRefresh() {
    if (loading || refreshing) return;

    setRefreshing(true);
    await loadStudios();
  }

  const activeCount = studios.filter(
    (studio) => studio.status !== "inactive"
  ).length;

  const inactiveCount = studios.filter(
    (studio) => studio.status === "inactive"
  ).length;

  const visibleStudios = useMemo(() => {
    const term = search.trim().toLowerCase();

    return studios.filter((studio) => {
      const status = studio.status ?? "active";

      const matchesStatus =
        filter === "all" || status === filter;

      const matchesSearch =
        !term ||
        studio.title.toLowerCase().includes(term) ||
        studio.category.toLowerCase().includes(term) ||
        studio.location.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [studios, search, filter]);

  if (checkingSession || !userId) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <LoaderCircle
          size={34}
          className="animate-spin text-violet-700"
        />
        <p className="text-sm text-slate-500">
          Checking your account...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-[#f8f7fd]">
      {/* Page header */}
      <section className="border-b border-violet-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-700">
            <Building2 size={18} />
            STUDIO MANAGEMENT
          </div>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-950 sm:text-4xl">
                My Listings
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                Manage your creative studios and review your
                published spaces in one place.
              </p>
            </div>

            <Link
              href="/add-studio"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
            >
              <Plus size={18} />
              Add New Studio
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10">
        {/* Summary cards */}
        <div className="mb-9 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total Listings",
              value: studios.length,
              icon: Building2,
              style: "bg-violet-50 text-violet-700",
            },
            {
              label: "Active Studios",
              value: activeCount,
              icon: CheckCircle2,
              style: "bg-green-50 text-green-700",
            },
            {
              label: "Inactive Studios",
              value: inactiveCount,
              icon: Clock3,
              style: "bg-slate-100 text-slate-600",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${item.style}`}
                >
                  <Icon size={22} />
                </div>

                <p className="text-sm text-slate-500">
                  {item.label}
                </p>

                <p className="mt-2 text-3xl font-extrabold text-slate-950">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filters and search */}
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  filter === item.value
                    ? "bg-violet-700 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your studios..."
                aria-label="Search your studios"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none focus:border-violet-600 sm:w-64"
              />
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl bg-white">
            <LoaderCircle
              size={34}
              className="animate-spin text-violet-700"
            />

            <p className="text-sm text-slate-500">
              Loading your studio listings...
            </p>
          </div>
        ) : error ? (
          /* Error */
          <div className="rounded-2xl border border-red-100 bg-white px-6 py-14 text-center">
            <XCircle
              size={42}
              className="mx-auto mb-4 text-red-500"
            />

            <h2 className="text-xl font-bold text-slate-950">
              Unable to load listings
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-6 rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        ) : visibleStudios.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-violet-50">
              <Building2
                size={36}
                className="text-violet-600"
              />
            </div>

            <h2 className="text-xl font-bold text-slate-950">
              {studios.length === 0
                ? "You have no studio listings yet"
                : "No matching studios found"}
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
              {studios.length === 0
                ? "Create your first studio listing and start sharing your creative workspace with others."
                : "Try another search term or switch to a different filter."}
            </p>

            {studios.length === 0 ? (
              <Link
                href="/add-studio"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-800"
              >
                <Plus size={17} />
                Add Your First Studio
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-6 rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* Owner studio cards */
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleStudios.map((studio) => (
              <article
                key={studio._id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative">
                  <StudioImage
                    src={studio.image}
                    title={studio.title}
                  />

                  <div className="absolute right-4 top-4">
                    <ListingStatus status={studio.status} />
                  </div>
                </div>

                <div className="space-y-5 p-6">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
                      {studio.category}
                    </p>

                    <h2 className="line-clamp-2 text-xl font-bold text-slate-950">
                      {studio.title}
                    </h2>

                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                      <MapPin size={16} className="shrink-0" />
                      {studio.location}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
                    <div>
                      <p className="mb-1 text-xs text-slate-500">
                        Hourly Rate
                      </p>

                      <p className="text-base font-bold text-violet-700">
                        {formatMoney(studio.hourlyRate)}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-xs text-slate-500">
                        Capacity
                      </p>

                      <p className="text-base font-semibold text-slate-950">
                        {studio.maxCapacity ?? "N/A"} people
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={15} />
                      {formatDate(studio.createdAt)}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Wallet size={15} />
                      {formatMoney(studio.securityDeposit ?? 0)} deposit
                    </span>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-xs leading-5 text-violet-800">
                    <ShieldCheck
                      size={16}
                      className="mt-0.5 shrink-0"
                    />
                    This listing belongs to your StudioSpace account.
                  </div>

                  <Link
                    href={`/studios/${studio._id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
                  >
                    <Eye size={17} />
                    View Studio
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
