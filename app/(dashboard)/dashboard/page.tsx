
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Inbox,
  LayoutDashboard,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
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

type StudioResponse = {
  success: boolean;
  message?: string;
  data?: Studio[];
};

type BookingResponse = {
  success?: boolean;
  message?: string;
  data?: Booking[];
  bookings?: Booking[];
};

type DashboardData = {
  studios: Studio[];
  myBookings: Booking[];
  hostBookings: Booking[];
};

function formatMoney(value?: number) {
  return `৳${Number(value ?? 0).toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string) {
  if (!value) return "Not available";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  const date = match
    ? new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
      )
    : new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
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
  const [failedSrc, setFailedSrc] =
    useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-violet-50">
        <Building2 size={26} className="text-violet-400" />
      </div>
    );
  }

  return (
    // Supports local and remote studio images.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      onError={() => setFailedSrc(src)}
      className="h-20 w-24 shrink-0 rounded-xl object-cover"
    />
  );
}

async function fetchJson(
  path: string,
  signal?: AbortSignal
): Promise<unknown> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
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

  try {
    return await response.json();
  } catch {
    throw new Error(
      `Invalid server response for ${path}.`
    );
  }
}

function parseStudios(value: unknown): Studio[] {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error("Invalid studio listings response.");
  }

  const result = value as StudioResponse;

  if (!result.success || !Array.isArray(result.data)) {
    throw new Error(
      result.message || "Could not load studio listings."
    );
  }

  return result.data;
}

function parseBookings(
  value: unknown,
  label: string
): Booking[] {
  // Existing customer bookings may return an array.
  if (Array.isArray(value)) {
    return value as Booking[];
  }

  if (
    !value ||
    typeof value !== "object"
  ) {
    throw new Error(`Invalid ${label} response.`);
  }

  const result = value as BookingResponse;

  if (result.success === false) {
    throw new Error(
      result.message || `Unable to load ${label}.`
    );
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.bookings)) {
    return result.bookings;
  }

  throw new Error(
    result.message || `Missing ${label} data.`
  );
}

function sortRecent<T extends { createdAt?: string }>(
  items: T[],
  limit: number
): T[] {
  return [...items]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, limit);
}

export default function DashboardPage() {
  const router = useRouter();

  const {
    data: session,
    isPending: checkingSession,
  } = authClient.useSession();

  const userId = session?.user?.id;
  const userName = session?.user?.name || "Creator";

  const [studios, setStudios] = useState<Studio[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [hostBookings, setHostBookings] =
    useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(
    async (signal?: AbortSignal): Promise<DashboardData> => {
      const [studioResult, myResult, hostResult] =
        await Promise.all([
          fetchJson("/api/studios/mine", signal),
          fetchJson("/api/bookings/my", signal),
          fetchJson("/api/host/bookings", signal),
        ]);

      return {
        studios: parseStudios(studioResult),
        myBookings: parseBookings(
          myResult,
          "customer bookings"
        ),
        hostBookings: parseBookings(
          hostResult,
          "host bookings"
        ),
      };
    },
    []
  );

  // Load dashboard after confirming the session.
  useEffect(() => {
    if (checkingSession || !userId) return;

    const controller = new AbortController();

    async function loadInitialDashboard() {
      try {
        const result = await loadDashboard(
          controller.signal
        );

        if (controller.signal.aborted) return;

        setStudios(result.studios);
        setMyBookings(result.myBookings);
        setHostBookings(result.hostBookings);
        setError("");
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
            : "Unable to load your dashboard."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadInitialDashboard();

    return () => controller.abort();
  }, [checkingSession, userId, loadDashboard, router]);

  async function handleRefresh() {
    if (loading || refreshing) return;

    setRefreshing(true);

    try {
      const result = await loadDashboard();

      setStudios(result.studios);
      setMyBookings(result.myBookings);
      setHostBookings(result.hostBookings);
      setError("");

      toast.success("Dashboard updated successfully.");
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === "UNAUTHORIZED"
      ) {
        toast.error("Your session has expired.");
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

  const stats = useMemo(() => {
    const activeStudios = studios.filter(
      (studio) =>
        (studio.status || "active") === "active"
    ).length;

    const pendingHostBookings = hostBookings.filter(
      (booking) => booking.status === "pending"
    ).length;

    const confirmedHostBookings = hostBookings.filter(
      (booking) => booking.status === "confirmed"
    ).length;

    return [
      {
        label: "My Studios",
        value: studios.length,
        icon: Building2,
        color: "bg-violet-50 text-violet-700",
        href: "/my-listings",
      },
      {
        label: "Active Studios",
        value: activeStudios,
        icon: CheckCircle2,
        color: "bg-green-50 text-green-700",
        href: "/my-listings",
      },
      {
        label: "Host Bookings",
        value: hostBookings.length,
        icon: Inbox,
        color: "bg-blue-50 text-blue-700",
        href: "/host-bookings",
      },
      {
        label: "Pending Requests",
        value: pendingHostBookings,
        icon: Clock3,
        color: "bg-amber-50 text-amber-700",
        href: "/host-bookings",
      },
      {
        label: "Confirmed Requests",
        value: confirmedHostBookings,
        icon: CalendarCheck2,
        color: "bg-green-50 text-green-700",
        href: "/host-bookings",
      },
      {
        label: "My Bookings",
        value: myBookings.length,
        icon: CalendarDays,
        color: "bg-violet-50 text-violet-700",
        href: "/my-bookings",
      },
    ];
  }, [studios, myBookings, hostBookings]);

  const pendingRequests = hostBookings.filter(
    (booking) => booking.status === "pending"
  ).length;

  const recentStudios = useMemo(
    () => sortRecent(studios, 3),
    [studios]
  );

  const recentHostBookings = useMemo(
    () => sortRecent(hostBookings, 4),
    [hostBookings]
  );

  const recentMyBookings = useMemo(
    () => sortRecent(myBookings, 3),
    [myBookings]
  );

  if (checkingSession || !userId) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <LoaderCircle
          size={34}
          className="animate-spin text-violet-700"
        />
        <p className="text-sm text-slate-500">
          Checking your account...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-[#f8f7fd]">
      {/* Header */}
      <section className="border-b border-violet-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-700">
            <LayoutDashboard size={17} />
            STUDIO MANAGEMENT DASHBOARD
          </p>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-950 sm:text-4xl">
                Welcome back, {userName}!
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                Manage your studios, review customer
                reservations, and keep track of your
                personal bookings.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={
                    refreshing ? "animate-spin" : ""
                  }
                />
                Refresh
              </button>

              <Link
                href="/add-studio"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800"
              >
                <Plus size={18} />
                Add Studio
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-9 px-5 py-10">
        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl bg-white">
            <LoaderCircle
              size={34}
              className="animate-spin text-violet-700"
            />
            <p className="text-sm text-slate-500">
              Loading your dashboard...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-white px-6 py-14 text-center">
            <XCircle
              size={42}
              className="mx-auto mb-4 text-red-500"
            />
            <h2 className="text-xl font-bold text-slate-950">
              Unable to Load Dashboard
            </h2>
            <p className="mt-3 text-sm text-slate-500">
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
        ) : (
          <>
            {/* Pending host requests alert */}
            {pendingRequests > 0 && (
              <section className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <Clock3
                    size={24}
                    className="mt-0.5 shrink-0 text-amber-700"
                  />
                  <div>
                    <h2 className="font-bold text-amber-950">
                      You have {pendingRequests} pending{" "}
                      {pendingRequests === 1
                        ? "booking request"
                        : "booking requests"}
                    </h2>
                    <p className="mt-1 text-sm text-amber-800">
                      Review these requests and approve
                      or reject them from Host Bookings.
                    </p>
                  </div>
                </div>

                <Link
                  href="/host-bookings"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-800"
                >
                  Review Requests
                  <ArrowRight size={16} />
                </Link>
              </section>
            )}

            {/* Real statistics */}
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <Link
                    key={stat.label}
                    href={stat.href}
                    className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <div
                      className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}
                    >
                      <Icon size={23} />
                    </div>

                    <p className="text-sm text-slate-500">
                      {stat.label}
                    </p>

                    <div className="mt-2 flex items-end justify-between">
                      <p className="text-3xl font-extrabold text-slate-950">
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

            {/* Quick actions */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-950">
                Quick Actions
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Link
                  href="/add-studio"
                  className="flex items-center justify-between gap-4 rounded-2xl bg-violet-700 p-5 text-white hover:bg-violet-800"
                >
                  <div>
                    <p className="font-bold">
                      Add a Studio
                    </p>
                    <p className="mt-1 text-xs text-violet-100">
                      Publish a creative space
                    </p>
                  </div>
                  <Plus size={25} />
                </Link>

                <Link
                  href="/my-listings"
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 hover:shadow-md"
                >
                  <div>
                    <p className="font-bold text-slate-950">
                      My Listings
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Edit or delete your studios
                    </p>
                  </div>
                  <Building2
                    size={24}
                    className="text-violet-700"
                  />
                </Link>

                <Link
                  href="/host-bookings"
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 hover:shadow-md"
                >
                  <div>
                    <p className="font-bold text-slate-950">
                      Host Bookings
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Manage customer requests
                    </p>
                  </div>
                  <Users
                    size={24}
                    className="text-violet-700"
                  />
                </Link>

                <Link
                  href="/my-bookings"
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 hover:shadow-md"
                >
                  <div>
                    <p className="font-bold text-slate-950">
                      My Bookings
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      View your reservations
                    </p>
                  </div>
                  <CalendarDays
                    size={24}
                    className="text-violet-700"
                  />
                </Link>
              </div>
            </section>

            {/* Recent host reservations */}
            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    Recent Customer Reservations
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Bookings received for your studios
                  </p>
                </div>

                <Link
                  href="/host-bookings"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
                >
                  Manage Bookings
                  <ArrowRight size={16} />
                </Link>
              </div>

              {recentHostBookings.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-8 text-center">
                  <Inbox
                    size={36}
                    className="mx-auto text-violet-400"
                  />
                  <p className="mt-3 font-semibold text-slate-800">
                    No customer reservations yet
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Reservations will appear when someone
                    books a studio you own.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentHostBookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950">
                          {booking.studioTitle ||
                            "Studio Reservation"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Customer:{" "}
                          {booking.userName ||
                            "Not provided"}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {formatDate(booking.date)} ·{" "}
                          {booking.startTime}–{booking.endTime}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <StatusBadge status={booking.status} />
                        <span className="font-bold text-violet-700">
                          {formatMoney(
                            booking.totalAmount
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent studios and personal bookings */}
            <section className="grid gap-7 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      Recent Studio Listings
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Studios you have created
                    </p>
                  </div>

                  <Link
                    href="/my-listings"
                    className="flex items-center gap-1 text-sm font-semibold text-violet-700"
                  >
                    View All
                    <ArrowRight size={15} />
                  </Link>
                </div>

                {recentStudios.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-8 text-center">
                    <Building2
                      size={35}
                      className="mx-auto text-violet-400"
                    />
                    <p className="mt-3 font-semibold text-slate-800">
                      No studios yet
                    </p>
                    <Link
                      href="/add-studio"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white"
                    >
                      <Plus size={17} />
                      Create Studio
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentStudios.map((studio) => (
                      <div
                        key={studio._id}
                        className="flex items-center gap-4 rounded-xl border border-slate-100 p-3"
                      >
                        <StudioImage
                          src={studio.image}
                          title={studio.title}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-950">
                            {studio.title}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <MapPin size={13} />
                            <span className="truncate">
                              {studio.location}
                            </span>
                          </p>
                          <p className="mt-2 text-sm font-bold text-violet-700">
                            {formatMoney(
                              studio.hourlyRate
                            )}
                            <span className="text-xs font-normal text-slate-500">
                              {" "}/hour
                            </span>
                          </p>
                        </div>

                        <Link
                          href={`/edit-studio/${studio._id}`}
                          aria-label={`Edit ${studio.title}`}
                          className="rounded-lg border border-violet-200 p-2 text-violet-700 hover:bg-violet-50"
                        >
                          <Eye size={17} />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      My Recent Bookings
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Reservations made by your account
                    </p>
                  </div>

                  <Link
                    href="/my-bookings"
                    className="flex items-center gap-1 text-sm font-semibold text-violet-700"
                  >
                    View All
                    <ArrowRight size={15} />
                  </Link>
                </div>

                {recentMyBookings.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-8 text-center">
                    <CalendarDays
                      size={35}
                      className="mx-auto text-violet-400"
                    />
                    <p className="mt-3 font-semibold text-slate-800">
                      No personal bookings yet
                    </p>
                    <Link
                      href="/studios"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white"
                    >
                      Explore Studios
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentMyBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="rounded-xl border border-slate-100 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-950">
                              {booking.studioTitle ||
                                "Studio Booking"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(booking.date)}
                            </p>
                          </div>
                          <StatusBadge status={booking.status} />
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                          <span className="text-slate-500">
                            {booking.startTime}–{booking.endTime}
                          </span>
                          <span className="font-bold text-violet-700">
                            {formatMoney(booking.totalAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Information note */}
            <div className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-white px-6 py-5">
              <ShieldCheck
                size={21}
                className="mt-0.5 shrink-0 text-violet-700"
              />
              <p className="text-sm leading-7 text-slate-600">
                All dashboard statistics are loaded from
                authenticated StudioSpace APIs. Host
                booking counts represent reservation
                statuses, not completed payments or revenue.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
