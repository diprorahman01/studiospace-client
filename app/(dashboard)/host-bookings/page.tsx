
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
  ThumbsDown,
  ThumbsUp,
  UserRound,
  Users,
  Wallet,
  X,
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
  rentalCost?: number;
  securityDeposit?: number;
  totalAmount?: number;
  status: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
};

type HostBookingResponse = {
  success: boolean;
  message?: string;
  data?: HostBooking[];
};

type ActionResponse = {
  success: boolean;
  message?: string;
  data?: HostBooking;
};

type FilterValue =
  | "all"
  | "pending"
  | "confirmed"
  | "cancelled";

type BookingAction = "approve" | "reject";

type Confirmation = {
  booking: HostBooking;
  action: BookingAction;
};

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
  return `৳${Number(amount ?? 0).toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string) {
  if (!value) return "Not available";

  // Booking dates are stored as YYYY-MM-DD.
  // Parse them without shifting to another timezone.
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  const date = parts
    ? new Date(
        Number(parts[1]),
        Number(parts[2]) - 1,
        Number(parts[3])
      )
    : new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
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
  const remaining = minutes % 60;

  if (remaining === 0) {
    return `${wholeHours} hour${wholeHours === 1 ? "" : "s"}`;
  }

  if (wholeHours === 0) {
    return `${remaining} minutes`;
  }

  return `${wholeHours}h ${remaining}m`;
}

function StatusBadge({ status }: { status: BookingStatus }) {
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
      <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-violet-50">
        <Building2 size={26} className="text-violet-400" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      onError={() => setFailedSrc(src)}
      className="h-20 w-24 shrink-0 rounded-xl object-cover"
    />
  );
}

function validateBookings(value: unknown): HostBooking[] {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error("The server returned an invalid response.");
  }

  const result = value as HostBookingResponse;

  if (!result.success || !Array.isArray(result.data)) {
    throw new Error(
      result.message || "Unable to load host bookings."
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

  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");

  const [confirmation, setConfirmation] =
    useState<Confirmation | null>(null);
  const [processing, setProcessing] = useState(false);

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

  // Initial authenticated request
  useEffect(() => {
    if (checkingSession || !userId) return;

    const controller = new AbortController();

    async function fetchInitialBookings() {
      try {
        const data = await loadBookings(controller.signal);

        if (controller.signal.aborted) return;

        setBookings(data);
        setError("");
      } catch (err) {
        if (controller.signal.aborted) return;

        if (
          err instanceof Error &&
          err.message === "UNAUTHORIZED"
        ) {
          toast.error("Please log in to view host bookings.");
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
  }, [checkingSession, userId, loadBookings, router]);

  async function handleRefresh() {
    if (loading || refreshing || processing) return;

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
        toast.error("Please log in again.");
        router.replace("/login");
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Could not refresh bookings."
      );
    } finally {
      setRefreshing(false);
    }
  }

  function openConfirmation(
    booking: HostBooking,
    action: BookingAction
  ) {
    if (booking.status !== "pending" || processing) return;

    setConfirmation({ booking, action });
  }

  async function handleConfirmAction() {
    if (!confirmation || processing) return;

    const { booking, action } = confirmation;

    setProcessing(true);

    try {
      const response = await fetch(
        `${API_URL}/api/host/bookings/${booking._id}/${action}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      let result: ActionResponse;

      try {
        result = await response.json();
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (response.status === 401) {
        toast.error("Your session expired. Please log in again.");
        router.replace("/login");
        return;
      }

      if (response.status === 409) {
        toast.error(
          result.message ||
            "This reservation has already been processed."
        );

        setConfirmation(null);

        // Reload to reflect changes made by another request.
        const latest = await loadBookings();
        setBookings(latest);
        return;
      }

      if (!response.ok || !result.success) {
        toast.error(
          result.message || "Unable to update this booking."
        );
        return;
      }

      const updatedStatus: BookingStatus =
        action === "approve" ? "confirmed" : "cancelled";

      setBookings((current) =>
        current.map((item) =>
          item._id === booking._id
            ? {
                ...item,
                status: updatedStatus,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      setConfirmation(null);

      toast.success(
        action === "approve"
          ? "Booking approved successfully!"
          : "Booking rejected successfully!"
      );
    } catch (err) {
      console.error("Host booking action error:", err);

      toast.error(
        err instanceof Error
          ? err.message
          : "Could not connect to the server."
      );
    } finally {
      setProcessing(false);
    }
  }

  const summary = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter(
        (booking) => booking.status === "pending"
      ).length,
      confirmed: bookings.filter(
        (booking) => booking.status === "confirmed"
      ).length,
      cancelled: bookings.filter(
        (booking) => booking.status === "cancelled"
      ).length,
    }),
    [bookings]
  );

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

  const visibleBookings = useMemo(() => {
    const term = search.trim().toLowerCase();

    return bookings
      .filter((booking) => {
        const matchesStatus =
          filter === "all" || booking.status === filter;

        const searchableText = [
          booking.studioTitle || "",
          booking.userName || "",
          booking.userEmail || "",
          booking.date,
          booking._id,
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesStatus &&
          (!term || searchableText.includes(term))
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
  }, [bookings, search, filter]);

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
                Review customer reservations and manage
                pending booking requests for your studios.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing || processing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh Bookings
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10">
        {/* Statistics */}
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
                onClick={() => setFilter(item.value)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  filter === item.value
                    ? "bg-violet-700 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300"
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
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers, studios..."
              aria-label="Search host bookings"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-violet-600 sm:w-80"
            />
          </div>
        </div>

        {/* Booking list */}
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
            <p className="mt-3 text-sm text-slate-500">{error}</p>
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
            <CalendarDays
              size={42}
              className="mx-auto mb-4 text-violet-600"
            />
            <h2 className="text-xl font-bold text-slate-950">
              {bookings.length === 0
                ? "No customer bookings yet"
                : "No matching bookings found"}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
              {bookings.length === 0
                ? "Customer reservations will appear here when someone books one of your studios."
                : "Try another search term or status filter."}
            </p>

            {bookings.length === 0 ? (
              <Link
                href="/my-listings"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white"
              >
                Manage My Studios
                <ArrowRight size={16} />
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
                {/* Booking heading */}
                <div className="flex flex-col justify-between gap-5 border-b border-slate-100 pb-5 md:flex-row md:items-start">
                  <div className="flex min-w-0 items-center gap-4">
                    <StudioImage
                      src={booking.studioImage}
                      title={booking.studioTitle || "Studio"}
                    />
                    <div className="min-w-0">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
                        STUDIO RESERVATION
                      </p>
                      <h2 className="truncate text-lg font-bold text-slate-950">
                        {booking.studioTitle || "Studio"}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Booked on {formatDate(booking.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                {/* Booking details */}
                <div className="grid gap-6 py-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                      <UserRound
                        size={17}
                        className="text-violet-700"
                      />
                      Customer Details
                    </h3>

                    <div className="space-y-3 text-sm text-slate-600">
                      <p className="flex items-start gap-2">
                        <Users
                          size={16}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />
                        {booking.userName || "Not provided"}
                      </p>
                      <p className="flex items-start gap-2">
                        <Mail
                          size={16}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />
                        <span className="break-all">
                          {booking.userEmail || "Not provided"}
                        </span>
                      </p>
                    </div>
                  </div>

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
                        {booking.startTime} - {booking.endTime}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock3
                          size={16}
                          className="text-slate-400"
                        />
                        {formatDuration(booking.duration)}
                      </p>
                    </div>
                  </div>

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
                        <span>{formatMoney(booking.rentalCost)}</span>
                      </div>
                      <div className="flex justify-between gap-3 text-slate-600">
                        <span>Security Deposit</span>
                        <span>
                          {formatMoney(booking.securityDeposit)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 border-t border-slate-100 pt-3 font-bold text-slate-950">
                        <span>Total</span>
                        <span className="text-violet-700">
                          {formatMoney(booking.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking actions */}
                <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CreditCard size={16} />
                    Booking ID:
                    <span className="font-mono">
                      {booking._id.slice(-8)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/studios/${booking.studioId}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50"
                    >
                      <MapPin size={16} />
                      View Studio
                    </Link>

                    {booking.status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={processing}
                          onClick={() =>
                            openConfirmation(booking, "reject")
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          <ThumbsDown size={16} />
                          Reject
                        </button>

                        <button
                          type="button"
                          disabled={processing}
                          onClick={() =>
                            openConfirmation(booking, "approve")
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          <ThumbsUp size={16} />
                          Approve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-violet-100 bg-white px-6 py-5">
            <ShieldCheck
              size={21}
              className="mt-0.5 shrink-0 text-violet-700"
            />
            <p className="text-sm leading-7 text-slate-600">
              Only pending bookings can be approved or rejected.
              These actions are protected by your authenticated
              account and verified on the server.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      {confirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !processing
            ) {
              setConfirmation(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="booking-confirmation-title"
            aria-describedby="booking-confirmation-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-5 flex items-start justify-between">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  confirmation.action === "approve"
                    ? "bg-green-100"
                    : "bg-red-100"
                }`}
              >
                {confirmation.action === "approve" ? (
                  <CheckCircle2
                    size={28}
                    className="text-green-700"
                  />
                ) : (
                  <XCircle
                    size={28}
                    className="text-red-700"
                  />
                )}
              </div>

              <button
                type="button"
                disabled={processing}
                onClick={() => setConfirmation(null)}
                aria-label="Close confirmation dialog"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <h2
              id="booking-confirmation-title"
              className="text-2xl font-bold text-slate-950"
            >
              {confirmation.action === "approve"
                ? "Approve Booking?"
                : "Reject Booking?"}
            </h2>

            <p
              id="booking-confirmation-description"
              className="mt-3 text-sm leading-7 text-slate-600"
            >
              {confirmation.action === "approve"
                ? "Do you want to confirm this reservation for"
                : "Do you want to reject this reservation for"}{" "}
              <strong className="text-slate-950">
                {confirmation.booking.studioTitle || "this studio"}
              </strong>
              ?
            </p>

            <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                <strong>Customer:</strong>{" "}
                {confirmation.booking.userName || "Not provided"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {formatDate(confirmation.booking.date)}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {confirmation.booking.startTime} –{" "}
                {confirmation.booking.endTime}
              </p>
              <p>
                <strong>Amount:</strong>{" "}
                {formatMoney(confirmation.booking.totalAmount)}
              </p>
            </div>

            {confirmation.action === "reject" && (
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-800">
                Rejecting this booking changes its status to
                Cancelled and releases the reserved time slot.
                It does not automatically issue a refund.
              </p>
            )}

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={processing}
                onClick={() => setConfirmation(null)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Go Back
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={handleConfirmAction}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 ${
                  confirmation.action === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processing ? (
                  <>
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                    Processing...
                  </>
                ) : confirmation.action === "approve" ? (
                  <>
                    <CheckCircle2 size={17} />
                    Approve
                  </>
                ) : (
                  <>
                    <XCircle size={17} />
                    Reject
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
