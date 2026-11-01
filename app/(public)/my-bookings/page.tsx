
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
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

type Booking = {
  _id: string;
  studioId: string;
  studioTitle: string;
  studioImage?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  hourlyRate: number;
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

type Filter = "all" | BookingStatus;

const filters: { label: string; value: Filter }[] = [
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

function formatDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  return parsed.toLocaleDateString("en-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return time;
  }

  const hour = hours % 12 || 12;
  const period = hours >= 12 ? "PM" : "AM";

  return `${hour}:${String(minutes).padStart(2, "0")} ${period}`;
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

export default function MyBookingsPage() {
  const router = useRouter();

  const { data: session, isPending: checkingSession } =
    authClient.useSession();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState("");

  const userId = session?.user?.id;

  const loadBookings = useCallback(
    async (signal?: AbortSignal) => {
      setError("");

      try {
        const response = await fetch(`${API_URL}/api/bookings/my`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal,
        });

        if (response.status === 401) {
          toast.error("Please log in to view your bookings.");
          router.replace("/login");
          return;
        }

        const result: BookingsResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load bookings."
          );
        }

        if (!signal?.aborted) {
          setBookings(result.data || []);
        }
      } catch (err) {
        if (signal?.aborted) return;

        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong.";

        setError(message);
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

    void loadBookings(controller.signal);

    return () => controller.abort();
  }, [checkingSession, userId, router, loadBookings]);

  async function handleRefresh() {
    if (refreshing || loading) return;

    setRefreshing(true);
    await loadBookings();
  }

  const filteredBookings = bookings.filter(
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
      {/* Header */}
      <section className="border-b border-violet-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-violet-700">
            <CalendarDays size={18} />
            YOUR RESERVATIONS
          </div>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                My Bookings
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                View your studio reservations, check their
                status, and keep track of your creative sessions.
              </p>
            </div>

            <Link
              href="/studios"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
            >
              Explore Studios
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10">
        {/* Summary cards */}
        <div className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <CalendarDays size={22} />
            </div>
            <p className="text-sm text-slate-500">
              Total Bookings
            </p>
            <p className="mt-2 text-3xl font-extrabold text-slate-950">
              {bookings.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 size={22} />
            </div>
            <p className="text-sm text-slate-500">
              Pending Bookings
            </p>
            <p className="mt-2 text-3xl font-extrabold text-slate-950">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <CheckCircle2 size={22} />
            </div>
            <p className="text-sm text-slate-500">
              Confirmed Bookings
            </p>
            <p className="mt-2 text-3xl font-extrabold text-slate-950">
              {confirmedCount}
            </p>
          </div>
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
                    : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700"
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
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
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
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white">
            <LoaderCircle className="h-9 w-9 animate-spin text-violet-700" />
            <p className="text-sm text-slate-500">
              Loading your bookings...
            </p>
          </div>
        ) : error ? (
          /* Error */
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
              className="mt-6 rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-800"
            >
              Try Again
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-violet-50">
              {filter === "all" ? (
                <Search size={35} className="text-violet-600" />
              ) : (
                <CalendarDays
                  size={35}
                  className="text-violet-600"
                />
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-950">
              {filter === "all"
                ? "No bookings yet"
                : `No ${filter} bookings`}
            </h2>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-500">
              {filter === "all"
                ? "Your creative journey starts here. Discover a studio and book your first session."
                : "There are no bookings matching this status right now."}
            </p>

            {filter === "all" ? (
              <Link
                href="/studios"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-800"
              >
                Find a Studio
                <ArrowRight size={17} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-6 rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-800"
              >
                View All Bookings
              </button>
            )}
          </div>
        ) : (
          /* Booking cards */
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filteredBookings.map((booking) => (
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
                      <MapPin
                        size={19}
                        className="mt-0.5 shrink-0 text-violet-700"
                      />
                      <div>
                        <p className="text-xs text-slate-500">
                          Duration
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {booking.duration}{" "}
                          {booking.duration === 1 ? "hour" : "hours"}
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                  >
                    View Studio
                    <ArrowRight size={17} />
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
