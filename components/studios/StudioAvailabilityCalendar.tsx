
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import type { Studio } from "@/types/studio";

type Props = {
  studio: Studio;
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
    studioId: string;
    date: string;
    bookable: boolean;
    slots: Slot[];
  };
};

type AvailabilityState = {
  requestKey: string;
  slots: Slot[];
  error: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const WEEKDAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

function getToday() {
  // Uses the same UTC date convention
  // as the existing backend availability API.
  return new Date().toISOString().slice(0, 10);
}

function dateFromParts(
  year: number,
  month: number,
  day: number
) {
  return [
    year,
    String(month + 1).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function getMonthTitle(
  year: number,
  month: number
) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(
    new Date(Date.UTC(year, month, 1))
  );
}

function displayTime(time: string) {
  const [hours, minutes] =
    time.split(":").map(Number);

  return `${hours % 12 || 12}:${String(
    minutes
  ).padStart(2, "0")} ${
    hours >= 12 ? "PM" : "AM"
  }`;
}

function isBookable(studio: Studio) {
  return (
    studio.isDemo !== true &&
    (
      studio.status == null ||
      studio.status === "active"
    )
  );
}

export default function StudioAvailabilityCalendar({
  studio,
}: Props) {
  const [today] = useState(getToday);

  const [selectedDate, setSelectedDate] =
    useState(today);

  const [year, setYear] = useState(() =>
    Number(today.slice(0, 4))
  );

  const [month, setMonth] = useState(() =>
    Number(today.slice(5, 7)) - 1
  );

  const [refreshKey, setRefreshKey] =
    useState(0);

  // Keep the response associated with its request.
  // This avoids clearing React state synchronously
  // inside useEffect.
  const [availabilityState, setAvailabilityState] =
    useState<AvailabilityState | null>(null);

  const bookable = isBookable(studio);

  const currentMonth = today.slice(0, 7);

  const displayedMonth = dateFromParts(
    year,
    month,
    1
  ).slice(0, 7);

  const canGoPrevious =
    displayedMonth > currentMonth;

  // The key changes whenever the studio, date,
  // or refresh counter changes.
  const requestKey =
    `${studio._id}|${selectedDate}|${refreshKey}`;

  // Only show data matching the current request.
  // Old results cannot appear under a new date.
  const currentAvailability =
    availabilityState?.requestKey === requestKey
      ? availabilityState
      : null;

  const slots = currentAvailability?.slots ?? [];

  const error =
    currentAvailability?.error ?? "";

  const loading =
    bookable &&
    selectedDate >= today &&
    currentAvailability === null;

  // ==========================================
  // MONTH CALENDAR DAYS
  // ==========================================

  const days = useMemo(() => {
    const startDay = new Date(
      Date.UTC(year, month, 1)
    ).getUTCDay();

    const daysInMonth = new Date(
      Date.UTC(year, month + 1, 0)
    ).getUTCDate();

    const cells: Array<number | null> = [
      ...Array<null>(startDay).fill(null),
    ];

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      cells.push(day);
    }

    return cells;
  }, [year, month]);

  // ==========================================
  // FETCH STUDIO AVAILABILITY
  // ==========================================

  useEffect(() => {
    // No request is needed for an unavailable
    // studio or a date in the past.
    if (!bookable || selectedDate < today) {
      return;
    }

    const controller = new AbortController();

    async function fetchAvailability() {
      try {
        const response = await fetch(
          `${API_URL}/api/bookings/availability/${
            studio._id
          }?date=${encodeURIComponent(selectedDate)}`,
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
              "Could not load studio availability."
          );
        }

        if (
          !result.data ||
          !Array.isArray(result.data.slots)
        ) {
          throw new Error(
            "The server returned invalid availability data."
          );
        }

        if (controller.signal.aborted) {
          return;
        }

        // State changes only after the async
        // request finishes successfully.
        setAvailabilityState({
          requestKey,
          slots: result.data.slots,
          error: "",
        });
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        setAvailabilityState({
          requestKey,
          slots: [],
          error:
            err instanceof Error
              ? err.message
              : "Could not load availability.",
        });
      }
    }

    void fetchAvailability();

    return () => {
      controller.abort();
    };
  }, [
    studio._id,
    selectedDate,
    today,
    bookable,
    requestKey,
  ]);

  // ==========================================
  // AVAILABILITY STATISTICS
  // ==========================================

  const availableCount = slots.filter(
    (slot) => slot.available
  ).length;

  const reservedCount = slots.filter(
    (slot) => slot.reason === "reserved"
  ).length;

  const unavailableCount = slots.filter(
    (slot) =>
      !slot.available &&
      slot.reason !== "reserved"
  ).length;

  // ==========================================
  // CHANGE CALENDAR MONTH
  // ==========================================

  function changeMonth(direction: number) {
    const next = new Date(
      Date.UTC(year, month + direction, 1)
    );

    const nextYear = next.getUTCFullYear();
    const nextMonth = next.getUTCMonth();

    const nextMonthValue = dateFromParts(
      nextYear,
      nextMonth,
      1
    );

    // Prevent navigation to previous months.
    if (
      nextMonthValue.slice(0, 7) <
      currentMonth
    ) {
      return;
    }

    setYear(nextYear);
    setMonth(nextMonth);

    setSelectedDate(
      nextMonthValue < today
        ? today
        : nextMonthValue
    );
  }

  function refreshAvailability() {
    if (loading || !bookable) {
      return;
    }

    setRefreshKey((current) => current + 1);
  }

  // ==========================================
  // COMPONENT UI
  // ==========================================

  return (
    <div className="space-y-5">
      {/* Section heading */}
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-950 dark:text-white">
          <CalendarDays
            size={22}
            className="text-violet-700 dark:text-violet-300"
          />
          Studio Availability
        </h2>

        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-violet-200">
          Choose a date to view available and reserved
          studio time slots.
        </p>
      </div>

      {/* Unavailable listing notice */}
      {!bookable && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <span>
            This studio is not currently accepting bookings.
          </span>
        </div>
      )}

      {/* ======================================
          MONTH CALENDAR
          ====================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-violet-400/20 dark:bg-[#261b35]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {getMonthTitle(year, month)}
          </h3>

          <div className="flex items-center gap-2">
            {/* Previous month */}
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              disabled={!canGoPrevious}
              aria-label="Previous month"
              className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:border-violet-400 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-violet-400/20 dark:text-white dark:hover:bg-violet-500/20"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Next month */}
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:border-violet-400 hover:bg-violet-50 dark:border-violet-400/20 dark:text-white dark:hover:bg-violet-500/20"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold text-slate-500 dark:text-violet-200"
            >
              {day}
            </div>
          ))}

          {days.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  aria-hidden="true"
                />
              );
            }

            const value = dateFromParts(
              year,
              month,
              day
            );

            const past = value < today;
            const selected =
              value === selectedDate;

            const disabled =
              past || !bookable;

            return (
              <button
                key={value}
                type="button"
                disabled={disabled}
                onClick={() =>
                  setSelectedDate(value)
                }
                aria-label={`Select ${value}`}
                aria-pressed={selected}
                className={`flex aspect-square items-center justify-center rounded-xl border text-sm font-semibold transition ${
                  selected
                    ? "border-violet-700 bg-violet-700 text-white shadow-md"
                    : disabled
                      ? "cursor-not-allowed border-transparent bg-slate-50 text-slate-300 dark:bg-white/5 dark:text-violet-400/30"
                      : "border-transparent bg-violet-50 text-violet-800 hover:border-violet-400 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/25"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-slate-500 dark:text-violet-200">
          Select a date to check its available hours.
          Individual day availability is loaded
          after selection.
        </p>
      </div>

      {/* ======================================
          SELECTED DATE AVAILABILITY
          ====================================== */}

      {bookable && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-violet-400/20 dark:bg-[#261b35]">
          {/* Availability heading */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Available Time Slots
              </h3>

              <p className="mt-1 text-xs text-slate-500 dark:text-violet-200">
                {selectedDate} · 8 AM to 8 PM
              </p>
            </div>

            {/* Refresh button */}
            <button
              type="button"
              onClick={refreshAvailability}
              disabled={loading}
              aria-label="Refresh studio availability"
              className="inline-flex items-center gap-2 rounded-lg border border-violet-200 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50 dark:border-violet-400/30 dark:text-violet-300 dark:hover:bg-violet-500/15"
            >
              <RefreshCw
                size={15}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-10 text-sm text-violet-700 dark:text-violet-300">
              <LoaderCircle
                size={20}
                className="animate-spin"
              />
              Loading availability...
            </div>
          ) : error ? (
            /* Error message */
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle
                size={18}
                className="shrink-0"
              />
              {error}
            </div>
          ) : slots.length > 0 ? (
            <>
              {/* Statistics */}
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-300">
                  {availableCount} Available
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-violet-200">
                  {reservedCount} Reserved
                </span>

                {unavailableCount > 0 && (
                  <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    {unavailableCount} Past / Unavailable
                  </span>
                )}
              </div>

              {/* Time slots */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {slots.map((slot) => {
                  const slotLabel = slot.available
                    ? "Available"
                    : slot.reason === "reserved"
                      ? "Reserved"
                      : slot.reason === "past"
                        ? "Past"
                        : "Unavailable";

                  return (
                    <div
                      key={slot.startTime}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3 text-center ${
                        slot.available
                          ? "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200"
                          : "border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-violet-400/60"
                      }`}
                    >
                      <Clock3 size={15} />

                      <span className="text-xs font-bold">
                        {displayTime(
                          slot.startTime
                        )}
                      </span>

                      <span className="text-[11px]">
                        {slotLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Booking guidance */}
              <p className="mt-5 text-xs leading-6 text-slate-500 dark:text-violet-200">
                To reserve a time, select
                Book Workspace Now in the
                booking sidebar.
                Availability is checked
                again before a booking
                request is accepted.
              </p>
            </>
          ) : (
            /* Empty state */
            <p className="py-8 text-center text-sm text-slate-500 dark:text-violet-200">
              No availability information
              found for this date.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
