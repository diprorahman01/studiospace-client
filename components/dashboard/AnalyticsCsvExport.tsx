"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";

export type ExportBooking = {
  _id: string;
  studioId: string;
  studioTitle?: string;
  status: string;
  totalAmount?: number;
  createdAt?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  userName?: string;
};

type Props = { bookings: ExportBooking[]; period: string };

function safeCell(value: unknown): string {
  const raw = String(value ?? "");
  const protectedValue = /^[\s]*[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${protectedValue.replace(/"/g, '""')}"`;
}

function dateText(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString().slice(0, 10);
}

export default function AnalyticsCsvExport({ bookings, period }: Props) {
  function download() {
    if (!bookings.length) {
      toast.info("No bookings to export for this period.");
      return;
    }
    const headers = [
      "Booking ID", "Studio ID", "Studio Name", "Customer Name",
      "Booking Date", "Start Time", "End Time", "Created Date",
      "Status", "Booking Value (USD)",
    ];
    const rows = bookings.map((b) => [
      b._id, b.studioId, b.studioTitle ?? "Studio", b.userName ?? "",
      dateText(b.date), b.startTime ?? "", b.endTime ?? "",
      dateText(b.createdAt), b.status,
      Number.isFinite(b.totalAmount) ? Number(b.totalAmount).toFixed(2) : "0.00",
    ]);
    const content = [headers, ...rows].map((row) => row.map(safeCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `studiospace-host-bookings-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(`Exported ${bookings.length} bookings.`);
  }

  return (
    <button type="button" onClick={download} disabled={!bookings.length}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50">
      <Download size={17} /> Export CSV
    </button>
  );
}
