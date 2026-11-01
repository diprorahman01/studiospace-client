
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
  LayoutDashboard,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
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
  date: string;
  startTime: string;
  endTime: string;
  totalAmount?: number;
  status: string;
  createdAt?: string;
};

type StudiosResponse = {
  success: boolean;
  message?: string;
  data?: Studio[];
};

type BookingsResponse = {
  success?: boolean;
  message?: string;
  data?: Booking[];
  bookings?: Booking[];
};

function formatMoney(value?: number) {
  return `৳${Number(value ?? 0).toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function BookingStatus({
  status,
}: {
  status: string;
}) {
  const value = status.toLowerCase();

  let styles = "bg-slate-100 text-slate-700";

  if (value === "confirmed") {
    styles = "bg-green-50 text-green-700";
  } else if (value === "pending") {
    styles = "bg-amber-50 text-amber-700";
  } else if (value === "cancelled") {
    styles = "bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles}`}
    >
      {value}
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
        <Building2
          size={25}
          className="text-violet-400"
        />
      </div>
    );
  }

  return (
    // Images can be remote or local public paths.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      onError={() => setFailedSrc(src)}
      className="h-20 w-24 shrink-0 rounded-xl object-cover"
    />
  );
}

async function readResponse(
  response: Response
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error(
      `The server returned an invalid response (${response.status}).`
    );
  }
}

function readStudios(value: unknown): Studio[] {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error("Invalid studio response.");
  }

  const result = value as StudiosResponse;

  if (
    !result.success ||
    !Array.isArray(result.data)
  ) {
    throw new Error(
      result.message ||
        "Could not load your studios."
    );
  }

  return result.data;
}

function readBookings(value: unknown): Booking[] {
  // Accept either an array or an API envelope.
  if (Array.isArray(value)) {
    return value as Booking[];
  }

  if (
    !value ||
    typeof value !== "object"
  ) {
    throw new Error("Invalid booking response.");
  }

  const result = value as BookingsResponse;

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.bookings)) {
    return result.bookings;
  }

  throw new Error(
    result.message ||
      "Could not load your bookings."
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const {
    data: session,
    isPending: checkingSession,
  } = authClient.useSession();

  const userId = session?.user?.id;
  const userName = session?.user?.name || "Creator";

  const [studios, setStudios] =
    useState<Studio[]>([]);
  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(
    async (signal?: AbortSignal) => {
      const [studiosResult, bookingsResult] =
        await Promise.allSettled([
          fetch(`${API_URL}/api/studios/mine`, {
            credentials: "include",
            cache: "no-store",
            signal,
          }),
          fetch(`${API_URL}/api/bookings/my`, {
            credentials: "include",
            cache: "no-store",
            signal,
          }),
        ]);

      if (
        studiosResult.status === "rejected" ||
        bookingsResult.status === "rejected"
      ) {
        throw new Error(
          "Unable to connect to the StudioSpace server."
        );
      }

      const studioResponse = studiosResult.value;
      const bookingResponse = bookingsResult.value;

      if (
        studioResponse.status === 401 ||
        bookingResponse.status === 401
      ) {
        throw new Error("UNAUTHORIZED");
      }

      if (!studioResponse.ok) {
        throw new Error(
          `Studio API error (${studioResponse.status}).`
        );
      }

      if (!bookingResponse.ok) {
        throw new Error(
          `Booking API error (${bookingResponse.status}).`
        );
      }

      const [studiosBody, bookingsBody] =
        await Promise.all([
          readResponse(studioResponse),
          readResponse(bookingResponse),
        ]);

      return {
        studios: readStudios(studiosBody),
        bookings: readBookings(bookingsBody),
      };
    },
    []
  );

  useEffect(() => {
    if (checkingSession || !userId) return;

    const controller = new AbortController();

    async function fetchInitialData() {
      try {
        const data = await loadDashboard(
          controller.signal
        );

        if (controller.signal.aborted) return;

        setStudios(data.studios);
        setBookings(data.bookings);
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
            : "Unable to load the dashboard."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchInitialData();

    return () => controller.abort();
  }, [
    checkingSession,
    userId,
    loadDashboard,
    router,
  ]);

  async function handleRefresh() {
    if (loading || refreshing) return;

    setRefreshing(true);

    try {
      const data = await loadDashboard();

      setStudios(data.studios);
      setBookings(data.bookings);
      setError("");
      toast.success("Dashboard updated.");
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
          : "Could not refresh the dashboard."
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

    const pendingBookings = bookings.filter(
      (booking) =>
        booking.status === "pending"
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
        label: "Active Listings",
        value: activeStudios,
        icon: CheckCircle2,
        color: "bg-green-50 text-green-700",
        href: "/my-listings",
      },
      {
        label: "My Bookings",
        value: bookings.length,
        icon: CalendarCheck2,
        color: "bg-blue-50 text-blue-700",
        href: "/my-bookings",
      },
      {
        label: "Pending Bookings",
        value: pendingBookings,
        icon: Clock3,
        color: "bg-amber-50 text-amber-700",
        href: "/my-bookings",
      },
    ];
  }, [studios, bookings]);

  const recentStudios = useMemo(
    () =>
      [...studios]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        )
        .slice(0, 3),
    [studios]
  );

  const recentBookings = useMemo(
    () =>
      [...bookings]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        )
        .slice(0, 4),
    [bookings]
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
      {/* Heading */}
      <section className="border-b border-violet-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-700">
            <LayoutDashboard size={17} />
            CREATOR DASHBOARD
          </p>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-950 sm:text-4xl">
                Welcome back, {userName}!
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                View your studio listings, booking
                activity, and important updates.
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
            {/* Statistics */}
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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

                    <p className="mt-2 text-3xl font-extrabold text-slate-950">
                      {stat.value}
                    </p>
                  </Link>
                );
              })}
            </section>

            {/* Quick actions */}
            <section className="grid gap-5 md:grid-cols-3">
              <Link
                href="/add-studio"
                className="flex items-center justify-between rounded-2xl bg-violet-700 p-6 text-white transition hover:bg-violet-800"
              >
                <div>
                  <p className="font-bold">
                    Add a New Studio
                  </p>
                  <p className="mt-2 text-sm text-violet-100">
                    Publish another creative space.
                  </p>
                </div>
                <Plus size={25} />
              </Link>

              <Link
                href="/my-listings"
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-6 transition hover:shadow-md"
              >
                <div>
                  <p className="font-bold text-slate-950">
                    Manage Listings
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    View, edit, or remove your studios.
                  </p>
                </div>
                <Building2
                  size={25}
                  className="text-violet-700"
                />
              </Link>

              <Link
                href="/my-bookings"
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-6 transition hover:shadow-md"
              >
                <div>
                  <p className="font-bold text-slate-950">
                    My Reservations
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Review bookings you have made.
                  </p>
                </div>
                <CalendarDays
                  size={25}
                  className="text-violet-700"
                />
              </Link>
            </section>

            {/* Recent data */}
            <section className="grid gap-7 xl:grid-cols-2">
              {/* My studios */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      Recent Studio Listings
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Studios created by your account
                    </p>
                  </div>

                  <Link
                    href="/my-listings"
                    className="flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900"
                  >
                    View All
                    <ArrowRight size={15} />
                  </Link>
                </div>

                {recentStudios.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-8 text-center">
                    <Building2
                      size={34}
                      className="mx-auto text-violet-400"
                    />

                    <p className="mt-3 font-semibold text-slate-800">
                      No studios yet
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Create your first studio listing.
                    </p>

                    <Link
                      href="/add-studio"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white"
                    >
                      <Plus size={16} />
                      Add Studio
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

              {/* My bookings */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      Recent Bookings
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Reservations made by your account
                    </p>
                  </div>

                  <Link
                    href="/my-bookings"
                    className="flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900"
                  >
                    View All
                    <ArrowRight size={15} />
                  </Link>
                </div>

                {recentBookings.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-8 text-center">
                    <CalendarDays
                      size={34}
                      className="mx-auto text-violet-400"
                    />

                    <p className="mt-3 font-semibold text-slate-800">
                      No bookings yet
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Explore studios and book your
                      next creative session.
                    </p>

                    <Link
                      href="/studios"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white"
                    >
                      Explore Studios
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="rounded-xl border border-slate-100 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-950">
                              {booking.studioTitle ||
                                "Studio Booking"}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <CalendarDays size={14} />
                              {formatDate(booking.date)}
                            </p>
                          </div>

                          <BookingStatus
                            status={booking.status}
                          />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock3 size={14} />
                            {booking.startTime}–
                            {booking.endTime}
                          </span>

                          <span className="flex items-center gap-1 text-sm font-bold text-violet-700">
                            <Wallet size={14} />
                            {formatMoney(
                              booking.totalAmount
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Security note */}
            <div className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-white px-6 py-5">
              <ShieldCheck
                size={21}
                className="mt-0.5 shrink-0 text-violet-700"
              />

              <p className="text-sm leading-7 text-slate-600">
                Dashboard information comes from
                authenticated account-specific APIs.
                Studio management actions are also
                protected by server-side ownership
                checks.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
