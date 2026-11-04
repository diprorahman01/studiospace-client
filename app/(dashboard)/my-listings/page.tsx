
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
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

type StudioStatus =
  | "active"
  | "inactive"
  | "draft"
  | "suspended";

type OwnerStudio = {
  _id: string;
  title: string;
  category: string;
  location: string;
  overview?: string;
  image?: string;
  hourlyRate: number;
  securityDeposit?: number;
  maxCapacity?: number;
  status?: StudioStatus;
  isDemo?: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
};

type StudioApiResponse = {
  success: boolean;
  message?: string;
  data?: OwnerStudio[] | OwnerStudio;
  activeBookings?: number;
};

type ListingFilter =
  | "all"
  | "active"
  | "inactive";

const FILTERS: {
  label: string;
  value: ListingFilter;
}[] = [
  { label: "All Listings", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

function canManageAvailability(studio: OwnerStudio) {
  return (
    studio.isDemo !== true &&
    (studio.status == null ||
      studio.status === "active" ||
      studio.status === "inactive")
  );
}

function isActiveStudio(studio: OwnerStudio) {
  return (
    canManageAvailability(studio) &&
    studio.status !== "inactive"
  );
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString(
    "en-US",
    { maximumFractionDigits: 2 }
  )}`;
}

function formatDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ListingStatus({
  studio,
}: {
  studio: OwnerStudio;
}) {
  if (studio.isDemo === true) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700">
        <ShieldCheck size={14} />
        Demo
      </span>
    );
  }

  if (
    studio.status === "draft" ||
    studio.status === "suspended"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
        <Clock3 size={14} />
        {studio.status === "draft"
          ? "Draft"
          : "Suspended"}
      </span>
    );
  }

  if (studio.status === "inactive") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
        <Clock3 size={14} />
        Inactive
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
      <CheckCircle2 size={14} />
      Active
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
      <div className="flex h-52 items-center justify-center bg-violet-50">
        <Building2
          size={46}
          className="text-violet-300"
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      onError={() => setFailedSrc(src)}
      className="h-52 w-full object-cover"
    />
  );
}

export default function MyListingsPage() {
  const router = useRouter();

  const {
    data: session,
    isPending: checkingSession,
  } = authClient.useSession();

  const userId = session?.user?.id;

  const [studios, setStudios] =
    useState<OwnerStudio[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<ListingFilter>("all");

  const [studioToDelete, setStudioToDelete] =
    useState<OwnerStudio | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [
    updatingAvailabilityId,
    setUpdatingAvailabilityId,
  ] = useState<string | null>(null);

  const loadStudios = useCallback(
    async (signal?: AbortSignal) => {
      const response = await fetch(
        `${API_URL}/api/studios/mine`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal,
        }
      );

      if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
      }

      if (!response.ok) {
        throw new Error(
          `Unable to load listings (${response.status}).`
        );
      }

      const result: StudioApiResponse =
        await response.json();

      if (!result.success || !Array.isArray(result.data)) {
        throw new Error(
          result.message || "Could not load your studios."
        );
      }

      return result.data;
    },
    []
  );

  useEffect(() => {
    if (checkingSession || !userId) return;

    const controller = new AbortController();

    async function fetchInitialStudios() {
      try {
        const data = await loadStudios(
          controller.signal
        );

        if (controller.signal.aborted) return;

        setStudios(data);
        setError("");
      } catch (err) {
        if (controller.signal.aborted) return;

        if (
          err instanceof Error &&
          err.message === "UNAUTHORIZED"
        ) {
          toast.error(
            "Please log in to view your listings."
          );
          router.replace("/login");
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your listings."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchInitialStudios();

    return () => controller.abort();
  }, [checkingSession, userId, router, loadStudios]);

  async function handleRefresh() {
    if (
      loading ||
      refreshing ||
      deleting ||
      updatingAvailabilityId
    ) {
      return;
    }

    setRefreshing(true);

    try {
      const data = await loadStudios();

      setStudios(data);
      setError("");
      toast.success("Listings updated.");
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
          : "Could not refresh listings."
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function handleAvailabilityChange(
    studio: OwnerStudio
  ) {
    if (
      updatingAvailabilityId !== null ||
      !canManageAvailability(studio)
    ) {
      return;
    }

    const nextStatus =
      isActiveStudio(studio) ? "inactive" : "active";

    setUpdatingAvailabilityId(studio._id);

    try {
      const response = await fetch(
        `${API_URL}/api/studios/${studio._id}/availability`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const result: StudioApiResponse =
        await response.json();

      if (response.status === 401) {
        toast.error("Please log in again.");
        router.push("/login");
        return;
      }

      if (!response.ok || !result.success) {
        toast.error(
          result.message ||
            "Could not update studio availability."
        );
        return;
      }

      setStudios((current) =>
        current.map((item) =>
          item._id === studio._id
            ? { ...item, status: nextStatus }
            : item
        )
      );

      toast.success(
        result.message ||
          "Studio availability updated."
      );

      router.refresh();
    } catch (err) {
      console.error(
        "Studio availability error:",
        err
      );

      toast.error(
        "Could not connect to the server."
      );
    } finally {
      setUpdatingAvailabilityId(null);
    }
  }

  async function handleDelete() {
    if (
      !studioToDelete ||
      deleting ||
      updatingAvailabilityId
    ) {
      return;
    }

    const selectedStudio = studioToDelete;

    setDeleting(true);

    try {
      
const response = await fetch(
  `/api/studios/${selectedStudio._id}`,
  {
    method: "DELETE",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  }
);


      const result: StudioApiResponse =
        await response.json();

      if (response.status === 401) {
        toast.error("Please log in again.");
        router.replace("/login");
        return;
      }

      if (response.status === 409) {
        toast.error(
          result.message ||
            "This studio has active bookings and cannot be deleted."
        );
        return;
      }

      if (!response.ok || !result.success) {
        toast.error(
          result.message ||
            "Failed to delete studio."
        );
        return;
      }

      setStudios((current) =>
        current.filter(
          (studio) => studio._id !== selectedStudio._id
        )
      );

      setStudioToDelete(null);

      toast.success(
        `"${selectedStudio.title}" deleted successfully.`
      );
    } catch (err) {
      console.error("Delete studio error:", err);

      toast.error(
        "Could not connect to the server. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  }

  const activeCount = studios.filter(
    isActiveStudio
  ).length;

  const inactiveCount = studios.filter(
    (studio) => studio.status === "inactive"
  ).length;

  const summaryCards = [
    {
      label: "Total Listings",
      value: studios.length,
      icon: Building2,
      style: "bg-violet-50 text-violet-700",
    },
    {
      label: "Active Studios",
      value: activeCount,
      icon: CheckCircle2,
      style: "bg-green-50 text-green-700",
    },
    {
      label: "Inactive Studios",
      value: inactiveCount,
      icon: Clock3,
      style: "bg-slate-100 text-slate-600",
    },
  ];

  const visibleStudios = useMemo(() => {
    const term = search.trim().toLowerCase();

    return studios.filter((studio) => {
      const matchesStatus =
        filter === "all" ||
        (filter === "active" &&
          isActiveStudio(studio)) ||
        (filter === "inactive" &&
          studio.status === "inactive");

      const matchesSearch =
        !term ||
        studio.title.toLowerCase().includes(term) ||
        studio.category.toLowerCase().includes(term) ||
        studio.location.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [studios, search, filter]);

  if (checkingSession || !userId) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        {checkingSession ? (
          <LoaderCircle
            size={34}
            className="animate-spin text-violet-700"
          />
        ) : (
          <>
            <p className="text-lg font-bold">
              Login Required
            </p>
            <Link
              href="/login"
              className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white"
            >
              Go to Login
            </Link>
          </>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-[#f8f7fd]">
      {/* Header */}
      <section className="border-b border-violet-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-700">
            <Building2 size={18} />
            STUDIO MANAGEMENT
          </div>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-950 sm:text-4xl">
                My Listings
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                View, edit, and manage your creative
                studio listings.
              </p>
            </div>

            <Link
              href="/add-studio"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800"
            >
              <Plus size={18} />
              Add New Studio
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10">
        {/* Summary */}
        <div className="mb-9 grid gap-4 sm:grid-cols-3">
          {summaryCards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${item.style}`}
                >
                  <Icon size={22} />
                </div>

                <p className="text-sm text-slate-500">
                  {item.label}
                </p>

                <p className="mt-2 text-3xl font-extrabold text-slate-950">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  filter === item.value
                    ? "bg-violet-700 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search your studios..."
                aria-label="Search your studios"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-violet-600 sm:w-64"
              />
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={
                loading ||
                refreshing ||
                deleting ||
                updatingAvailabilityId !== null
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing ? "animate-spin" : ""
                }
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl bg-white">
            <LoaderCircle
              size={34}
              className="animate-spin text-violet-700"
            />
            <p className="text-sm text-slate-500">
              Loading your studio listings...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-white px-6 py-14 text-center">
            <XCircle
              size={42}
              className="mx-auto mb-4 text-red-500"
            />
            <h2 className="text-xl font-bold text-slate-950">
              Unable to load listings
            </h2>
            <p className="mt-2 text-sm text-slate-500">
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
        ) : visibleStudios.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-violet-50">
              <Building2
                size={36}
                className="text-violet-600"
              />
            </div>

            <h2 className="text-xl font-bold text-slate-950">
              {studios.length === 0
                ? "You have no studio listings yet"
                : "No matching studios found"}
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
              {studios.length === 0
                ? "Create your first studio listing and start sharing your workspace with creators."
                : "Try another search term or switch to a different filter."}
            </p>

            {studios.length === 0 ? (
              <Link
                href="/add-studio"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white"
              >
                <Plus size={17} />
                Add Your First Studio
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-6 rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleStudios.map((studio) => (
              <article
                key={studio._id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative">
                  <StudioImage
                    src={studio.image}
                    title={studio.title}
                  />
                  <div className="absolute right-4 top-4">
                    <ListingStatus studio={studio} />
                  </div>
                </div>

                <div className="space-y-5 p-6">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
                      {studio.category}
                    </p>

                    <h2 className="line-clamp-2 text-xl font-bold text-slate-950">
                      {studio.title}
                    </h2>

                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                      <MapPin
                        size={16}
                        className="shrink-0"
                      />
                      {studio.location}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
                    <div>
                      <p className="mb-1 text-xs text-slate-500">
                        Hourly Rate
                      </p>
                      <p className="text-base font-bold text-violet-700">
                        {formatMoney(studio.hourlyRate)}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-xs text-slate-500">
                        Capacity
                      </p>
                      <p className="text-base font-semibold text-slate-950">
                        {studio.maxCapacity != null
                          ? `${studio.maxCapacity} people`
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={15} />
                      {formatDate(studio.createdAt)}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Wallet size={15} />
                      {formatMoney(
                        studio.securityDeposit ?? 0
                      )}{" "}
                      deposit
                    </span>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-xs leading-5 text-violet-800">
                    <ShieldCheck
                      size={16}
                      className="mt-0.5 shrink-0"
                    />
                    This listing belongs to your StudioSpace account.
                  </div>

                  {/* Availability management */}
                  <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-400/25 dark:bg-violet-500/10">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-violet-800 dark:text-violet-200">
                        Booking Availability
                      </span>

                      <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                        {studio.isDemo
                          ? "Demo"
                          : studio.status === "draft"
                            ? "Draft"
                            : studio.status === "suspended"
                              ? "Suspended"
                              : isActiveStudio(studio)
                                ? "Active"
                                : "Inactive"}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={
                        updatingAvailabilityId !== null ||
                        deleting ||
                        !canManageAvailability(studio)
                      }
                      onClick={() =>
                        handleAvailabilityChange(studio)
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingAvailabilityId === studio._id ? (
                        <>
                          <LoaderCircle
                            size={17}
                            className="animate-spin"
                          />
                          Updating...
                        </>
                      ) : !canManageAvailability(studio) ? (
                        "Approval Required"
                      ) : isActiveStudio(studio) ? (
                        "Make Unavailable"
                      ) : (
                        "Make Available"
                      )}
                    </button>

                    {!canManageAvailability(studio) && (
                      <p className="mt-2 text-xs leading-5 text-violet-700 dark:text-violet-300">
                        Draft and demo studios cannot be
                        activated from this control.
                      </p>
                    )}
                  </div>

                  {/* View and edit */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href={`/studios/${studio._id}`}
                      className="flex items-center justify-center gap-2 rounded-xl border border-violet-200 px-3 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50"
                    >
                      <Eye size={17} />
                      View Studio
                    </Link>

                    <Link
                      href={`/studios/edit/${studio._id}`}
                      className="flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-3 py-3 text-sm font-semibold text-white hover:bg-violet-800"
                    >
                      <Pencil size={16} />
                      Edit Studio
                      <ArrowRight
                        size={15}
                        className="hidden sm:block"
                      />
                    </Link>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    disabled={
                      deleting ||
                      updatingAvailabilityId !== null
                    }
                    onClick={() =>
                      setStudioToDelete(studio)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 size={17} />
                    Delete Studio
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {studioToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleting
            ) {
              setStudioToDelete(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <Trash2
                  size={26}
                  className="text-red-600"
                />
              </div>

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setStudioToDelete(null)
                }
                aria-label="Close confirmation dialog"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <h2
              id="delete-dialog-title"
              className="text-2xl font-bold text-slate-950"
            >
              Delete Studio?
            </h2>

            <p
              id="delete-dialog-description"
              className="mt-3 text-sm leading-7 text-slate-600"
            >
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-900">
                {studioToDelete.title}
              </strong>
              ? This action cannot be undone.
            </p>

            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
              Studios with pending or confirmed bookings
              cannot be deleted.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setStudioToDelete(null)
                }
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Keep Studio
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={17} />
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
