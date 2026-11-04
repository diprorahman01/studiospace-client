
"use client";
import { createPortal } from "react-dom";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import type { Studio } from "@/types/studio";

type Props = {
  studio: Studio;
};

type BookingResponse = {
  success: boolean;
  message?: string;
  data?: {
    _id: string;
    status: string;
  };
};

type AvailabilitySlot = {
  startTime: string;
  endTime: string;
  available: boolean;
  reason: string | null;
};

type AvailabilityResponse = {
  success: boolean;
  message?: string;
  data?: {
    studioId: string;
    date: string;
    bookable: boolean;
    slots: AvailabilitySlot[];
  };
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const TIME_SLOTS = Array.from(
  { length: 25 },
  (_, index) => {
    const minutes = 8 * 60 + index * 30;

    return `${String(
      Math.floor(minutes / 60)
    ).padStart(2, "0")}:${String(
      minutes % 60
    ).padStart(2, "0")}`;
  }
);

function toMinutes(time: string) {
  const [hours, minutes] =
    time.split(":").map(Number);

  return hours * 60 + minutes;
}

function formatTime(time: string) {
  const [hours, minutes] =
    time.split(":").map(Number);

  return `${hours % 12 || 12}:${String(
    minutes
  ).padStart(2, "0")} ${
    hours >= 12 ? "PM" : "AM"
  }`;
}

function utcDate() {
  return new Date().toISOString().slice(0, 10);
}

function money(amount: number) {
  return `$${amount.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

function isBookable(studio: Studio) {
  return (
    studio.isDemo !== true &&
    (studio.status == null ||
      studio.status === "active")
  );
}

export default function BookingModal({
  studio,
}: Props) {
  const router = useRouter();

  const {
    data: session,
    isPending: checkingSession,
  } = authClient.useSession();

  const bookable = isBookable(studio);

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] =
    useState("10:00");
  const [endTime, setEndTime] =
    useState("12:00");

  const [submitting, setSubmitting] =
    useState(false);

  const [availability, setAvailability] =
    useState<AvailabilitySlot[]>([]);

  const [availabilityLoading, setAvailabilityLoading] =
    useState(false);

  const [availabilityError, setAvailabilityError] =
    useState("");

  const [refreshKey, setRefreshKey] = useState(0);
  const [today] = useState(() => utcDate());

  // Load availability whenever the date, studio,
  // or refresh key changes.
  useEffect(() => {
    if (!open || !date || !bookable) {
      return;
    }

    const controller = new AbortController();

    async function loadAvailability() {
      setAvailabilityLoading(true);
      setAvailability([]);
      setAvailabilityError("");

      try {
        const response = await fetch(
          `${API_URL}/api/bookings/availability/${
            studio._id
          }?date=${encodeURIComponent(date)}`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          }
        );

        const result: AvailabilityResponse =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Unable to load availability."
          );
        }

        if (
          !result.data ||
          !Array.isArray(result.data.slots)
        ) {
          throw new Error(
            "The server returned invalid availability."
          );
        }

        if (controller.signal.aborted) return;

        setAvailability(result.data.slots);
      } catch (error) {
        if (controller.signal.aborted) return;

        setAvailabilityError(
          error instanceof Error
            ? error.message
            : "Unable to load availability."
        );
      } finally {
        if (!controller.signal.aborted) {
          setAvailabilityLoading(false);
        }
      }
    }

    void loadAvailability();

    return () => controller.abort();
  }, [
    open,
    date,
    bookable,
    studio._id,
    refreshKey,
  ]);

  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  const validTime = endMinutes > startMinutes;
  const validDate =
    date !== "" && date >= today;

  const duration = Math.max(
    0,
    (endMinutes - startMinutes) / 60
  );

  const hourlyRate =
    Number(studio.hourlyRate) || 0;

  const securityDeposit =
    Number(studio.securityDeposit) || 0;

  const rentalCost = useMemo(
    () =>
      Math.round(
        duration * hourlyRate * 100
      ) / 100,
    [duration, hourlyRate]
  );

  const total =
    Math.round(
      (rentalCost + securityDeposit) * 100
    ) / 100;

  // All half-hour slots included in the selected
  // booking interval must be available.
  const selectedSlots = availability.filter(
    (slot) =>
      toMinutes(slot.startTime) >= startMinutes &&
      toMinutes(slot.startTime) < endMinutes
  );

  const expectedSlotCount =
    validTime ? (endMinutes - startMinutes) / 30 : 0;

  const selectionAvailable =
    validDate &&
    validTime &&
    !availabilityLoading &&
    !availabilityError &&
    expectedSlotCount > 0 &&
    selectedSlots.length === expectedSlotCount &&
    selectedSlots.every((slot) => slot.available);

  const availableCount = availability.filter(
    (slot) => slot.available
  ).length;

  function closeModal() {
    if (!submitting) setOpen(false);
  }

  function selectAvailableSlot(
    slot: AvailabilitySlot
  ) {
    if (!slot.available || submitting) return;

    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
  }

  async function handleBooking() {
    if (submitting) return;

    if (!bookable) {
      toast.error(
        "This studio is unavailable for booking."
      );
      return;
    }

    if (checkingSession) {
      toast.info("Checking your session...");
      return;
    }

    if (!session?.user) {
      toast.error(
        "Please log in to book a studio."
      );
      setOpen(false);
      router.push("/login");
      return;
    }

    if (!validDate || !validTime) {
      toast.error(
        "Select a valid date and time."
      );
      return;
    }

    if (!selectionAvailable) {
      toast.error(
        "The selected time is not available. Choose a free time slot."
      );
      return;
    }

    setSubmitting(true);

    try {
      
const response = await fetch(
  "/api/bookings",
  {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      studioId: studio._id,
      date,
      startTime,
      endTime,
    }),
  }
);


      const result: BookingResponse =
        await response.json();

      if (response.status === 401) {
        toast.error(
          "Your login session has expired."
        );
        setOpen(false);
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        toast.error(
          result.message ||
            "This studio cannot be booked."
        );
        setOpen(false);
        return;
      }

      if (response.status === 409) {
        toast.error(
          result.message ||
            "This time slot was just booked. Refresh availability."
        );
        setRefreshKey((key) => key + 1);
        return;
      }

      if (!response.ok || !result.success) {
        toast.error(
          result.message ||
            "Unable to create booking."
        );
        return;
      }

      toast.success(
        result.message ||
          "Booking submitted successfully!"
      );

      setOpen(false);
      setDate("");
      setStartTime("10:00");
      setEndTime("12:00");
      setAvailability([]);

      router.refresh();
    } catch (error) {
      console.error("Booking error:", error);

      toast.error(
        "Could not connect to the server."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!bookable) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-violet-300/30 bg-violet-700/15 px-6 py-3.5 text-sm font-semibold text-violet-700 opacity-80 dark:text-violet-300"
        >
          <LockKeyhole size={18} />
          Booking Unavailable
        </button>

        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-3 text-xs leading-5 text-violet-800 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200"
        >
          <AlertCircle
            size={16}
            className="mt-0.5 shrink-0"
          />
          <span>
            This studio is currently unavailable.
            Reservations are not being accepted.
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-800"
      >
        <CalendarDays size={19} />
        Book Workspace Now
        <ArrowRight size={17} />
      </button>

      {open &&
  createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/70 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          event.stopPropagation();
          closeModal();
        }
      }}
    >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#21172f]"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 dark:border-violet-400/20">
              <div>
                <h2
                  id="booking-modal-title"
                  className="text-xl font-bold text-slate-950 dark:text-white"
                >
                  Reserve Your Studio
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-violet-200">
                  Choose your preferred date and time.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                aria-label="Close booking modal"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:text-violet-200 dark:hover:bg-violet-500/20"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6">
              {/* Studio information */}
              <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 dark:border-violet-400/20 dark:bg-violet-500/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                  Selected Studio
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                  {studio.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-violet-200">
                  {money(hourlyRate)} per hour
                </p>
              </div>

              {!checkingSession && !session?.user && (
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <AlertCircle
                    size={19}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />
                  <p className="text-sm text-amber-900">
                    You must log in before confirming a booking.
                  </p>
                </div>
              )}

              {/* Date */}
              <div>
                <label
                  htmlFor="booking-date"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white"
                >
                  <CalendarDays
                    size={17}
                    className="text-violet-700 dark:text-violet-300"
                  />
                  Booking Date
                </label>

                <input
                  id="booking-date"
                  type="date"
                  value={date}
                  min={today}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setAvailability([]);
                    setAvailabilityError("");
                  }}
                  disabled={submitting}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600 disabled:opacity-60 dark:border-violet-400/30 dark:bg-[#30213f] dark:text-white"
                />
              </div>

              {/* Live availability */}
              <section className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 dark:border-violet-400/20 dark:bg-violet-500/5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Live Availability
                    </h3>

                    <p className="mt-1 text-xs text-slate-500 dark:text-violet-200">
                      8:00 AM – 8:00 PM · 30-minute slots
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setRefreshKey((key) => key + 1)
                    }
                    disabled={
                      !date ||
                      submitting ||
                      availabilityLoading
                    }
                    aria-label="Refresh availability"
                    className="rounded-lg border border-violet-200 p-2 text-violet-700 hover:bg-violet-100 disabled:opacity-40 dark:border-violet-400/30 dark:text-violet-300 dark:hover:bg-violet-500/15"
                  >
                    <RefreshCw
                      size={17}
                      className={
                        availabilityLoading
                          ? "animate-spin"
                          : ""
                      }
                    />
                  </button>
                </div>

                {!date ? (
                  <p className="rounded-lg bg-white px-3 py-5 text-center text-sm text-slate-500 dark:bg-[#30213f] dark:text-violet-200">
                    Select a date to view available hours.
                  </p>
                ) : availabilityLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-violet-700 dark:text-violet-300">
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Checking available times...
                  </div>
                ) : availabilityError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {availabilityError}
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-600 dark:text-violet-200">
                        {availableCount} of{" "}
                        {availability.length} slots available
                      </span>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-violet-700 dark:text-violet-300">
                          <span className="h-2.5 w-2.5 rounded-full bg-violet-600" />
                          Available
                        </span>

                        <span className="flex items-center gap-1 text-slate-500 dark:text-violet-200">
                          <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                          Reserved
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {availability.map((slot) => {
                        const selected =
                          slot.available &&
                          toMinutes(slot.startTime) >=
                            startMinutes &&
                          toMinutes(slot.startTime) <
                            endMinutes;

                        return (
                          <button
                            key={slot.startTime}
                            type="button"
                            disabled={
                              !slot.available || submitting
                            }
                            onClick={() =>
                              selectAvailableSlot(slot)
                            }
                            aria-label={`${formatTime(
                              slot.startTime
                            )} ${
                              slot.available
                                ? "available"
                                : slot.reason === "past"
                                  ? "past"
                                  : "unavailable"
                            }`}
                            aria-pressed={selected}
                            className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition ${
                              !slot.available
                                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through dark:border-violet-400/10 dark:bg-[#302a39] dark:text-slate-400"
                                : selected
                                  ? "border-violet-700 bg-violet-700 text-white"
                                  : "border-violet-200 bg-white text-violet-700 hover:border-violet-600 hover:bg-violet-100 dark:border-violet-400/30 dark:bg-[#30213f] dark:text-violet-200 dark:hover:bg-violet-500/20"
                            }`}
                          >
                            {formatTime(slot.startTime)}
                          </button>
                        );
                      })}
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-violet-200">
                      Click a free slot to select 30 minutes,
                      or use the start and end selectors below
                      for a longer booking.
                    </p>
                  </>
                )}
              </section>

              {/* Time selection */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="booking-start"
                    className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white"
                  >
                    <Clock3
                      size={17}
                      className="text-violet-700 dark:text-violet-300"
                    />
                    Start Time
                  </label>

                  <select
                    id="booking-start"
                    value={startTime}
                    onChange={(event) =>
                      setStartTime(event.target.value)
                    }
                    disabled={submitting}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600 disabled:opacity-60 dark:border-violet-400/30 dark:bg-[#30213f] dark:text-white"
                  >
                    {TIME_SLOTS.slice(0, -1).map(
                      (time) => (
                        <option
                          key={time}
                          value={time}
                        >
                          {formatTime(time)}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="booking-end"
                    className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white"
                  >
                    <Clock3
                      size={17}
                      className="text-violet-700 dark:text-violet-300"
                    />
                    End Time
                  </label>

                  <select
                    id="booking-end"
                    value={endTime}
                    onChange={(event) =>
                      setEndTime(event.target.value)
                    }
                    disabled={submitting}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600 disabled:opacity-60 dark:border-violet-400/30 dark:bg-[#30213f] dark:text-white"
                  >
                    {TIME_SLOTS.slice(1).map(
                      (time) => (
                        <option
                          key={time}
                          value={time}
                        >
                          {formatTime(time)}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* Selection validation */}
              {date &&
                !availabilityLoading &&
                !availabilityError && (
                  <div
                    className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
                      selectionAvailable
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-amber-200 bg-amber-50 text-amber-900"
                    }`}
                  >
                    {selectionAvailable ? (
                      <CheckCircle2
                        size={18}
                        className="shrink-0"
                      />
                    ) : (
                      <AlertCircle
                        size={18}
                        className="shrink-0"
                      />
                    )}

                    <span>
                      {selectionAvailable
                        ? "Your selected time is currently available."
                        : "This time range is unavailable. Choose only free slots."}
                    </span>
                  </div>
                )}

              {/* Duration */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-violet-400/20">
                <span className="text-sm text-slate-600 dark:text-violet-200">
                  Selected Duration
                </span>

                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {duration > 0
                    ? `${duration} hour${
                        duration === 1 ? "" : "s"
                      }`
                    : "Invalid time range"}
                </span>
              </div>

              {/* Price summary */}
              <div className="rounded-xl border border-slate-200 p-5 dark:border-violet-400/20">
                <h3 className="mb-4 font-bold text-slate-950 dark:text-white">
                  Booking Summary
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-600 dark:text-violet-200">
                      Studio Rental
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {money(rentalCost)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-600 dark:text-violet-200">
                      Security Deposit
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {money(securityDeposit)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 dark:border-violet-400/20">
                    <span className="font-bold text-slate-950 dark:text-white">
                      Total Amount
                    </span>
                    <span className="text-xl font-extrabold text-violet-700 dark:text-violet-300">
                      {money(total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-violet-200">
                <ShieldCheck
                  size={17}
                  className="shrink-0 text-violet-700 dark:text-violet-300"
                />
                <span>
                  Your booking will be submitted as pending.
                  No online payment is collected at this stage.
                </span>
              </div>
            </div>

            {/* Confirmation */}
            <div className="border-t border-slate-100 px-6 py-5 dark:border-violet-400/20">
              <button
                type="button"
                onClick={handleBooking}
                disabled={
                  submitting ||
                  checkingSession ||
                  !selectionAvailable
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-6 py-3.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                    Submitting Booking...
                  </>
                ) : availabilityLoading ? (
                  <>
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                    Checking Availability...
                  </>
                ) : (
                  <>
                    {session?.user ? (
                      <CheckCircle2 size={19} />
                    ) : (
                      <LockKeyhole size={19} />
                    )}
                    Confirm Booking
                  </>
                )}
              </button>
            </div>
          </div>
                </div>,
        document.body
      )}
    </>
  );
}
