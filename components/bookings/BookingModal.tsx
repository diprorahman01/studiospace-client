
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LockKeyhole,
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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const TIME_SLOTS = Array.from({ length: 25 }, (_, index) => {
  const total = 8 * 60 + index * 30;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}`;
});

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return `${hours % 12 || 12}:${String(minutes).padStart(
    2,
    "0"
  )} ${hours >= 12 ? "PM" : "AM"}`;
}

function localDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// All booking amounts now use dollars.
function money(amount: number) {
  return `$${amount.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

export default function BookingModal({ studio }: Props) {
  const router = useRouter();

  const {
    data: session,
    isPending: checkingSession,
  } = authClient.useSession();

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [submitting, setSubmitting] = useState(false);

  const [today] = useState(() => localDate());

  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  const validTime = endMinutes > startMinutes;
  const validDate = date !== "" && date >= today;

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

  const total = rentalCost + securityDeposit;

  function closeModal() {
    if (!submitting) {
      setOpen(false);
    }
  }

  async function handleBooking() {
    if (submitting) return;

    if (checkingSession) {
      toast.info("Checking your session...");
      return;
    }

    if (!session?.user) {
      toast.error("Please log in to book a studio.");
      setOpen(false);
      router.push("/login");
      return;
    }

    if (!validDate) {
      toast.error("Please select a future booking date.");
      return;
    }

    if (!validTime) {
      toast.error("End time must be after start time.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/bookings`,
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

      const result: BookingResponse = await response.json();

      if (response.status === 401) {
        toast.error("Your login session has expired.");
        setOpen(false);
        router.push("/login");
        return;
      }

      if (response.status === 409) {
        toast.error(
          result.message ||
            "This time slot has already been booked."
        );
        return;
      }

      if (!response.ok || !result.success) {
        toast.error(
          result.message || "Unable to create booking."
        );
        return;
      }

      toast.success(
        result.message || "Booking submitted successfully!"
      );

      setOpen(false);
      setDate("");
      setStartTime("10:00");
      setEndTime("12:00");

      router.refresh();
    } catch (error) {
      console.error("Booking error:", error);

      toast.error(
        "Could not connect to the server. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Open booking dialog */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-6 py-3.5 text-sm font-semibold text-white hover:bg-violet-800"
      >
        <CalendarDays size={19} />
        Book Workspace Now
        <ArrowRight size={17} />
      </button>

      {open && (
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
                  Choose your preferred date and time.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                aria-label="Close booking modal"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6">
              {/* Selected studio */}
              <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                  Selected Studio
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-950">
                  {studio.title}
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  {money(hourlyRate)} per hour
                </p>
              </div>

              {/* Authentication notice */}
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
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600 disabled:opacity-60"
                />
              </div>

              {/* Booking times */}
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
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600 disabled:opacity-60"
                  >
                    {TIME_SLOTS.slice(0, -1).map((time) => (
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
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600 disabled:opacity-60"
                  >
                    {TIME_SLOTS.slice(1).map((time) => (
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

              {/* Price summary - all amounts in USD */}
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
                      {money(rentalCost)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-600">
                      Security Deposit
                    </span>

                    <span className="font-medium text-slate-900">
                      {money(securityDeposit)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-3">
                    <span className="font-bold text-slate-950">
                      Total Amount
                    </span>

                    <span className="text-xl font-extrabold text-violet-700">
                      {money(total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                <ShieldCheck
                  size={17}
                  className="shrink-0 text-violet-700"
                />

                <span>
                  Your booking will be submitted as pending.
                  No online payment is collected at this stage.
                </span>
              </div>
            </div>

            {/* Submit */}
            <div className="border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={handleBooking}
                disabled={
                  submitting ||
                  checkingSession ||
                  !validDate ||
                  !validTime
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
