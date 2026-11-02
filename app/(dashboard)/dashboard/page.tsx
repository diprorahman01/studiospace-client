
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Inbox,
  LayoutDashboard,
  LoaderCircle,
  Plus,
  RefreshCw,
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
  category: string;
  location: string;
  image?: string;
  hourlyRate: number;
  status?: string;
  createdAt?: string;
};

type Booking = {
  _id: string;
  studioId: string;
  studioTitle?: string;
  studioImage?: string;
  userName?: string;
  userEmail?: string;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount?: number;
  status: string;
  createdAt?: string;
};

type DashboardData = {
  studios: Studio[];
  myBookings: Booking[];
  hostBookings: Booking[];
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T[];
  bookings?: T[];
};

function money(value?: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function displayDate(value?: string) {
  if (!value) return "Not available";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  const date = match
    ? new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
      )
    : new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function Status({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const styles =
    normalized === "confirmed"
      ? "bg-green-50 text-green-700"
      : normalized === "pending"
        ? "bg-amber-50 text-amber-700"
        : normalized === "cancelled"
          ? "bg-red-50 text-red-700"
          : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles}`}
    >
      {normalized}
    </span>
  );
}

function StudioImage({
  src,
  title,
}: {
  src?: string;
  title: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-violet-50">
        <Building2 size={26} className="text-violet-400" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      onError={() => setFailedSrc(src)}
      className="h-20 w-24 shrink-0 rounded-xl object-cover"
    />
  );
}

async function getList<T>(
  path: string,
  signal?: AbortSignal
): Promise<T[]> {
  const response = await fetch(`${API_URL}${path}`, {
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
      `Request failed for ${path} (${response.status}).`
    );
  }

  const value: T[] | ApiResponse<T> = await response.json();

  if (Array.isArray(value)) return value;

  if (value.success === false) {
    throw new Error(value.message || `Could not load ${path}.`);
  }

  const items = value.data ?? value.bookings;

  if (!Array.isArray(items)) {
    throw new Error(`Invalid response from ${path}.`);
  }

  return items;
}

function recent<T extends { createdAt?: string }>(
  items: T[],
  count: number
) {
  return [...items]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, count);
}

export default function DashboardPage() {
  const router = useRouter();

  const { data: session, isPending: checkingSession } =
    authClient.useSession();

  const userId = session?.user?.id;
  const userName = session?.user?.name || "Creator";

  const [studios, setStudios] = useState<Studio[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [hostBookings, setHostBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (signal?: AbortSignal): Promise<DashboardData> => {
      const [studioData, myData, hostData] = await Promise.all([
        getList<Studio>("/api/studios/mine", signal),
        getList<Booking>("/api/bookings/my", signal),
        getList<Booking>("/api/host/bookings", signal),
      ]);

      return {
        studios: studioData,
        myBookings: myData,
        hostBookings: hostData,
      };
    },
    []
  );

  useEffect(() => {
    if (checkingSession || !userId) return;

    const controller = new AbortController();

    load(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;

        setStudios(data.studios);
        setMyBookings(data.myBookings);
        setHostBookings(data.hostBookings);
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
            : "Unable to load your dashboard."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [checkingSession, userId, load, router]);

  async function refresh() {
    if (loading || refreshing) return;

    setRefreshing(true);

    try {
      const data = await load();

      setStudios(data.studios);
      setMyBookings(data.myBookings);
      setHostBookings(data.hostBookings);
      setError("");

      toast.success("Dashboard updated successfully.");
    } catch (err) {
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
          : "Unable to refresh dashboard."
      );
    } finally {
      setRefreshing(false);
    }
  }

  const stats = useMemo(
    () => [
      {
        label: "My Studios",
        value: studios.length,
        href: "/my-listings",
        icon: Building2,
        color: "bg-violet-50 text-violet-700",
      },
      {
        label: "Active Studios",
        value: studios.filter(
          (studio) =>
            (studio.status || "active") === "active"
        ).length,
        href: "/my-listings",
        icon: CheckCircle2,
        color: "bg-green-50 text-green-700",
      },
      {
        label: "Host Bookings",
        value: hostBookings.length,
        href: "/host-bookings",
        icon: Inbox,
        color: "bg-blue-50 text-blue-700",
      },
      {
        label: "Pending Requests",
        value: hostBookings.filter(
          (booking) => booking.status === "pending"
        ).length,
        href: "/host-bookings",
        icon: Clock3,
        color: "bg-amber-50 text-amber-700",
      },
      {
        label: "Confirmed Requests",
        value: hostBookings.filter(
          (booking) => booking.status === "confirmed"
        ).length,
        href: "/host-bookings",
        icon: CalendarCheck2,
        color: "bg-green-50 text-green-700",
      },
      {
        label: "My Bookings",
        value: myBookings.length,
        href: "/my-bookings",
        icon: CalendarDays,
        color: "bg-violet-50 text-violet-700",
      },
    ],
    [studios, hostBookings, myBookings]
  );

  const pending = hostBookings.filter(
    (booking) => booking.status === "pending"
  ).length;

  const recentHosted = useMemo(
    () => recent(hostBookings, 4),
    [hostBookings]
  );

  const recentMine = useMemo(
    () => recent(myBookings, 3),
    [myBookings]
  );

  const recentStudios = useMemo(
    () => recent(studios, 3),
    [studios]
  );

  const quickActions = [
    {
      href: "/add-studio",
      label: "Add a Studio",
      detail: "Publish a creative space",
      icon: Plus,
    },
    {
      href: "/my-listings",
      label: "My Listings",
      detail: "Edit or delete studios",
      icon: Building2,
    },
    {
      href: "/host-bookings",
      label: "Host Bookings",
      detail: "Manage customer requests",
      icon: Users,
    },
    {
      href: "/my-bookings",
      label: "My Bookings",
      detail: "View your reservations",
      icon: CalendarDays,
    },
    {
      href: "/host-analytics",
      label: "Host Analytics",
      detail: "Reports, trends and CSV export",
      icon: BarChart3,
    },
    {
      href: "/host-calendar",
      label: "Booking Calendar",
      detail: "Monthly schedule and booking approvals",
      icon: CalendarCheck2,
    },
  ];

  if (checkingSession || !userId) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center gap-3">
        <LoaderCircle
          size={30}
          className="animate-spin text-violet-700"
        />
        Checking your account...
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-[#f8f7fd] dark:bg-[#160f22]">
      <header className="border-b border-violet-100 bg-white dark:border-violet-400/20 dark:bg-[#21172f]">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-700 dark:text-violet-300">
            <LayoutDashboard size={17} />
            Studio Management Dashboard
          </p>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white sm:text-4xl">
                Welcome back, {userName}!
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-violet-200">
                Manage studios, review reservations, and
                explore host analytics and scheduling.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={refresh}
                disabled={loading || refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
              <Link
                href="/add-studio"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white"
              >
                <Plus size={18} />
                Add Studio
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-9 px-5 py-10">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 rounded-2xl bg-white dark:bg-[#21172f]">
            <LoaderCircle className="animate-spin text-violet-600" />
            Loading your dashboard...
          </div>
        ) : error ? (
          <section className="rounded-2xl border border-red-100 bg-white px-6 py-14 text-center">
            <XCircle
              size={40}
              className="mx-auto text-red-500"
            />
            <h2 className="mt-4 text-xl font-bold">
              Unable to Load Dashboard
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              {error}
            </p>
            <button
              type="button"
              onClick={refresh}
              className="mt-5 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white"
            >
              Try Again
            </button>
          </section>
        ) : (
          <>
            {pending > 0 && (
              <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <div className="flex items-start gap-3">
                  <Clock3 size={23} className="text-amber-700" />
                  <div>
                    <h2 className="font-bold text-amber-950">
                      You have {pending} pending booking{" "}
                      {pending === 1 ? "request" : "requests"}
                    </h2>
                    <p className="mt-1 text-sm text-amber-800">
                      Review customer requests in Host Bookings
                      or Booking Calendar.
                    </p>
                  </div>
                </div>
                <Link
                  href="/host-calendar"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white"
                >
                  Open Booking Calendar
                  <ArrowRight size={16} />
                </Link>
              </section>
            )}

            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <Link
                    key={stat.label}
                    href={stat.href}
                    className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-violet-400/20 dark:bg-[#21172f]"
                  >
                    <div
                      className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}
                    >
                      <Icon size={23} />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-violet-200">
                      {stat.label}
                    </p>
                    <div className="mt-2 flex items-end justify-between">
                      <p className="text-3xl font-extrabold text-slate-950 dark:text-white">
                        {stat.value}
                      </p>
                      <ArrowRight
                        size={17}
                        className="text-slate-400"
                      />
                    </div>
                  </Link>
                );
              })}
            </section>

            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-950 dark:text-white">
                Quick Actions
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {quickActions.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-5 transition hover:border-violet-400 hover:shadow-md dark:border-violet-400/20 dark:bg-[#21172f]"
                    >
                      <div>
                        <p className="font-bold text-slate-950 dark:text-white">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-violet-200">
                          {item.detail}
                        </p>
                      </div>

                      <Icon
                        size={24}
                        className="shrink-0 text-violet-700 transition-transform group-hover:scale-110 dark:text-violet-300"
                      />
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-violet-400/20 dark:bg-[#21172f] sm:p-7">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                    Recent Customer Reservations
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-violet-200">
                    Bookings received for your studios
                  </p>
                </div>

                <Link
                  href="/host-bookings"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300"
                >
                  Manage Bookings
                  <ArrowRight size={16} />
                </Link>
              </div>

              {recentHosted.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-8 text-center dark:bg-violet-500/10">
                  <Inbox
                    size={35}
                    className="mx-auto text-violet-400"
                  />
                  <p className="mt-3 font-semibold text-slate-800 dark:text-white">
                    No customer reservations yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentHosted.map((booking) => (
                    <div
                      key={booking._id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 p-4 dark:border-violet-400/20"
                    >
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {booking.studioTitle ||
                            "Studio Reservation"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-violet-200">
                          Customer: {booking.userName || "Not provided"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-violet-300">
                          {displayDate(booking.date)} ·{" "}
                          {booking.startTime}–{booking.endTime}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Status status={booking.status} />
                        <span className="font-bold text-violet-700 dark:text-violet-300">
                          {money(booking.totalAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="grid gap-7 xl:grid-cols-2">
              <article className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-violet-400/20 dark:bg-[#21172f]">
                <div className="mb-6 flex items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                    Recent Studio Listings
                  </h2>
                  <Link
                    href="/my-listings"
                    className="text-sm font-semibold text-violet-700 dark:text-violet-300"
                  >
                    View All
                  </Link>
                </div>

                {recentStudios.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-8 text-center dark:bg-violet-500/10">
                    <Building2
                      size={35}
                      className="mx-auto text-violet-400"
                    />
                    <p className="mt-3 text-sm text-slate-600 dark:text-violet-200">
                      No studios yet.
                    </p>
                    <Link
                      href="/add-studio"
                      className="mt-4 inline-flex rounded-xl bg-violet-700 px-4 py-2 text-white"
                    >
                      Create Studio
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentStudios.map((studio) => (
                      <div
                        key={studio._id}
                        className="flex gap-4 rounded-xl border border-slate-100 p-3 dark:border-violet-400/20"
                      >
                        <StudioImage
                          src={studio.image}
                          title={studio.title}
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/studios/${studio._id}`}
                            className="font-bold text-slate-950 hover:text-violet-700 dark:text-white"
                          >
                            {studio.title}
                          </Link>
                          <p className="mt-1 text-xs text-slate-500 dark:text-violet-200">
                            {studio.location} · {studio.category}
                          </p>
                          <p className="mt-1 font-bold text-violet-700 dark:text-violet-300">
                            {money(studio.hourlyRate)} / hour
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-violet-400/20 dark:bg-[#21172f]">
                <div className="mb-6 flex items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                    Recent Personal Bookings
                  </h2>
                  <Link
                    href="/my-bookings"
                    className="text-sm font-semibold text-violet-700 dark:text-violet-300"
                  >
                    View All
                  </Link>
                </div>

                {recentMine.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500 dark:bg-violet-500/10">
                    No personal bookings yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentMine.map((booking) => (
                      <div
                        key={booking._id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4 dark:border-violet-400/20"
                      >
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-white">
                            {booking.studioTitle ||
                              "Studio Reservation"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-violet-200">
                            {displayDate(booking.date)} ·{" "}
                            {booking.startTime}–{booking.endTime}
                          </p>
                        </div>
                        <Status status={booking.status} />
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
