
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  LoaderCircle,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled";

type HostBooking = {
  _id: string;
  studioId: string;
  studioTitle?: string;
  studioImage?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration?: number;
  hourlyRate?: number;
  rentalCost?: number;
  securityDeposit?: number;
  totalAmount?: number;
  status: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string;
};

type HostBookingResponse = {
  success: boolean;
  message?: string;
  summary?: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
  };
  data?: HostBooking[];
};

type FilterValue =
  | "all"
  | "pending"
  | "confirmed"
  | "cancelled";

const FILTERS: {
  label: string;
  value: FilterValue;
}[] = [
  { label: "All Bookings", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Cancelled", value: "cancelled" },
];

function formatMoney(amount?: number) {
  return `৳${Number(amount ?? 0).toLocaleString(
    "en-BD",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDate(dateValue?: string) {
  if (!dateValue) return "Not available";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  // Calendar dates use a fixed timezone to avoid
  // the date changing when a visitor is abroad.
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDuration(hours?: number) {
  if (
    typeof hours !== "number" ||
    !Number.isFinite(hours)
  ) {
    return "Not available";
  }

  const minutes = Math.round(hours * 60);
  const wholeHours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${wholeHours} hour${
      wholeHours === 1 ? "" : "s"
    }`;
  }

  if (wholeHours === 0) {
    return `${remainingMinutes} minutes`;
  }

  return `${wholeHours}h ${remainingMinutes}m`;
}

function StatusBadge({
  status,
}: {
  status: BookingStatus;
}) {
  if (status === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
        <CheckCircle2 size={14} />
        Confirmed
      </span>
    );
  }

  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
        <XCircle size={14} />
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
      <Clock3 size={14} />
      Pending
    </span>
  );
}

function BookingStudioImage({
  src,
  title,
}: {
  src?: string;
  title: string;
}) {
  const [failedSrc, setFailedSrc] =
    useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-violet-50">
        <Building2
          size={26}
          className="text-violet-400"
        />
      </div>
    );
  }

  return (
    // External and public/local image URLs are supported.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      onError={() => setFailedSrc(src)}
      className="h-20 w-24 shrink-0 rounded-xl object-cover"
    />
  );
}

function validateBookings(
  value: unknown
): HostBooking[] {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      "The server returned an invalid response."
    );
  }

  const result = value as HostBookingResponse;

  if (!result.success) {
    throw new Error(
      result.message ||
        "Unable to load hosted bookings."
    );
  }

  if (!Array.isArray(result.data)) {
    throw new Error(
      "The server did not return a bookings list."
    );
  }

  return result.data;
}

export default function HostBookingsPage() {
  const router = useRouter();

  const {
    data: session,
    isPending: checkingSession,
  } = authClient.useSession();

  const userId = session?.user?.id;

  const [bookings, setBookings] =
    useState<HostBooking[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<FilterValue>("all");

  // ---------------------------------
  // Fetch host bookings
  // ---------------------------------

  const loadBookings = useCallback(
    async (signal?: AbortSignal) => {
      const response = await fetch(
        `${API_URL}/api/host/bookings`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
          signal,
        }
      );

      if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
      }

      if (!response.ok) {
        throw new Error(
          `Unable to load bookings (${response.status}).`
        );
      }

      const result: unknown = await response.json();

      return validateBookings(result);
    },
    []
  );

  // ---------------------------------
  // Load after authentication
  // ---------------------------------

  useEffect(() => {
    if (checkingSession || !userId) {
      return;
    }

    const controller = new AbortController();

    async function fetchInitialBookings() {
      try {
        const data = await loadBookings(
          controller.signal
        );

        if (controller.signal.aborted) return;

        setBookings(data);
        setError("");
      } catch (err) {
        if (controller.signal.aborted) return;

        if (
          err instanceof Error &&
          err.message === "UNAUTHORIZED"
        ) {
          toast.error(
            "Please log in to view host bookings."
          );
          router.replace("/login");
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load host bookings."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchInitialBookings();

    return () => controller.abort();
  }, [
    checkingSession,
    userId,
    loadBookings,
    router,
  ]);

  // ---------------------------------
  // Refresh booking data
  // ---------------------------------

  async function handleRefresh() {
    if (loading || refreshing) return;

    setRefreshing(true);

    try {
      const data = await loadBookings();

      setBookings(data);
      setError("");

      toast.success("Host bookings updated.");
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === "UNAUTHORIZED"
      ) {
        toast.error(
          "Your session expired. Please log in again."
        );
        router.replace("/login");
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Could not refresh host bookings."
      );
    } finally {
      setRefreshing(false);
    }
  }

  // ---------------------------------
  // Booking statistics
  // ---------------------------------

  const summary = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter(
        (booking) =>
          booking.status === "pending"
      ).length,
      confirmed: bookings.filter(
        (booking) =>
          booking.status === "confirmed"
      ).length,
      cancelled: bookings.filter(
        (booking) =>
          booking.status === "cancelled"
      ).length,
    };
  }, [bookings]);

  const statisticCards = [
    {
      label: "Total Bookings",
      value: summary.total,
      icon: CalendarDays,
      style: "bg-violet-50 text-violet-700",
    },
    {
      label: "Pending",
      value: summary.pending,
      icon: Clock3,
      style: "bg-amber-50 text-amber-700",
    },
    {
      label: "Confirmed",
      value: summary.confirmed,
      icon: CheckCircle2,
      style: "bg-green-50 text-green-700",
    },
    {
      label: "Cancelled",
      value: summary.cancelled,
      icon: XCircle,
      style: "bg-red-50 text-red-700",
    },
  ];

  // ---------------------------------
  // Search and filter
  // ---------------------------------

  const visibleBookings = useMemo(() => {
    const term = search.trim().toLowerCase();

    return bookings
      .filter((booking) => {
        const matchesStatus =
          filter === "all" ||
          booking.status === filter;

        const searchableText = [
          booking.studioTitle || "",
          booking.userName || "",
          booking.userEmail || "",
          booking.date || "",
          booking._id || "",
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !term || searchableText.includes(term);

        return matchesStatus && matchesSearch;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
  }, [bookings, search, filter]);

  // ---------------------------------
  // Authentication loading
  // ---------------------------------

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
      {/* Page heading */}
      <section className="border-b border-violet-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
          <Link
            href="/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-700"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-700">
            <Users size={17} />
            HOST MANAGEMENT
          </p>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-950 sm:text-4xl">
                Host Bookings
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                View reservations received for your
                creative studios and keep track of
                customer bookings.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing ? "animate-spin" : ""
                }
              />
              Refresh Bookings
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10">
        {/* Statistic cards */}
        <div className="mb-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statisticCards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${item.style}`}
                >
                  <Icon size={23} />
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

        {/* Search and filters */}
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  setFilter(item.value)
                }
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

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search customers, studios..."
              aria-label="Search host bookings"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-violet-600 sm:w-80"
            />
          </div>
        </div>

        {/* Booking content */}
        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl bg-white">
            <LoaderCircle
              size={34}
              className="animate-spin text-violet-700"
            />
            <p className="text-sm text-slate-500">
              Loading customer reservations...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-white px-6 py-14 text-center">
            <XCircle
              size={42}
              className="mx-auto mb-4 text-red-500"
            />

            <h2 className="text-xl font-bold text-slate-950">
              Unable to Load Host Bookings
            </h2>

            <p className="mt-3 text-sm text-slate-500">
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
        ) : visibleBookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-violet-50">
              <CalendarDays
                size={35}
                className="text-violet-600"
              />
            </div>

            <h2 className="text-xl font-bold text-slate-950">
              {bookings.length === 0
                ? "No customer bookings yet"
                : "No matching bookings found"}
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
              {bookings.length === 0
                ? "When customers book one of your studios, their reservations will appear here."
                : "Try changing your search or status filter."}
            </p>

            {bookings.length === 0 ? (
              <Link
                href="/my-listings"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-800"
              >
                <Building2 size={17} />
                Manage My Studios
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
          <div className="space-y-5">
            {visibleBookings.map((booking) => (
              <article
                key={booking._id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7"
              >
                <div className="flex flex-col justify-between gap-5 border-b border-slate-100 pb-5 md:flex-row md:items-start">
                  <div className="flex min-w-0 items-center gap-4">
                    <BookingStudioImage
                      src={booking.studioImage}
                      title={
                        booking.studioTitle ||
                        "Studio"
                      }
                    />

                    <div className="min-w-0">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
                        STUDIO RESERVATION
                      </p>

                      <h2 className="truncate text-lg font-bold text-slate-950">
                        {booking.studioTitle ||
                          "Studio"}
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Booked on{" "}
                        {formatDate(
                          booking.createdAt
                        )}
                      </p>
                    </div>
                  </div>

                  <StatusBadge
                    status={booking.status}
                  />
                </div>

                <div className="grid gap-6 py-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Customer details */}
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                      <UserRound
                        size={17}
                        className="text-violet-700"
                      />
                      Customer Details
                    </h3>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2 text-slate-600">
                        <Users
                          size={16}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />
                        <span>
                          {booking.userName ||
                            "Not provided"}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 text-slate-600">
                        <Mail
                          size={16}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />
                        <span className="break-all">
                          {booking.userEmail ||
                            "Not provided"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                      <CalendarDays
                        size={17}
                        className="text-violet-700"
                      />
                      Booking Schedule
                    </h3>

                    <div className="space-y-3 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <CalendarDays
                          size={16}
                          className="text-slate-400"
                        />
                        {formatDate(booking.date)}
                      </p>

                      <p className="flex items-center gap-2">
                        <Clock3
                          size={16}
                          className="text-slate-400"
                        />
                        {booking.startTime} -{" "}
                        {booking.endTime}
                      </p>

                      <p className="flex items-center gap-2">
                        <Clock3
                          size={16}
                          className="text-slate-400"
                        />
                        {formatDuration(
                          booking.duration
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Price summary */}
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Wallet
                        size={17}
                        className="text-violet-700"
                      />
                      Payment Summary
                    </h3>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-3 text-slate-600">
                        <span>Studio Rent</span>
                        <span className="font-medium">
                          {formatMoney(
                            booking.rentalCost
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 text-slate-600">
                        <span>Security Deposit</span>
                        <span className="font-medium">
                          {formatMoney(
                            booking.securityDeposit
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 border-t border-slate-100 pt-3 font-bold text-slate-950">
                        <span>Total</span>
                        <span className="text-violet-700">
                          {formatMoney(
                            booking.totalAmount
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CreditCard size={16} />
                    Booking ID:{" "}
                    <span className="font-mono">
                      {booking._id.slice(-8)}
                    </span>
                  </div>

                  <Link
                    href={`/studios/${booking.studioId}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
                  >
                    <MapPin size={16} />
                    View Studio
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Information note */}
        {!loading && !error && (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-violet-100 bg-white px-6 py-5">
            <ShieldCheck
              size={21}
              className="mt-0.5 shrink-0 text-violet-700"
            />

            <p className="text-sm leading-7 text-slate-600">
              These reservations belong to studios
              associated with your account. Booking
              information comes directly from the
              StudioSpace backend. This page currently
              displays bookings only; approval and
              rejection controls will be added in the
              next step.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
