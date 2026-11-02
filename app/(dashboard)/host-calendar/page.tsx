
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LoaderCircle,
  MapPin,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

type BookingStatus = "pending" | "confirmed" | "cancelled";
type BookingAction = "approve" | "reject";

type Booking = {
  _id: string;
  studioId: string;
  studioTitle?: string;
  userName?: string;
  userEmail?: string;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount?: number;
  status: BookingStatus;
};

type BookingResponse = {
  success: boolean;
  message?: string;
  data?: Booking[];
};

type ActionResponse = {
  success: boolean;
  message?: string;
  data?: Booking;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );

  return dateKey(date) === value ? date : null;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function money(value?: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles =
    status === "confirmed"
      ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
      : status === "pending"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
        : "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300";

  const Icon =
    status === "confirmed"
      ? CheckCircle2
      : status === "pending"
        ? Clock3
        : XCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold capitalize ${styles}`}
    >
      <Icon size={14} />
      {status}
    </span>
  );
}

async function fetchHostBookings(
  signal?: AbortSignal
): Promise<Booking[]> {
  const response = await fetch(`${API_URL}/api/host/bookings`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });

  if (response.status === 401) throw new Error("UNAUTHORIZED");

  if (!response.ok) {
    throw new Error(
      `Unable to load bookings (${response.status}).`
    );
  }

  const result: BookingResponse = await response.json();

  if (!result.success || !Array.isArray(result.data)) {
    throw new Error(result.message || "Invalid booking response.");
  }

  return result.data;
}

export default function HostCalendarPage() {
  const router = useRouter();
  const { data: session, isPending: checkingSession } =
    authClient.useSession();

  const userId = session?.user?.id;

  const [today] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(
    () => dateKey(new Date())
  );

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [studioFilter, setStudioFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");

  const [confirmation, setConfirmation] = useState<{
    booking: Booking;
    action: BookingAction;
  } | null>(null);

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (checkingSession || !userId) return;

    const controller = new AbortController();

    fetchHostBookings(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setBookings(data);
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
            : "Unable to load booking calendar."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => controller.abort();
  }, [checkingSession, userId, router, refreshKey]);

  const studios = useMemo(() => {
    const map = new Map<string, string>();

    for (const booking of bookings) {
      map.set(
        String(booking.studioId),
        booking.studioTitle || "Studio"
      );
    }

    return [...map.entries()].sort((a, b) =>
      a[1].localeCompare(b[1])
    );
  }, [bookings]);

  const filteredBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          (studioFilter === "all" ||
            String(booking.studioId) === studioFilter) &&
          (statusFilter === "all" ||
            booking.status === statusFilter)
      ),
    [bookings, studioFilter, statusFilter]
  );

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();

    for (const booking of filteredBookings) {
      if (!parseDate(booking.date)) continue;
      const items = map.get(booking.date) || [];
      items.push(booking);
      map.set(booking.date, items);
    }

    for (const items of map.values()) {
      items.sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );
    }

    return map;
  }, [filteredBookings]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const cells = Math.ceil((first + days) / 7) * 7;

    return Array.from({ length: cells }, (_, index) => {
      const number = index - first + 1;
      return number >= 1 && number <= days
        ? new Date(year, month, number)
        : null;
    });
  }, [visibleMonth]);

  const selectedBookings = bookingsByDate.get(selectedDate) || [];
  const selectedDateObject = parseDate(selectedDate);

  const monthlyBookings = filteredBookings.filter((booking) => {
    const date = parseDate(booking.date);
    return (
      date !== null &&
      date.getFullYear() === visibleMonth.getFullYear() &&
      date.getMonth() === visibleMonth.getMonth()
    );
  });

  const monthSummary = {
    total: monthlyBookings.length,
    confirmed: monthlyBookings.filter(
      (booking) => booking.status === "confirmed"
    ).length,
    pending: monthlyBookings.filter(
      (booking) => booking.status === "pending"
    ).length,
    cancelled: monthlyBookings.filter(
      (booking) => booking.status === "cancelled"
    ).length,
  };

  const changeMonth = useCallback(
    (offset: number) => {
      const next = new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth() + offset,
        1
      );

      setVisibleMonth(next);
      setSelectedDate(dateKey(next));
    },
    [visibleMonth]
  );

  function goToToday() {
    const now = new Date();

    setVisibleMonth(
      new Date(now.getFullYear(), now.getMonth(), 1)
    );
    setSelectedDate(dateKey(now));
  }

  function refresh() {
    if (loading || refreshing || processing) return;
    setRefreshing(true);
    setRefreshKey((current) => current + 1);
  }

  function askToUpdate(
    booking: Booking,
    action: BookingAction
  ) {
    if (processing || booking.status !== "pending") return;
    setConfirmation({ booking, action });
  }

  async function confirmAction() {
    if (!confirmation || processing) return;

    const { booking, action } = confirmation;
    setProcessing(true);

    try {
      const response = await fetch(
        `${API_URL}/api/host/bookings/${booking._id}/${action}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { Accept: "application/json" },
        }
      );

      const result: ActionResponse = await response
        .json()
        .catch(() => ({
          success: false,
          message: "Invalid server response.",
        }));

      if (response.status === 401) {
        toast.error("Session expired. Please log in again.");
        router.replace("/login");
        return;
      }

      if (response.status === 409) {
        toast.error(
          result.message ||
            "This booking was already processed."
        );
        setConfirmation(null);

        const latest = await fetchHostBookings();
        setBookings(latest);
        return;
      }

      if (!response.ok || !result.success) {
        toast.error(
          result.message || "Unable to update booking."
        );
        return;
      }

      // Update the visible calendar only after server success.
      const status: BookingStatus =
        action === "approve" ? "confirmed" : "cancelled";

      setBookings((current) =>
        current.map((item) =>
          item._id === booking._id
            ? { ...item, status }
            : item
        )
      );

      setConfirmation(null);

      toast.success(
        action === "approve"
          ? "Booking approved successfully."
          : "Booking rejected successfully."
      );
    } catch (err) {
      console.error("Calendar booking action error:", err);

      toast.error(
        err instanceof Error
          ? err.message
          : "Could not connect to the server."
      );
    } finally {
      setProcessing(false);
    }
  }

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

  const cardStyle = {
    background: "var(--ss-surface)",
    borderColor: "var(--ss-border)",
  };

  const inputStyle = {
    background: "var(--ss-surface-alt)",
    borderColor: "var(--ss-border)",
    color: "var(--ss-ink)",
  };

  return (
    <main className="min-h-screen">
      <section className="bg-[#171024] px-5 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-200"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-300">
                <CalendarDays size={17} />
                HOST SCHEDULING
              </p>
              <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Booking Calendar
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-violet-200">
                Explore reservations by day and manage
                pending booking requests.
              </p>
            </div>

            <button
              type="button"
              onClick={refresh}
              disabled={loading || refreshing || processing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh Calendar
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-7 px-5 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Monthly Bookings",
              value: monthSummary.total,
              icon: CalendarDays,
            },
            {
              label: "Confirmed",
              value: monthSummary.confirmed,
              icon: CheckCircle2,
            },
            {
              label: "Pending",
              value: monthSummary.pending,
              icon: Clock3,
            },
            {
              label: "Cancelled",
              value: monthSummary.cancelled,
              icon: XCircle,
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border p-5"
                style={cardStyle}
              >
                <Icon
                  size={20}
                  className="text-violet-600 dark:text-violet-300"
                />
                <p
                  className="mt-3 text-xs font-semibold"
                  style={{ color: "var(--ss-muted)" }}
                >
                  {stat.label}
                </p>
                <p
                  className="mt-2 text-3xl font-extrabold"
                  style={{ color: "var(--ss-ink)" }}
                >
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        <div
          className="grid gap-4 rounded-2xl border p-5 sm:grid-cols-2"
          style={cardStyle}
        >
          <div>
            <label
              htmlFor="calendar-studio"
              className="mb-2 block text-sm font-semibold"
              style={{ color: "var(--ss-ink)" }}
            >
              Studio
            </label>
            <select
              id="calendar-studio"
              value={studioFilter}
              onChange={(event) =>
                setStudioFilter(event.target.value)
              }
              className="w-full rounded-xl border px-4 py-3 text-sm"
              style={inputStyle}
            >
              <option value="all">All Studios</option>
              {studios.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="calendar-status"
              className="mb-2 block text-sm font-semibold"
              style={{ color: "var(--ss-ink)" }}
            >
              Booking Status
            </label>
            <select
              id="calendar-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="w-full rounded-xl border px-4 py-3 text-sm"
              style={inputStyle}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-3 rounded-2xl border" style={cardStyle}>
            <LoaderCircle className="animate-spin text-violet-700" />
            <span style={{ color: "var(--ss-muted)" }}>
              Loading reservations...
            </span>
          </div>
        ) : error ? (
          <div
            className="rounded-2xl border p-10 text-center"
            style={cardStyle}
          >
            <XCircle
              size={36}
              className="mx-auto text-red-500"
            />
            <h2
              className="mt-4 text-lg font-bold"
              style={{ color: "var(--ss-ink)" }}
            >
              Unable to Load Calendar
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
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
            <section
              className="overflow-hidden rounded-2xl border"
              style={cardStyle}
            >
              <div
                className="flex flex-wrap items-center justify-between gap-4 border-b p-5"
                style={{ borderColor: "var(--ss-border)" }}
              >
                <div>
                  <h2
                    className="text-xl font-extrabold"
                    style={{ color: "var(--ss-ink)" }}
                  >
                    {visibleMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--ss-muted)" }}
                  >
                    Select a date to view bookings.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    aria-label="Previous month"
                    className="rounded-xl border p-2.5"
                    style={{
                      borderColor: "var(--ss-border)",
                      color: "var(--ss-ink)",
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={goToToday}
                    className="rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-bold text-white"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    aria-label="Next month"
                    className="rounded-xl border p-2.5"
                    style={{
                      borderColor: "var(--ss-border)",
                      color: "var(--ss-ink)",
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 border-b border-violet-500/10">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="py-4 text-center text-xs font-bold"
                    style={{ color: "var(--ss-muted)" }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 p-2 sm:gap-2 sm:p-4">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-20 sm:min-h-24"
                      />
                    );
                  }

                  const key = dateKey(date);
                  const dayBookings =
                    bookingsByDate.get(key) || [];

                  const selected = key === selectedDate;
                  const isToday = key === dateKey(today);

                  const confirmed = dayBookings.filter(
                    (booking) => booking.status === "confirmed"
                  ).length;
                  const pending = dayBookings.filter(
                    (booking) => booking.status === "pending"
                  ).length;
                  const cancelled = dayBookings.filter(
                    (booking) => booking.status === "cancelled"
                  ).length;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDate(key)}
                      aria-pressed={selected}
                      aria-label={`${formatDate(date)}, ${dayBookings.length} bookings`}
                      className={`flex min-h-20 flex-col items-center rounded-xl border p-2 text-center transition sm:min-h-24 ${
                        selected
                          ? "border-violet-700 bg-violet-500/15"
                          : "border-transparent bg-violet-500/5 hover:border-violet-400/30"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          isToday ? "bg-violet-700 text-white" : ""
                        }`}
                        style={
                          isToday
                            ? undefined
                            : { color: "var(--ss-ink)" }
                        }
                      >
                        {date.getDate()}
                      </span>

                      {dayBookings.length > 0 && (
                        <>
                          <span
                            className="mt-1 text-[10px] font-semibold"
                            style={{ color: "var(--ss-muted)" }}
                          >
                            {dayBookings.length} booking
                            {dayBookings.length === 1 ? "" : "s"}
                          </span>
                          <div className="mt-2 flex flex-wrap justify-center gap-1">
                            {confirmed > 0 && (
                              <span
                                title={`${confirmed} confirmed`}
                                className="h-2 w-2 rounded-full bg-green-500"
                              />
                            )}
                            {pending > 0 && (
                              <span
                                title={`${pending} pending`}
                                className="h-2 w-2 rounded-full bg-amber-500"
                              />
                            )}
                            {cancelled > 0 && (
                              <span
                                title={`${cancelled} cancelled`}
                                className="h-2 w-2 rounded-full bg-red-500"
                              />
                            )}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              <div
                className="flex flex-wrap gap-5 border-t p-5"
                style={{ borderColor: "var(--ss-border)" }}
              >
                {[
                  { label: "Confirmed", color: "bg-green-500" },
                  { label: "Pending", color: "bg-amber-500" },
                  { label: "Cancelled", color: "bg-red-500" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2"
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${item.color}`}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "var(--ss-muted)" }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section
              className="overflow-hidden rounded-2xl border"
              style={cardStyle}
            >
              <div
                className="border-b p-5"
                style={{ borderColor: "var(--ss-border)" }}
              >
                <h2
                  className="text-lg font-extrabold"
                  style={{ color: "var(--ss-ink)" }}
                >
                  {selectedDateObject
                    ? formatDate(selectedDateObject)
                    : selectedDate}
                </h2>
                <p
                  className="mt-2 text-xs"
                  style={{ color: "var(--ss-muted)" }}
                >
                  {selectedBookings.length} reservation
                  {selectedBookings.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="max-h-[650px] space-y-4 overflow-y-auto p-4">
                {selectedBookings.length === 0 ? (
                  <div className="py-14 text-center">
                    <CalendarDays
                      size={38}
                      className="mx-auto text-violet-400"
                    />
                    <p
                      className="mt-4 font-semibold"
                      style={{ color: "var(--ss-ink)" }}
                    >
                      No bookings for this day
                    </p>
                    <p
                      className="mt-2 text-xs"
                      style={{ color: "var(--ss-muted)" }}
                    >
                      Select another date or change your filters.
                    </p>
                  </div>
                ) : (
                  selectedBookings.map((booking) => (
                    <article
                      key={booking._id}
                      className="rounded-xl border p-4"
                      style={{
                        borderColor: "var(--ss-border)",
                        background: "var(--ss-surface-alt)",
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <StatusBadge status={booking.status} />
                        <strong className="text-sm text-violet-700 dark:text-violet-300">
                          {money(booking.totalAmount)}
                        </strong>
                      </div>

                      <h3
                        className="mt-4 font-bold"
                        style={{ color: "var(--ss-ink)" }}
                      >
                        {booking.studioTitle || "Studio Reservation"}
                      </h3>

                      <p
                        className="mt-3 flex items-center gap-2 text-sm"
                        style={{ color: "var(--ss-muted)" }}
                      >
                        <Clock3 size={16} />
                        {booking.startTime} – {booking.endTime}
                      </p>

                      <p
                        className="mt-2 flex items-center gap-2 text-sm"
                        style={{ color: "var(--ss-muted)" }}
                      >
                        <Users size={16} />
                        {booking.userName || "Customer"}
                      </p>

                      {booking.userEmail && (
                        <p
                          className="mt-2 break-all text-xs"
                          style={{ color: "var(--ss-muted)" }}
                        >
                          {booking.userEmail}
                        </p>
                      )}

                      {booking.status === "pending" && (
                        <div className="mt-5 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={processing}
                            onClick={() =>
                              askToUpdate(booking, "approve")
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            <ThumbsUp size={15} />
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={processing}
                            onClick={() =>
                              askToUpdate(booking, "reject")
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            <ThumbsDown size={15} />
                            Reject
                          </button>
                        </div>
                      )}

                      <Link
                        href={`/studios/${booking.studioId}`}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:underline dark:text-violet-300"
                      >
                        <MapPin size={14} />
                        Studio Details
                        <ArrowRight size={14} />
                      </Link>
                    </article>
                  ))
                )}
              </div>

              <div
                className="border-t p-4"
                style={{ borderColor: "var(--ss-border)" }}
              >
                <Link
                  href="/host-bookings"
                  className="flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800"
                >
                  Manage Host Bookings
                  <ArrowRight size={16} />
                </Link>
              </div>
            </section>
          </div>
        )}

        <p
          className="text-xs leading-6"
          style={{ color: "var(--ss-muted)" }}
        >
          Booking dates and times are displayed as stored by the
          server. Pending reservations are not confirmed.
          Approval or rejection is processed by the host
          booking API before the calendar is updated.
        </p>
      </section>

      {confirmation && (
        <div
          role="presentation"
          className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 p-4"
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-confirm-title"
            className="w-full max-w-md rounded-2xl border border-violet-200 bg-white p-6 shadow-2xl dark:border-violet-400/20 dark:bg-[#21172f]"
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="calendar-confirm-title"
                className="text-xl font-extrabold text-slate-950 dark:text-white"
              >
                {confirmation.action === "approve"
                  ? "Approve Booking?"
                  : "Reject Booking?"}
              </h2>
              <button
                type="button"
                disabled={processing}
                onClick={() => setConfirmation(null)}
                aria-label="Close confirmation"
                className="text-slate-500 dark:text-violet-200"
              >
                <X size={21} />
              </button>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-violet-200">
              {confirmation.action === "approve"
                ? "This reservation will become confirmed."
                : "This reservation will be cancelled. The customer will no longer have an active pending booking."}
            </p>

            <div className="mt-4 rounded-xl bg-violet-50 p-4 text-sm text-violet-950 dark:bg-violet-500/10 dark:text-violet-100">
              <p className="font-bold">
                {confirmation.booking.studioTitle ||
                  "Studio Reservation"}
              </p>
              <p className="mt-2">
                {confirmation.booking.date}
              </p>
              <p>
                {confirmation.booking.startTime} –{" "}
                {confirmation.booking.endTime}
              </p>
              <p className="mt-2">
                {confirmation.booking.userName || "Customer"}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={processing}
                onClick={() => setConfirmation(null)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-violet-400/30 dark:text-violet-100"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => void confirmAction()}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-50 ${
                  confirmation.action === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processing && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}
                {processing
                  ? "Processing..."
                  : confirmation.action === "approve"
                    ? "Confirm Approval"
                    : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
