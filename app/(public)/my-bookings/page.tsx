
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
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

type BookingStatus = "pending" | "confirmed" | "cancelled";
type FilterType = "all" | BookingStatus;

type Booking = {
  _id: string;
  studioId: string;
  studioTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  rentalCost: number;
  securityDeposit: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
};

type BookingsResponse = {
  success: boolean;
  count?: number;
  data?: Booking[];
  message?: string;
};

const filters: { label: string; value: FilterType }[] = [
  { label: "All Bookings", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Cancelled", value: "cancelled" },
];

function formatMoney(amount: number) {
  return `৳${Number(amount || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  const parts = value.split("-").map(Number);

  if (
    parts.length !== 3 ||
    parts.some((part) => !Number.isFinite(part))
  ) {
    return value;
  }

  return new Date(
    parts[0],
    parts[1] - 1,
    parts[2]
  ).toLocaleDateString("en-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }

  return `${hours % 12 || 12}:${String(minutes).padStart(
    2,
    "0"
  )} ${hours >= 12 ? "PM" : "AM"}`;
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = {
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-700",
  };

  const icons = {
    pending: Clock3,
    confirmed: CheckCircle2,
    cancelled: XCircle,
  };

  const Icon = icons[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${styles[status]}`}
    >
      <Icon size={14} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function MyBookingsPage() {
  const router = useRouter();

  const { data: session, isPending: checkingSession } =
    authClient.useSession();

  const userId = session?.user?.id;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(
    null
  );

  const loadBookings = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch(
          `${API_URL}/api/bookings/my`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            signal,
          }
        );

        if (response.status === 401) {
          if (!signal?.aborted) {
            router.replace("/login");
          }
          return;
        }

        const result: BookingsResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load bookings."
          );
        }

        if (!signal?.aborted) {
          setBookings(result.data ?? []);
          setError("");
        }
      } catch (err) {
        if (signal?.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Could not load your bookings."
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

  async function fetchInitialBookings() {
    try {
      const response = await fetch(
        `${API_URL}/api/bookings/my`,
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

      const result: BookingsResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load bookings."
        );
      }

      if (!controller.signal.aborted) {
        setBookings(result.data ?? []);
        setError("");
      }
    } catch (err) {
      if (controller.signal.aborted) return;

      setError(
        err instanceof Error
          ? err.message
          : "Could not load your bookings."
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  void fetchInitialBookings();

  return () => controller.abort();
}, [checkingSession, userId, router]);

  async function handleRefresh() {
    if (refreshing || loading) return;

    setRefreshing(true);
    await loadBookings();
  }

  async function handleCancelBooking(id: string) {
    if (cancellingId) return;

    setCancellingId(id);

    try {
      const response = await fetch(
        `${API_URL}/api/bookings/${id}/cancel`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result: {
        success: boolean;
        message?: string;
      } = await response.json();

      if (response.status === 401) {
        toast.error("Please log in again.");
        setConfirmId(null);
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        toast.error(
          result.message || "Could not cancel the booking."
        );
        setConfirmId(null);
        await loadBookings();
        return;
      }

      setBookings((current) =>
        current.map(
          (booking): Booking =>
            booking._id === id
              ? { ...booking, status: "cancelled" }
              : booking
        )
      );

      setConfirmId(null);
      toast.success(
        result.message || "Booking cancelled successfully!"
      );

      await loadBookings();
    } catch (err) {
      console.error("Cancel booking error:", err);
      toast.error("Unable to connect to the booking server.");
    } finally {
      setCancellingId(null);
    }
  }

  const visibleBookings = bookings.filter(
    (booking) =>
      filter === "all" || booking.status === filter
  );

  const pendingCount = bookings.filter(
    (booking) => booking.status === "pending"
  ).length;

  const confirmedCount = bookings.filter(
    (booking) => booking.status === "confirmed"
  ).length;

  if (checkingSession || !userId) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-3">
        <LoaderCircle className="h-9 w-9 animate-spin text-violet-700" />
        <p className="text-sm text-slate-500">
          Checking your account...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-[80vh] bg-[#f8f7fd]">
      {/* Page heading */}
      <section className="border-b border-violet-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-violet-700">
            <CalendarDays size={18} />
            YOUR RESERVATIONS
          </div>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-950 sm:text-4xl">
                My Bookings
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                Review your studio reservations, track their
                status, and cancel pending bookings.
              </p>
            </div>

            <Link
              href="/studios"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800"
            >
              Explore Studios
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10">
        {/* Summary */}
        <div className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              title: "Total Bookings",
              value: bookings.length,
              icon: CalendarDays,
              style: "bg-violet-50 text-violet-700",
            },
            {
              title: "Pending Bookings",
              value: pendingCount,
              icon: Clock3,
              style: "bg-amber-50 text-amber-700",
            },
            {
              title: "Confirmed Bookings",
              value: confirmedCount,
              icon: CheckCircle2,
              style: "bg-green-50 text-green-700",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${item.style}`}
                >
                  <Icon size={22} />
                </div>
                <p className="text-sm text-slate-500">
                  {item.title}
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-950">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filter toolbar */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  filter === item.value
                    ? "bg-violet-700 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:text-violet-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl bg-white">
            <LoaderCircle className="h-9 w-9 animate-spin text-violet-700" />
            <p className="text-sm text-slate-500">
              Loading your bookings...
            </p>
          </div>
        ) : error ? (
          /* API error */
          <div className="rounded-2xl border border-red-100 bg-white px-6 py-14 text-center">
            <XCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
            <h2 className="text-xl font-bold text-slate-950">
              Unable to load bookings
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
        ) : visibleBookings.length === 0 ? (
          /* Empty list */
          <div className="rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-violet-50">
              <Search size={35} className="text-violet-600" />
            </div>

            <h2 className="text-xl font-bold text-slate-950">
              {filter === "all"
                ? "No bookings yet"
                : `No ${filter} bookings`}
            </h2>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-500">
              {filter === "all"
                ? "Explore studios and book your first session."
                : "There are no bookings matching this filter."}
            </p>

            {filter === "all" ? (
              <Link
                href="/studios"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white"
              >
                Find a Studio
                <ArrowRight size={17} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-6 rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white"
              >
                View All Bookings
              </button>
            )}
          </div>
        ) : (
          /* Booking cards */
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {visibleBookings.map((booking) => (
              <article
                key={booking._id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-6">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-600">
                      Studio Reservation
                    </p>
                    <h2 className="text-xl font-bold text-slate-950">
                      {booking.studioTitle}
                    </h2>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                <div className="space-y-4 p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <CalendarDays
                        size={19}
                        className="mt-0.5 shrink-0 text-violet-700"
                      />
                      <div>
                        <p className="text-xs text-slate-500">
                          Booking Date
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatDate(booking.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock3
                        size={19}
                        className="mt-0.5 shrink-0 text-violet-700"
                      />
                      <div>
                        <p className="text-xs text-slate-500">
                          Time Slot
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatTime(booking.startTime)} –{" "}
                          {formatTime(booking.endTime)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <ShieldCheck
                        size={19}
                        className="mt-0.5 shrink-0 text-violet-700"
                      />
                      <div>
                        <p className="text-xs text-slate-500">
                          Duration
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {booking.duration}{" "}
                          {booking.duration === 1
                            ? "hour"
                            : "hours"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Wallet
                        size={19}
                        className="mt-0.5 shrink-0 text-violet-700"
                      />
                      <div>
                        <p className="text-xs text-slate-500">
                          Total Amount
                        </p>
                        <p className="mt-1 text-sm font-bold text-violet-700">
                          {formatMoney(booking.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-slate-500">
                        Studio Rental
                      </span>
                      <span className="font-medium text-slate-900">
                        {formatMoney(booking.rentalCost)}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between gap-4 text-sm">
                      <span className="text-slate-500">
                        Security Deposit
                      </span>
                      <span className="font-medium text-slate-900">
                        {formatMoney(booking.securityDeposit)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck
                      size={16}
                      className="text-violet-700"
                    />
                    {booking.status === "pending"
                      ? "Awaiting booking confirmation"
                      : booking.status === "confirmed"
                        ? "Your booking has been confirmed"
                        : "This reservation was cancelled"}
                  </div>

                  <Link
                    href={`/studios/${booking.studioId}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100"
                  >
                    View Studio
                    <ArrowRight size={17} />
                  </Link>

                  {booking.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => setConfirmId(booking._id)}
                      disabled={Boolean(cancellingId)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle size={17} />
                      Cancel Booking
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Cancellation confirmation */}
      {confirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
            aria-describedby="cancel-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle size={24} />
            </div>

            <h2
              id="cancel-title"
              className="text-xl font-bold text-slate-950"
            >
              Cancel this booking?
            </h2>

            <p
              id="cancel-description"
              className="mt-3 text-sm leading-6 text-slate-600"
            >
              This will cancel your pending reservation and make
              the time slot available again. This action cannot
              be undone.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={Boolean(cancellingId)}
                onClick={() => setConfirmId(null)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Keep Booking
              </button>

              <button
                type="button"
                disabled={Boolean(cancellingId)}
                onClick={() => void handleCancelBooking(confirmId)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancellingId ? (
                  <>
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel Booking"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
