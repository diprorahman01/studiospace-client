
"use client";

import { useState } from "react";
import {
  CalendarDays,
  Clock3,
  Info,
  X,
} from "lucide-react";
import type { Studio } from "@/types/studio";

interface BookingModalProps {
  studio: Studio;
}

const timeSlots = Array.from({ length: 25 }, (_, index) => {
  const hour = Math.floor(index / 2) + 8;
  const minute = index % 2 === 0 ? "00" : "30";

  return `${String(hour).padStart(2, "0")}:${minute}`;
});

function formatTime(time: string) {
  const [hourString, minute] = time.split(":");
  const hour = Number(hourString);

  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

export default function BookingModal({ studio }: BookingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Date based on the visitor's local calendar
  const [today] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  });

  const startMinutes = startTime
    ? Number(startTime.split(":")[0]) * 60 +
      Number(startTime.split(":")[1])
    : 0;

  const endMinutes = endTime
    ? Number(endTime.split(":")[0]) * 60 +
      Number(endTime.split(":")[1])
    : 0;

  const duration =
    startTime && endTime && endMinutes > startMinutes
      ? (endMinutes - startMinutes) / 60
      : 0;

  const rentalPrice = duration * studio.hourlyRate;
  const deposit = studio.securityDeposit ?? 0;
  const total = rentalPrice + deposit;

  const isValid =
    date !== "" &&
    date >= today &&
    startTime !== "" &&
    endTime !== "" &&
    duration > 0;

  function closeModal() {
    setIsOpen(false);
  }

  function handleContinue() {
    if (!isValid) return;

    // Authentication and booking API will be added later.
    console.log("Booking selection:", {
      studioId: studio._id,
      date,
      startTime,
      endTime,
      duration,
      total,
    });

    closeModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3.5 font-semibold text-white transition hover:bg-violet-800"
      >
        <CalendarDays size={19} />
        Book Workspace Now
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
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
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="booking-modal-title"
                  className="text-2xl font-bold text-slate-950"
                >
                  Book Your Studio
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {studio.title}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close booking modal"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mt-7 space-y-5">
              {/* Booking date */}
              <div>
                <label
                  htmlFor="booking-date"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Booking Date
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-700"
                  />

                  <input
                    id="booking-date"
                    type="date"
                    min={today}
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-11 pr-3 text-sm text-slate-800 outline-none focus:border-violet-600"
                  />
                </div>
              </div>

              {/* Times */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="booking-start"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Start Time
                  </label>

                  <select
                    id="booking-start"
                    value={startTime}
                    onChange={(event) => {
                      setStartTime(event.target.value);
                      setEndTime("");
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-violet-600"
                  >
                    <option value="">Select start time</option>

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
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    End Time
                  </label>

                  <select
                    id="booking-end"
                    value={endTime}
                    disabled={!startTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-violet-600 disabled:bg-slate-100"
                  >
                    <option value="">Select end time</option>

                    {timeSlots
                      .filter((time) => time > startTime)
                      .map((time) => (
                        <option key={time} value={time}>
                          {formatTime(time)}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-[#f8f7fd] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Clock3 size={19} className="text-violet-700" />
                  <h3 className="font-bold text-slate-950">
                    Booking Summary
                  </h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Hourly Rate</span>
                    <span className="font-medium text-slate-900">
                      ${studio.hourlyRate}/hour
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Duration</span>
                    <span className="font-medium text-slate-900">
                      {duration} hours
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Rental Cost</span>
                    <span className="font-medium text-slate-900">
                      ${rentalPrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">
                      Security Deposit
                    </span>
                    <span className="font-medium text-slate-900">
                      ${deposit.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-t border-violet-200 pt-4">
                    <span className="font-bold text-slate-950">
                      Estimated Total
                    </span>
                    <span className="text-xl font-extrabold text-violet-700">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4">
                <Info
                  size={19}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <p className="text-xs leading-6 text-amber-900">
                  This is a booking preview only. Your reservation
                  will not be saved until the secure booking system
                  is connected.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!isValid}
                  className="flex-1 rounded-lg bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Preview Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
