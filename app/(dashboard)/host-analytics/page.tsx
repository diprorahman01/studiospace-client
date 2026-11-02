
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck2,
  Clock3,
  DollarSign,
  LoaderCircle,
  RefreshCw,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

type Studio = {
  _id: string;
  title: string;
  status?: string;
  hourlyRate: number;
};

type Booking = {
  _id: string;
  studioId: string;
  studioTitle?: string;
  status: string;
  totalAmount?: number;
  createdAt?: string;
  date?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T[];
};

type ReportPeriod = "30" | "90" | "365" | "all";

function dollars(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function getAmount(booking: Booking) {
  const amount = booking.totalAmount;
  return typeof amount === "number" &&
    Number.isFinite(amount) &&
    amount >= 0
    ? amount
    : 0;
}

function getDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isInPeriod(
  booking: Booking,
  period: ReportPeriod,
  now: Date
) {
  if (period === "all") return true;

  const date = getDate(booking.createdAt);

  if (!date) return false;

  const days = Number(period);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);

  return date >= cutoff && date <= now;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString(
    "en-US",
    { month: "short", year: "2-digit" }
  );
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Building2;
}) {
  return (
    <article
      className="rounded-2xl border p-6"
      style={{
        background: "var(--ss-surface)",
        borderColor: "var(--ss-border)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--ss-muted)" }}
        >
          {label}
        </p>
        <span className="rounded-xl bg-violet-500/10 p-3 text-violet-700 dark:text-violet-300">
          <Icon size={21} />
        </span>
      </div>

      <p
        className="mt-4 text-3xl font-extrabold"
        style={{ color: "var(--ss-ink)" }}
      >
        {value}
      </p>

      <p
        className="mt-2 text-xs leading-5"
        style={{ color: "var(--ss-muted)" }}
      >
        {detail}
      </p>
    </article>
  );
}

async function fetchData<T>(
  endpoint: string,
  signal?: AbortSignal
): Promise<T[]> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error(
      `Could not load ${endpoint} (${response.status}).`
    );
  }

  const result: ApiResponse<T> = await response.json();

  if (!result.success || !Array.isArray(result.data)) {
    throw new Error(
      result.message || "Invalid analytics data."
    );
  }

  return result.data;
}

export default function HostAnalyticsPage() {
  const router = useRouter();

  const {
    data: session,
    isPending: checkingSession,
  } = authClient.useSession();

  const userId = session?.user?.id;

  const [studios, setStudios] = useState<Studio[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [period, setPeriod] = useState<ReportPeriod>("90");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [asOf, setAsOf] = useState<string>("");

  const loadAnalytics = useCallback(
    async (signal?: AbortSignal) => {
      const [studioData, bookingData] = await Promise.all([
        fetchData<Studio>("/api/studios/mine", signal),
        fetchData<Booking>("/api/host/bookings", signal),
      ]);

      return {
        studios: studioData,
        bookings: bookingData,
      };
    },
    []
  );

  useEffect(() => {
    if (checkingSession || !userId) return;

    const controller = new AbortController();

    loadAnalytics(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;

        setStudios(result.studios);
        setBookings(result.bookings);
        setAsOf(new Date().toISOString());
        setError("");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;

        if (
          err instanceof Error &&
          err.message === "UNAUTHORIZED"
        ) {
          router.replace("/login");
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load analytics."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => controller.abort();
  }, [checkingSession, userId, loadAnalytics, refreshKey, router]);

  function refresh() {
    if (loading || refreshing) return;

    setRefreshing(true);
    setRefreshKey((current) => current + 1);
  }

  const now = useMemo(
    () => (asOf ? new Date(asOf) : new Date(0)),
    [asOf]
  );

  const reportBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        isInPeriod(booking, period, now)
      ),
    [bookings, period, now]
  );

  const analytics = useMemo(() => {
    const confirmed = reportBookings.filter(
      (booking) => booking.status === "confirmed"
    );

    const pending = reportBookings.filter(
      (booking) => booking.status === "pending"
    );

    const cancelled = reportBookings.filter(
      (booking) => booking.status === "cancelled"
    );

    const confirmedValue = confirmed.reduce(
      (sum, booking) => sum + getAmount(booking),
      0
    );

    const averageValue =
      confirmed.length > 0
        ? confirmedValue / confirmed.length
        : 0;

    const statusCounts = [
      { label: "Confirmed", count: confirmed.length, color: "bg-green-500" },
      { label: "Pending", count: pending.length, color: "bg-amber-500" },
      { label: "Cancelled", count: cancelled.length, color: "bg-red-500" },
    ];

    const performance = studios.map((studio) => {
      const ownBookings = reportBookings.filter(
        (booking) =>
          String(booking.studioId) === String(studio._id)
      );

      const approved = ownBookings.filter(
        (booking) => booking.status === "confirmed"
      );

      return {
        ...studio,
        total: ownBookings.length,
        confirmed: approved.length,
        pending: ownBookings.filter(
          (booking) => booking.status === "pending"
        ).length,
        value: approved.reduce(
          (sum, booking) => sum + getAmount(booking),
          0
        ),
      };
    });

    performance.sort(
      (a, b) =>
        b.value - a.value ||
        b.confirmed - a.confirmed ||
        b.total - a.total
    );

    const monthly = new Map<
      string,
      { bookings: number; confirmed: number; value: number }
    >();

    for (const booking of reportBookings) {
      const date = getDate(booking.createdAt);
      if (!date) continue;

      const key = monthKey(date);
      const current = monthly.get(key) || {
        bookings: 0,
        confirmed: 0,
        value: 0,
      };

      current.bookings += 1;

      if (booking.status === "confirmed") {
        current.confirmed += 1;
        current.value += getAmount(booking);
      }

      monthly.set(key, current);
    }

    const months = [...monthly.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, value]) => ({
        key,
        label: monthLabel(key),
        ...value,
      }));

    return {
      total: reportBookings.length,
      confirmed: confirmed.length,
      pending: pending.length,
      cancelled: cancelled.length,
      confirmedValue,
      averageValue,
      statusCounts,
      performance,
      months,
    };
  }, [reportBookings, studios]);

  const maxMonthly = Math.max(
    1,
    ...analytics.months.map((month) => month.bookings)
  );

  const maxStudioValue = Math.max(
    1,
    ...analytics.performance.map((studio) => studio.value)
  );

  if (checkingSession || !userId) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <LoaderCircle
          size={32}
          className="animate-spin text-violet-700"
        />
        <p style={{ color: "var(--ss-muted)" }}>
          Checking your account...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <section className="border-b border-violet-500/10 bg-[#171024] px-5 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-200 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-300">
                <BarChart3 size={17} />
                HOST PERFORMANCE
              </p>
              <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Studio Analytics
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-violet-200">
                Explore reservation trends, confirmed booking
                value, and the performance of your listings.
              </p>
            </div>

            <button
              type="button"
              onClick={refresh}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh Data
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-10">
        <section
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5"
          style={{
            background: "var(--ss-surface)",
            borderColor: "var(--ss-border)",
          }}
        >
          <div>
            <h2
              className="font-bold"
              style={{ color: "var(--ss-ink)" }}
            >
              Reporting Period
            </h2>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--ss-muted)" }}
            >
              Filter bookings by the date they were created.
            </p>
          </div>

          <select
            aria-label="Analytics reporting period"
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value as ReportPeriod)
            }
            className="rounded-xl border px-4 py-3 text-sm font-semibold outline-none focus:border-violet-600"
            style={{
              background: "var(--ss-surface-alt)",
              borderColor: "var(--ss-border)",
              color: "var(--ss-ink)",
            }}
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last 12 Months</option>
            <option value="all">All Time</option>
          </select>
        </section>

        {loading ? (
          <div
            className="flex min-h-72 items-center justify-center gap-3 rounded-2xl border"
            style={{
              background: "var(--ss-surface)",
              borderColor: "var(--ss-border)",
            }}
          >
            <LoaderCircle
              size={25}
              className="animate-spin text-violet-600"
            />
            <p style={{ color: "var(--ss-muted)" }}>
              Loading analytics...
            </p>
          </div>
        ) : error ? (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{
              background: "var(--ss-surface)",
              borderColor: "var(--ss-border)",
            }}
          >
            <XCircle
              size={36}
              className="mx-auto text-red-500"
            />
            <h2
              className="mt-4 text-lg font-bold"
              style={{ color: "var(--ss-ink)" }}
            >
              Unable to Load Analytics
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--ss-muted)" }}
            >
              {error}
            </p>
            <button
              type="button"
              onClick={refresh}
              className="mt-5 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                label="My Studios"
                value={studios.length}
                detail="Studios owned by your account"
                icon={Building2}
              />
              <StatCard
                label="Total Reservations"
                value={analytics.total}
                detail="Bookings created during the selected period"
                icon={Users}
              />
              <StatCard
                label="Confirmed Bookings"
                value={analytics.confirmed}
                detail="Currently confirmed reservations"
                icon={CalendarCheck2}
              />
              <StatCard
                label="Pending Requests"
                value={analytics.pending}
                detail="Awaiting a host decision"
                icon={Clock3}
              />
              <StatCard
                label="Confirmed Booking Value"
                value={dollars(analytics.confirmedValue)}
                detail="Booking value, not verified payments or net earnings"
                icon={DollarSign}
              />
              <StatCard
                label="Average Confirmed Value"
                value={dollars(analytics.averageValue)}
                detail="Average amount per confirmed booking"
                icon={TrendingUp}
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              {/* Monthly trend */}
              <div
                className="rounded-2xl border p-6"
                style={{
                  background: "var(--ss-surface)",
                  borderColor: "var(--ss-border)",
                }}
              >
                <h2
                  className="flex items-center gap-2 text-lg font-extrabold"
                  style={{ color: "var(--ss-ink)" }}
                >
                  <BarChart3 size={21} className="text-violet-600" />
                  Monthly Booking Trend
                </h2>
                <p
                  className="mt-2 text-xs"
                  style={{ color: "var(--ss-muted)" }}
                >
                  Number of bookings created each month
                </p>

                {analytics.months.length === 0 ? (
                  <p
                    className="py-16 text-center text-sm"
                    style={{ color: "var(--ss-muted)" }}
                  >
                    No dated bookings in this period.
                  </p>
                ) : (
                  <div className="mt-8 flex h-56 items-end gap-3 overflow-x-auto border-b border-violet-500/15 pb-2">
                    {analytics.months.map((month) => (
                      <div
                        key={month.key}
                        className="flex h-full min-w-12 flex-1 flex-col items-center justify-end gap-2"
                      >
                        <span
                          className="text-xs font-bold"
                          style={{ color: "var(--ss-ink)" }}
                        >
                          {month.bookings}
                        </span>
                        <div
                          title={`${month.bookings} bookings; ${month.confirmed} confirmed`}
                          className="w-full max-w-12 rounded-t-lg bg-violet-600"
                          style={{
                            height: `${Math.max(
                              4,
                              (month.bookings / maxMonthly) * 165
                            )}px`,
                          }}
                        />
                        <span
                          className="whitespace-nowrap text-[10px]"
                          style={{ color: "var(--ss-muted)" }}
                        >
                          {month.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Booking status chart */}
              <div
                className="rounded-2xl border p-6"
                style={{
                  background: "var(--ss-surface)",
                  borderColor: "var(--ss-border)",
                }}
              >
                <h2
                  className="text-lg font-extrabold"
                  style={{ color: "var(--ss-ink)" }}
                >
                  Booking Status Breakdown
                </h2>
                <p
                  className="mt-2 text-xs"
                  style={{ color: "var(--ss-muted)" }}
                >
                  Current status of bookings in the period
                </p>

                <div className="mt-8 space-y-7">
                  {analytics.statusCounts.map((item) => {
                    const percentage =
                      analytics.total > 0
                        ? (item.count / analytics.total) * 100
                        : 0;

                    return (
                      <div key={item.label}>
                        <div className="mb-2 flex justify-between gap-3">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: "var(--ss-ink)" }}
                          >
                            {item.label}
                          </span>
                          <span
                            className="text-sm"
                            style={{ color: "var(--ss-muted)" }}
                          >
                            {item.count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-violet-500/10">
                          <div
                            className={`h-full rounded-full ${item.color}`}
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p
                  className="mt-8 text-xs"
                  style={{ color: "var(--ss-muted)" }}
                >
                  Cancelled bookings: {analytics.cancelled}
                </p>
              </div>
            </section>

            {/* Studio performance */}
            <section
              className="rounded-2xl border p-6"
              style={{
                background: "var(--ss-surface)",
                borderColor: "var(--ss-border)",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2
                    className="text-xl font-extrabold"
                    style={{ color: "var(--ss-ink)" }}
                  >
                    Performance by Studio
                  </h2>
                  <p
                    className="mt-2 text-xs"
                    style={{ color: "var(--ss-muted)" }}
                  >
                    Ranked by confirmed booking value
                  </p>
                </div>

                <Link
                  href="/my-listings"
                  className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 dark:text-violet-300"
                >
                  Manage Studios
                  <ArrowRight size={16} />
                </Link>
              </div>

              {analytics.performance.length === 0 ? (
                <div className="py-14 text-center">
                  <Building2
                    size={36}
                    className="mx-auto text-violet-500"
                  />
                  <p
                    className="mt-3 text-sm"
                    style={{ color: "var(--ss-muted)" }}
                  >
                    Create a studio to start tracking performance.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {analytics.performance.map((studio) => (
                    <div
                      key={studio._id}
                      className="rounded-xl border p-4"
                      style={{
                        borderColor: "var(--ss-border)",
                        background: "var(--ss-surface-alt)",
                      }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p
                            className="font-bold"
                            style={{ color: "var(--ss-ink)" }}
                          >
                            {studio.title}
                          </p>
                          <p
                            className="mt-1 text-xs"
                            style={{ color: "var(--ss-muted)" }}
                          >
                            {studio.total} bookings ·{" "}
                            {studio.confirmed} confirmed ·{" "}
                            {studio.pending} pending
                          </p>
                        </div>
                        <span className="text-sm font-extrabold text-violet-700 dark:text-violet-300">
                          {dollars(studio.value)}
                        </span>
                      </div>

                      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-violet-500/10">
                        <div
                          className="h-full rounded-full bg-violet-600"
                          style={{
                            width: `${Math.max(
                              0,
                              (studio.value / maxStudioValue) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/host-bookings"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white"
              >
                Manage Bookings
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold"
                style={{
                  borderColor: "var(--ss-border)",
                  color: "var(--ss-ink)",
                }}
              >
                Back to Dashboard
              </Link>
            </div>

            <p
              className="text-xs leading-6"
              style={{ color: "var(--ss-muted)" }}
            >
              Analytics reflect the current booking records.
              Status changes may affect historical totals.
              Confirmed booking value is calculated from
              booking amounts, not payment settlements,
              refunds, fees, or actual revenue received.
              Reporting periods use booking creation dates.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
