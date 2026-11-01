
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import type { Studio } from "@/types/studio";

type BookingModalProps = {
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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const timeSlots = Array.from({ length: 25 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}`;
});

function minutesFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const hour = hours % 12 || 12;
  const period = hours >= 12 ? "PM" : "AM";

  return `${hour}:${String(minutes).padStart(2, "0")} ${period}`;
}

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMoney(value: number) {
  return `৳${value.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default function BookingModal({
  studio,
}: BookingModalProps) {
  const router = useRouter();
  const { data: session, isPending: checkingSession } =
    authClient.useSession();

  const [isOpen, setIsOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [submitting, setSubmitting] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(getLocalDate());
  }, []);

  const startMinutes = minutesFromTime(startTime);
  const endMinutes = minutesFromTime(endTime);

  const duration = Math.max(
    0,
    (endMinutes - startMinutes) / 60
  );

  const hourlyRate = Number(studio.hourlyRate) || 0;
  const securityDeposit = Number(studio.securityDeposit) || 0;

  const rentalCost = useMemo(
    () => Math.round(duration * hourlyRate * 100) / 100,
    [duration, hourlyRate]
  );

  const totalAmount = rentalCost + securityDeposit;

  const validTimes = endMinutes > startMinutes;

  const validDate =
    Boolean(bookingDate) &&
    Boolean(today) &&
    bookingDate >= today;

  function closeModal() {
    if (submitting) return;
    setIsOpen(false);
  }

  async function handleBooking() {
    if (checkingSession) {
      toast.info("Checking your login session...");
      return;
    }

    if (!session?.user) {
      toast.error("Please log in before booking a studio.");
      setIsOpen(false);
      router.push("/login");
      return;
    }

    if (!validDate) {
      toast.error("Please select a valid booking date.");
      return;
    }

    if (!validTimes) {
      toast.error("End time must be later than start time.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studioId: studio._id,
          date: bookingDate,
          startTime,
          endTime,
        }),
      });

      const result: BookingResponse = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          toast.error("Your session has expired. Please log in.");
          setIsOpen(false);
          router.push("/login");
          return;
        }

        if (response.status === 409) {
          toast.error(
            result.message ||
              "This studio is unavailable for the selected time."
          );
          return;
        }

        toast.error(
          result.message || "Failed to create booking."
        );
        return;
      }

      toast.success(
        result.message || "Booking request submitted!"
      );

      setIsOpen(false);
      setBookingDate("");
      setStartTime("10:00");
      setEndTime("12:00");

      router.refresh();
    } catch (error) {
      console.error("Booking request error:", error);

      toast.error(
        "Could not connect to the booking server. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Open modal button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-800"
      >
        <CalendarDays size={19} />
        Book Workspace Now
        <ArrowRight size={17} />
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2
                  id="booking-modal-title"
                  className="text-xl font-bold text-slate-950"
                >
                  Reserve Your Studio
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select your preferred booking schedule.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                aria-label="Close booking modal"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6">
              {/* Studio summary */}
              <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                  Selected Studio
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-950">
                  {studio.title}
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  {formatMoney(hourlyRate)} per hour
                </p>
              </div>

              {/* Login notice */}
              {!checkingSession && !session?.user && (
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <AlertCircle
                    size={19}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />
                  <p className="text-sm text-amber-900">
                    You must log in before submitting a booking.
                  </p>
                </div>
              )}

              {/* Date */}
              <div>
                <label
                  htmlFor="booking-date"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"
                >
                  <CalendarDays
                    size={17}
                    className="text-violet-700"
                  />
                  Booking Date
                </label>

                <input
                  id="booking-date"
                  type="date"
                  value={bookingDate}
                  min={today || undefined}
                  onChange={(event) =>
                    setBookingDate(event.target.value)
                  }
                  disabled={submitting}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600 disabled:opacity-60"
                />
              </div>

              {/* Time selectors */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="booking-start"
                    className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"
                  >
                    <Clock3
                      size={17}
                      className="text-violet-700"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600 disabled:opacity-60"
                  >
                    {timeSlots.slice(0, -1).map((time) => (
                      <option key={time} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="booking-end"
                    className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"
                  >
                    <Clock3
                      size={17}
                      className="text-violet-700"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600 disabled:opacity-60"
                  >
                    {timeSlots.slice(1).map((time) => (
                      <option key={time} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <span className="text-sm text-slate-600">
                  Selected Duration
                </span>

                <span className="text-sm font-semibold text-slate-900">
                  {duration > 0
                    ? `${duration} hour${duration === 1 ? "" : "s"}`
                    : "Invalid time range"}
                </span>
              </div>

              {/* Price summary */}
              <div className="rounded-xl border border-slate-200 p-5">
                <h3 className="mb-4 font-bold text-slate-950">
                  Booking Summary
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-600">
                      Studio Rental
                    </span>

                    <span className="font-medium text-slate-900">
                      {formatMoney(rentalCost)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-600">
                      Security Deposit
                    </span>

                    <span className="font-medium text-slate-900">
                      {formatMoney(securityDeposit)}
                    </span>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-bold text-slate-950">
                        Total Amount
                      </span>

                      <span className="text-xl font-extrabold text-violet-700">
                        {formatMoney(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                <ShieldCheck
                  size={17}
                  className="shrink-0 text-violet-700"
                />
                <span>
                  Submitting creates a pending booking request.
                  No online payment is collected at this stage.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={handleBooking}
                disabled={
                  submitting ||
                  checkingSession ||
                  !validDate ||
                  !validTimes
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                    Submitting Booking...
                  </>
                ) : checkingSession ? (
                  <>
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                    Checking Session...
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
        </div>
      )}
    </>
  );
}
