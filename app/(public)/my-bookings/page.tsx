
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
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

type FilterType = "all" | BookingStatus;

type Booking = {
  _id: string;
  studioId: string;
  studioTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  hourlyRate?: number;
  rentalCost: number;
  securityDeposit: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  rescheduledAt?: string;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: Booking[] | Booking;
};

type Slot = {
  startTime: string;
  endTime: string;
  available: boolean;
  reason: string | null;
};

type AvailabilityResponse = {
  success: boolean;
  message?: string;
  data?: {
    slots: Slot[];
  };
};

const filters: {
  label: string;
  value: FilterType;
}[] = [
  { label: "All Bookings", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Cancelled", value: "cancelled" },
];

const TIME_OPTIONS = Array.from(
  { length: 25 },
  (_, index) => {
    const minutes = 480 + index * 30;

    return `${String(
      Math.floor(minutes / 60)
    ).padStart(2, "0")}:${String(
      minutes % 60
    ).padStart(2, "0")}`;
  }
);

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatMoney(amount: number) {
  return `$${Number(amount || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return value;

  return new Date(
    Date.UTC(year, month - 1, day)
  ).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
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

function StatusBadge({
  status,
}: {
  status: BookingStatus;
}) {
  const config = {
    pending: {
      icon: Clock3,
      className: "bg-amber-50 text-amber-700",
    },
    confirmed: {
      icon: CheckCircle2,
      className: "bg-green-50 text-green-700",
    },
    cancelled: {
      icon: XCircle,
      className: "bg-red-50 text-red-700",
    },
  };

  const selected = config[status];
  const Icon = selected.icon;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${selected.className}`}
    >
      <Icon size={14} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function MyBookingsPage() {
  const router = useRouter();

  const {
    data: session,
    isPending: checkingSession,
  } = authClient.useSession();

  const userId = session?.user?.id;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const [confirmId, setConfirmId] =
    useState<string | null>(null);

  const [cancellingId, setCancellingId] =
    useState<string | null>(null);

  const [rescheduleBooking, setRescheduleBooking] =
    useState<Booking | null>(null);

  const [newDate, setNewDate] = useState("");
  const [newStart, setNewStart] = useState("10:00");
  const [newEnd, setNewEnd] = useState("12:00");

  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] =
    useState<Slot[]>([]);
  const [availabilityLoading, setAvailabilityLoading] =
    useState(false);
  const [availabilityError, setAvailabilityError] =
    useState("");
  const [refreshSlots, setRefreshSlots] = useState(0);

  const [today] = useState(todayUTC);

  const loadBookings = useCallback(
    async (signal?: AbortSignal) => {
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
        throw new Error("UNAUTHORIZED");
      }

      const result: ApiResponse = await response.json();

      if (
        !response.ok ||
        !result.success ||
        !Array.isArray(result.data)
      ) {
        throw new Error(
          result.message || "Failed to load bookings."
        );
      }

      return result.data;
    },
    []
  );

  useEffect(() => {
    if (checkingSession || !userId) return;

    const controller = new AbortController();

    async function fetchInitialBookings() {
      try {
        const data = await loadBookings(controller.signal);

        if (!controller.signal.aborted) {
          setBookings(data);
          setError("");
        }
      } catch (err) {
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
  }, [checkingSession, userId, router, loadBookings]);

  async function handleRefresh() {
    if (loading || refreshing) return;

    setRefreshing(true);

    try {
      const data = await loadBookings();
      setBookings(data);
      setError("");
      toast.success("Bookings updated.");
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === "UNAUTHORIZED"
      ) {
        router.replace("/login");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Could not refresh bookings."
        );
      }
    } finally {
      setRefreshing(false);
    }
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

      const result: ApiResponse = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        toast.error(
          result.message || "Could not cancel booking."
        );
        return;
      }

      toast.success(
        result.message || "Booking cancelled."
      );

      setConfirmId(null);
      await handleRefreshAfterAction();
    } catch (err) {
      console.error("Cancel booking error:", err);
      toast.error("Could not connect to the server.");
    } finally {
      setCancellingId(null);
    }
  }

  async function handleRefreshAfterAction() {
    try {
      const data = await loadBookings();
      setBookings(data);
      setError("");
    } catch {
      toast.error("Please refresh the bookings page.");
    }
  }

  function openReschedule(booking: Booking) {
    if (booking.status !== "pending") return;

    setRescheduleBooking(booking);
    setNewDate(booking.date);
    setNewStart(booking.startTime);
    setNewEnd(booking.endTime);
    setAvailability([]);
    setAvailabilityError("");
    setRefreshSlots((value) => value + 1);
  }

  // Keep availability associated with the selected booking
  // and date, so an old response cannot be used incorrectly.
  const availabilityKey = rescheduleBooking
    ? `${rescheduleBooking._id}|${newDate}|${refreshSlots}`
    : "";

  const [availabilityResult, setAvailabilityResult] =
    useState<{
      key: string;
      slots: Slot[];
      error: string;
    } | null>(null);

  useEffect(() => {
    if (!rescheduleBooking || !newDate) return;

    const controller = new AbortController();

    async function fetchAvailability() {
      try {
        const response = await fetch(
          `${API_URL}/api/bookings/availability/${
            rescheduleBooking!.studioId
          }?date=${encodeURIComponent(newDate)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result: AvailabilityResponse =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Unable to load available times."
          );
        }

        if (!result.data?.slots) {
          throw new Error("Invalid availability response.");
        }

        if (!controller.signal.aborted) {
          setAvailabilityResult({
            key: availabilityKey,
            slots: result.data.slots,
            error: "",
          });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setAvailabilityResult({
            key: availabilityKey,
            slots: [],
            error:
              err instanceof Error
                ? err.message
                : "Failed to load availability.",
          });
        }
      }
    }

    void fetchAvailability();

    return () => controller.abort();
  }, [
    rescheduleBooking,
    newDate,
    refreshSlots,
    availabilityKey,
  ]);

  const currentAvailability =
    availabilityResult?.key === availabilityKey
      ? availabilityResult
      : null;

  const currentSlots =
    currentAvailability?.slots ?? [];

  const slotsLoading =
    Boolean(rescheduleBooking && newDate) &&
    currentAvailability === null;

  // The existing booking occupies its own original slots.
  // Those slots may be reused when moving or extending it,
  // because the backend excludes this booking from its
  // conflict check.
  function slotAvailable(slot: Slot) {
    if (slot.available) return true;

    if (
      !rescheduleBooking ||
      newDate !== rescheduleBooking.date ||
      slot.reason !== "reserved"
    ) {
      return false;
    }

    return (
      toMinutes(slot.startTime) >=
        toMinutes(rescheduleBooking.startTime) &&
      toMinutes(slot.endTime) <=
        toMinutes(rescheduleBooking.endTime)
    );
  }

  const selectedStart = toMinutes(newStart);
  const selectedEnd = toMinutes(newEnd);

  const selectedSlots = currentSlots.filter(
    (slot) =>
      toMinutes(slot.startTime) >= selectedStart &&
      toMinutes(slot.startTime) < selectedEnd
  );

  const validSelection =
    newDate >= today &&
    selectedEnd > selectedStart &&
    selectedStart >= 480 &&
    selectedEnd <= 1200 &&
    selectedSlots.length ===
      (selectedEnd - selectedStart) / 30 &&
    selectedSlots.every(slotAvailable) &&
    !slotsLoading &&
    !currentAvailability?.error;

  const isUnchanged =
    Boolean(rescheduleBooking) &&
    newDate === rescheduleBooking?.date &&
    newStart === rescheduleBooking?.startTime &&
    newEnd === rescheduleBooking?.endTime;

  const newDuration = Math.max(
    0,
    (selectedEnd - selectedStart) / 60
  );

  const estimatedRate =
    rescheduleBooking?.hourlyRate ??
    (rescheduleBooking?.duration
      ? rescheduleBooking.rentalCost /
        rescheduleBooking.duration
      : 0);

  const estimatedTotal =
    Math.round(
      (newDuration * estimatedRate +
        (rescheduleBooking?.securityDeposit ?? 0)) *
        100
    ) / 100;

  async function handleReschedule() {
    if (
      !rescheduleBooking ||
      !validSelection ||
      isUnchanged ||
      saving
    ) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/api/bookings/${
          rescheduleBooking._id
        }/reschedule`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            date: newDate,
            startTime: newStart,
            endTime: newEnd,
          }),
        }
      );

      const result: ApiResponse = await response.json();

      if (response.status === 401) {
        toast.error("Please log in again.");
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        toast.error(
          result.message ||
            "Could not reschedule booking."
        );

        if (response.status === 409) {
          setRefreshSlots((value) => value + 1);
          await handleRefreshAfterAction();
        }

        return;
      }

      toast.success(
        result.message || "Booking rescheduled!"
      );

      setRescheduleBooking(null);
      await handleRefreshAfterAction();
    } catch (err) {
      console.error("Rescheduling error:", err);
      toast.error("Could not connect to the server.");
    } finally {
      setSaving(false);
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
                Review your studio reservations, reschedule
                pending bookings, and track their status.
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

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl bg-white">
            <LoaderCircle className="h-9 w-9 animate-spin text-violet-700" />
            <p className="text-sm text-slate-500">
              Loading your bookings...
            </p>
          </div>
        ) : error ? (
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
          <div className="rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
            <Search
              size={35}
              className="mx-auto mb-5 text-violet-600"
            />
            <h2 className="text-xl font-bold text-slate-950">
              {filter === "all"
                ? "No bookings yet"
                : `No ${filter} bookings`}
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              {filter === "all"
                ? "Explore studios and book your first session."
                : "There are no bookings matching this filter."}
            </p>
            <Link
              href="/studios"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white"
            >
              Find a Studio
              <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
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
                        className="mt-0.5 text-violet-700"
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
                        className="mt-0.5 text-violet-700"
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
                        className="mt-0.5 text-violet-700"
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
                        className="mt-0.5 text-violet-700"
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
                      ? "Awaiting host confirmation"
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
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => openReschedule(booking)}
                        disabled={Boolean(cancellingId)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
                      >
                        <CalendarClock size={17} />
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(booking._id)}
                        disabled={Boolean(cancellingId)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle size={17} />
                        Cancel Booking
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Reschedule modal */}
      {rescheduleBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reschedule-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#21172f]"
          >
            <div className="flex items-start justify-between border-b border-slate-100 p-5 dark:border-violet-400/20">
              <div>
                <h2
                  id="reschedule-title"
                  className="text-xl font-bold text-slate-950 dark:text-white"
                >
                  Reschedule Booking
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-violet-200">
                  {rescheduleBooking.studioTitle}
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setRescheduleBooking(null)}
                aria-label="Close rescheduling"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-violet-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[65vh] space-y-5 overflow-y-auto p-5">
              <div className="rounded-xl bg-violet-50 p-4 text-sm text-violet-800 dark:bg-violet-500/10 dark:text-violet-200">
                Current booking:{" "}
                <strong>{formatDate(rescheduleBooking.date)}</strong>
                {" · "}
                {formatTime(rescheduleBooking.startTime)}
                {" – "}
                {formatTime(rescheduleBooking.endTime)}
              </div>

              <div>
                <label
                  htmlFor="reschedule-date"
                  className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white"
                >
                  New Booking Date
                </label>
                <input
                  id="reschedule-date"
                  type="date"
                  min={today}
                  value={newDate}
                  disabled={saving}
                  onChange={(event) =>
                    setNewDate(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-violet-400/30 dark:bg-[#30213f] dark:text-white"
                />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Available Time Slots
                  </h3>
                  <button
                    type="button"
                    disabled={slotsLoading || saving}
                    onClick={() =>
                      setRefreshSlots((value) => value + 1)
                    }
                    className="rounded-lg p-2 text-violet-700 hover:bg-violet-50 dark:text-violet-300"
                    aria-label="Refresh available slots"
                  >
                    <RefreshCw
                      size={17}
                      className={
                        slotsLoading ? "animate-spin" : ""
                      }
                    />
                  </button>
                </div>

                {slotsLoading ? (
                  <div className="flex justify-center gap-2 py-5 text-sm text-violet-700">
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Checking availability...
                  </div>
                ) : currentAvailability?.error ? (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {currentAvailability.error}
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {currentSlots.map((slot) => {
                      const available = slotAvailable(slot);

                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          disabled={!available || saving}
                          onClick={() => {
                            setNewStart(slot.startTime);
                            setNewEnd(slot.endTime);
                          }}
                          className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                            !available
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:bg-white/5"
                              : newStart === slot.startTime
                                ? "border-violet-700 bg-violet-700 text-white"
                                : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-200"
                          }`}
                        >
                          {formatTime(slot.startTime)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-white">
                  Start Time
                  <select
                    value={newStart}
                    disabled={saving}
                    onChange={(event) =>
                      setNewStart(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm dark:border-violet-400/30 dark:bg-[#30213f] dark:text-white"
                  >
                    {TIME_OPTIONS.slice(0, -1).map((time) => (
                      <option key={time} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-slate-900 dark:text-white">
                  End Time
                  <select
                    value={newEnd}
                    disabled={saving}
                    onChange={(event) =>
                      setNewEnd(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm dark:border-violet-400/30 dark:bg-[#30213f] dark:text-white"
                  >
                    {TIME_OPTIONS.slice(1).map((time) => (
                      <option key={time} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {!isUnchanged && (
                <div
                  className={`rounded-xl border p-3 text-sm ${
                    validSelection
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-amber-200 bg-amber-50 text-amber-900"
                  }`}
                >
                  {validSelection
                    ? "This time is currently available."
                    : "Choose a free time range. All selected slots must be available."}
                </div>
              )}

              <div className="rounded-xl border border-violet-200 p-4 dark:border-violet-400/20">
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-slate-600 dark:text-violet-200">
                    Estimated New Total
                  </span>
                  <span className="text-lg font-bold text-violet-700 dark:text-violet-300">
                    {formatMoney(estimatedTotal)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-violet-200">
                  The server will calculate the final amount
                  using the studio&apos;s current hourly rate.
                  Your booking remains pending.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 p-5 dark:border-violet-400/20">
              <button
                type="button"
                onClick={handleReschedule}
                disabled={
                  saving ||
                  slotsLoading ||
                  !validSelection ||
                  isUnchanged
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <CalendarClock size={18} />
                    Confirm Reschedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
              This will cancel your pending reservation
              and release its reserved time slots.
              This action cannot be undone.
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
                onClick={() =>
                  void handleCancelBooking(confirmId)
                }
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
