"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, BarChart3, Building2, CalendarCheck2,
  Clock3, DollarSign, LoaderCircle, RefreshCw, TrendingUp, Users, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import AnalyticsCsvExport, { type ExportBooking } from "@/components/dashboard/AnalyticsCsvExport";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
type Studio = { _id: string; title: string; status?: string; hourlyRate: number };
type Booking = ExportBooking;
type Period = "30" | "90" | "365" | "all";
type ResponseData<T> = { success?: boolean; message?: string; data?: T[]; bookings?: T[] };

function usd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}
function amount(b: Booking) {
  return typeof b.totalAmount === "number" && Number.isFinite(b.totalAmount) && b.totalAmount >= 0 ? b.totalAmount : 0;
}
function dateOf(value?: string) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}
function inPeriod(b: Booking, period: Period, now: Date) {
  if (period === "all") return true;
  const date = dateOf(b.createdAt);
  if (!date) return false;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - Number(period));
  return date >= cutoff && date <= now;
}
async function getList<T>(route: string, signal?: AbortSignal): Promise<T[]> {
  const response = await fetch(`${API_URL}${route}`, {
    credentials: "include", cache: "no-store", signal,
    headers: { Accept: "application/json" },
  });
  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (!response.ok) throw new Error(`Failed to load ${route} (${response.status}).`);
  const json: ResponseData<T> | T[] = await response.json();
  if (Array.isArray(json)) return json;
  if (json.success === false) throw new Error(json.message || "Unable to load analytics.");
  const result = json.data ?? json.bookings;
  if (!Array.isArray(result)) throw new Error(`Unexpected response from ${route}.`);
  return result;
}
function Metric({ title, value, detail, icon: Icon }: {
  title: string; value: string | number; detail: string; icon: typeof Building2;
}) {
  return (
    <article className="rounded-2xl border p-6" style={{ background: "var(--ss-surface)", borderColor: "var(--ss-border)" }}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-semibold" style={{ color: "var(--ss-muted)" }}>{title}</span>
        <div className="rounded-xl bg-violet-500/10 p-3 text-violet-700 dark:text-violet-300"><Icon size={21} /></div>
      </div>
      <p className="mt-4 text-3xl font-extrabold" style={{ color: "var(--ss-ink)" }}>{value}</p>
      <p className="mt-2 text-xs leading-5" style={{ color: "var(--ss-muted)" }}>{detail}</p>
    </article>
  );
}
export default function HostAnalyticsPage() {
  const router = useRouter();
  const { data: session, isPending: checkingSession } = authClient.useSession();
  const userId = session?.user?.id;
  const [studios, setStudios] = useState<Studio[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [period, setPeriod] = useState<Period>("90");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [asOf, setAsOf] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    const [s, b] = await Promise.all([
      getList<Studio>("/api/studios/mine", signal),
      getList<Booking>("/api/host/bookings", signal),
    ]);
    return { s, b };
  }, []);

  useEffect(() => {
    if (checkingSession || !userId) return;
    const controller = new AbortController();
    load(controller.signal).then(({ s, b }) => {
      if (controller.signal.aborted) return;
      setStudios(s); setBookings(b); setError(""); setAsOf(new Date().toISOString());
    }).catch((e: unknown) => {
      if (controller.signal.aborted) return;
      if (e instanceof Error && e.message === "UNAUTHORIZED") {
        router.replace("/login"); return;
      }
      setError(e instanceof Error ? e.message : "Could not load analytics.");
    }).finally(() => {
      if (!controller.signal.aborted) { setLoading(false); setRefreshing(false); }
    });
    return () => controller.abort();
  }, [checkingSession, userId, load, refreshKey, router]);

  function refresh() {
    if (loading || refreshing) return;
    setRefreshing(true);
    setRefreshKey((n) => n + 1);
    toast.info("Refreshing analytics...");
  }

  const now = useMemo(() => (asOf ? new Date(asOf) : new Date(0)), [asOf]);
  const reportBookings = useMemo(() => bookings.filter((b) => inPeriod(b, period, now)), [bookings, period, now]);
  const report = useMemo(() => {
    const confirmed = reportBookings.filter((b) => b.status?.toLowerCase() === "confirmed");
    const pending = reportBookings.filter((b) => b.status?.toLowerCase() === "pending");
    const cancelled = reportBookings.filter((b) => b.status?.toLowerCase() === "cancelled");
    const confirmedValue = confirmed.reduce((sum, b) => sum + amount(b), 0);
    const monthly = new Map<string, { total: number; confirmed: number; value: number }>();
    for (const b of reportBookings) {
      const date = dateOf(b.createdAt);
      if (!date) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthly.get(key) ?? { total: 0, confirmed: 0, value: 0 };
      entry.total++;
      if (b.status?.toLowerCase() === "confirmed") { entry.confirmed++; entry.value += amount(b); }
      monthly.set(key, entry);
    }
    const months = [...monthly.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12);
    const performance = studios.map((s) => {
      const own = reportBookings.filter((b) => String(b.studioId) === String(s._id));
      const approved = own.filter((b) => b.status?.toLowerCase() === "confirmed");
      return {
        ...s, total: own.length, confirmed: approved.length,
        pending: own.filter((b) => b.status?.toLowerCase() === "pending").length,
        value: approved.reduce((sum, b) => sum + amount(b), 0),
      };
    }).sort((a, b) => b.value - a.value || b.confirmed - a.confirmed);
    return {
      total: reportBookings.length, confirmed: confirmed.length,
      pending: pending.length, cancelled: cancelled.length,
      value: confirmedValue, average: confirmed.length ? confirmedValue / confirmed.length : 0,
      months, performance,
    };
  }, [reportBookings, studios]);
  const maxMonth = Math.max(1, ...report.months.map(([, v]) => v.total));
  const maxStudio = Math.max(1, ...report.performance.map((s) => s.value));

  if (checkingSession || !userId) {
    return <main className="flex min-h-[70vh] items-center justify-center gap-3"><LoaderCircle className="animate-spin text-violet-600" /> Checking your account...</main>;
  }

  return (
    <main className="min-h-screen">
      <header className="bg-[#171024] px-5 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-200"><ArrowLeft size={16} /> Back to Dashboard</Link>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-300"><BarChart3 size={16} /> Host Performance</p>
              <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Studio Analytics</h1>
              <p className="mt-3 text-sm text-violet-200">Bookings, confirmed booking value, monthly trends, and studio performance.</p>
            </div>
            <button type="button" disabled={loading || refreshing} onClick={refresh} className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold disabled:opacity-50"><RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /> Refresh Data</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-10">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5" style={{ background: "var(--ss-surface)", borderColor: "var(--ss-border)" }}>
          <div><h2 className="font-bold" style={{ color: "var(--ss-ink)" }}>Reporting Period</h2><p className="mt-1 text-xs" style={{ color: "var(--ss-muted)" }}>Based on booking creation date.</p></div>
          <div className="flex flex-wrap gap-3">
            <select aria-label="Analytics reporting period" value={period} onChange={(e) => setPeriod(e.target.value as Period)}
              className="rounded-xl border px-4 py-3 text-sm font-semibold" style={{ background: "var(--ss-surface-alt)", borderColor: "var(--ss-border)", color: "var(--ss-ink)" }}>
              <option value="30">Last 30 Days</option><option value="90">Last 90 Days</option><option value="365">Last 12 Months</option><option value="all">All Time</option>
            </select>
            <AnalyticsCsvExport bookings={reportBookings} period={period} />
          </div>
        </section>
        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-3"><LoaderCircle className="animate-spin text-violet-600" /> Loading analytics...</div>
        ) : error ? (
          <section className="rounded-2xl border p-10 text-center" style={{ background: "var(--ss-surface)", borderColor: "var(--ss-border)" }}>
            <XCircle size={36} className="mx-auto text-red-500" />
            <h2 className="mt-4 text-lg font-bold">Unable to Load Analytics</h2>
            <p className="mt-2 text-sm">{error}</p>
            <button type="button" onClick={refresh} className="mt-5 rounded-xl bg-violet-700 px-5 py-3 text-white">Try Again</button>
          </section>
        ) : (
          <>
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <Metric title="My Studios" value={studios.length} detail="Studios owned by your account" icon={Building2} />
              <Metric title="Total Reservations" value={report.total} detail="Created during the selected reporting period" icon={Users} />
              <Metric title="Confirmed Bookings" value={report.confirmed} detail="Currently confirmed reservations" icon={CalendarCheck2} />
              <Metric title="Pending Requests" value={report.pending} detail="Awaiting a host decision" icon={Clock3} />
              <Metric title="Confirmed Booking Value" value={usd(report.value)} detail="Booking value, not verified payments or actual earnings" icon={DollarSign} />
              <Metric title="Average Confirmed Value" value={usd(report.average)} detail="Mean amount per confirmed booking" icon={TrendingUp} />
            </section>
            <section className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-2xl border p-6" style={{ background: "var(--ss-surface)", borderColor: "var(--ss-border)" }}>
                <h2 className="flex items-center gap-2 text-lg font-extrabold" style={{ color: "var(--ss-ink)" }}><BarChart3 size={20} className="text-violet-600" /> Monthly Booking Trend</h2>
                <p className="mt-2 text-xs" style={{ color: "var(--ss-muted)" }}>Bookings created each month</p>
                {report.months.length === 0 ? <p className="py-16 text-center text-sm" style={{ color: "var(--ss-muted)" }}>No dated bookings in this period.</p> : (
                  <div className="mt-8 flex h-56 items-end gap-3 overflow-x-auto border-b border-violet-500/15 pb-2">
                    {report.months.map(([key, entry]) => (
                      <div key={key} className="flex h-full min-w-12 flex-1 flex-col items-center justify-end gap-2">
                        <span className="text-xs font-bold" style={{ color: "var(--ss-ink)" }}>{entry.total}</span>
                        <div title={`${entry.total} bookings; ${entry.confirmed} confirmed`} className="w-full max-w-12 rounded-t-lg bg-violet-600" style={{ height: `${Math.max(4, entry.total / maxMonth * 165)}px` }} />
                        <span className="whitespace-nowrap text-[10px]" style={{ color: "var(--ss-muted)" }}>{key}</span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
              <article className="rounded-2xl border p-6" style={{ background: "var(--ss-surface)", borderColor: "var(--ss-border)" }}>
                <h2 className="text-lg font-extrabold" style={{ color: "var(--ss-ink)" }}>Booking Status Breakdown</h2>
                <p className="mt-2 text-xs" style={{ color: "var(--ss-muted)" }}>Current status across bookings in the period</p>
                <div className="mt-8 space-y-7">
                  {[
                    { name: "Confirmed", count: report.confirmed, style: "bg-green-500" },
                    { name: "Pending", count: report.pending, style: "bg-amber-500" },
                    { name: "Cancelled", count: report.cancelled, style: "bg-red-500" },
                  ].map((item) => {
                    const percentage = report.total ? item.count / report.total * 100 : 0;
                    return (
                      <div key={item.name}>
                        <div className="mb-2 flex justify-between gap-2 text-sm"><span style={{ color: "var(--ss-ink)" }}>{item.name}</span><span style={{ color: "var(--ss-muted)" }}>{item.count} ({percentage.toFixed(1)}%)</span></div>
                        <div className="h-3 overflow-hidden rounded-full bg-violet-500/10"><div className={`h-full rounded-full ${item.style}`} style={{ width: `${percentage}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </article>
            </section>
            <section className="rounded-2xl border p-6" style={{ background: "var(--ss-surface)", borderColor: "var(--ss-border)" }}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><h2 className="text-xl font-extrabold" style={{ color: "var(--ss-ink)" }}>Performance by Studio</h2><p className="mt-1 text-xs" style={{ color: "var(--ss-muted)" }}>Sorted by confirmed booking value</p></div>
                <Link href="/my-listings" className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 dark:text-violet-300">Manage Studios <ArrowRight size={16} /></Link>
              </div>
              {report.performance.length === 0 ? <p className="py-12 text-center text-sm" style={{ color: "var(--ss-muted)" }}>No studios to report.</p> : (
                <div className="mt-6 space-y-4">
                  {report.performance.map((studio) => (
                    <div key={studio._id} className="rounded-xl border p-4" style={{ background: "var(--ss-surface-alt)", borderColor: "var(--ss-border)" }}>
                      <div className="flex flex-wrap justify-between gap-3">
                        <div><p className="font-bold" style={{ color: "var(--ss-ink)" }}>{studio.title}</p><p className="mt-1 text-xs" style={{ color: "var(--ss-muted)" }}>{studio.total} bookings · {studio.confirmed} confirmed · {studio.pending} pending</p></div>
                        <span className="text-sm font-extrabold text-violet-700 dark:text-violet-300">{usd(studio.value)}</span>
                      </div>
                      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-violet-500/10"><div className="h-full rounded-full bg-violet-600" style={{ width: `${studio.value / maxStudio * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <div className="flex flex-wrap gap-3">
              <Link href="/host-bookings" className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white">Manage Bookings <ArrowRight size={16} /></Link>
              <Link href="/dashboard" className="rounded-xl border px-5 py-3 text-sm font-semibold" style={{ borderColor: "var(--ss-border)", color: "var(--ss-ink)" }}>Back to Dashboard</Link>
            </div>
            <p className="text-xs leading-6" style={{ color: "var(--ss-muted)" }}>
              Reports reflect current booking statuses and the creation-date filter. Confirmed booking value is not an accounting record of payments, refunds, or fees.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
