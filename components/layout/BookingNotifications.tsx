
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  Check,
  Clock3,
  LoaderCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const REFRESH_INTERVAL = 45000;

type Booking = {
  _id: string;
  studioTitle?: string;
  userName?: string;
  status: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  rejectedAt?: string;
  rescheduledAt?: string;
};

type BookingResponse = {
  success: boolean;
  message?: string;
  data?: Booking[];
};

type NotificationType =
  | "new"
  | "confirmed"
  | "cancelled"
  | "rescheduled";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  timestamp: string;
  href: string;
};

type NotificationState = {
  userId: string;
  items: NotificationItem[];
  error: string;
};

type ReadState = {
  userId: string;
  ids: string[];
};

function formatDate(value: string) {
  if (!value) return "";

  const [year, month, day] = value
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Date(
    Date.UTC(year, month - 1, day)
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatTimestamp(value: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "confirmed":
      return CalendarCheck2;
    case "cancelled":
      return CalendarX2;
    case "rescheduled":
      return CalendarClock;
    default:
      return Clock3;
  }
}

function buildNotifications(
  customerBookings: Booking[],
  hostBookings: Booking[]
): NotificationItem[] {
  const notifications: NotificationItem[] = [];

  // Customer notifications
  for (const booking of customerBookings) {
    const studio = booking.studioTitle || "Studio";
    const date = formatDate(booking.date);

    let title = "Booking request submitted";
    let description = `Your booking for ${studio} on ${date} is pending.`;
    let type: NotificationType = "new";
    let timestamp = booking.createdAt || "";

    if (booking.status === "confirmed") {
      title = "Booking confirmed";
      description = `Your reservation for ${studio} on ${date} was approved.`;
      type = "confirmed";
      timestamp =
        booking.confirmedAt ||
        booking.updatedAt ||
        timestamp;
    } else if (booking.status === "cancelled") {
      title = booking.rejectedAt
        ? "Booking rejected"
        : "Booking cancelled";

      description = `Your reservation for ${studio} on ${date} was cancelled.`;
      type = "cancelled";
      timestamp =
        booking.cancelledAt ||
        booking.updatedAt ||
        timestamp;
    } else if (booking.rescheduledAt) {
      title = "Booking rescheduled";
      description = `Your pending booking for ${studio} is now scheduled for ${date}.`;
      type = "rescheduled";
      timestamp = booking.rescheduledAt;
    }

    notifications.push({
      id: `customer-${booking._id}-${type}-${timestamp}`,
      title,
      description,
      type,
      timestamp,
      href: "/my-bookings",
    });
  }

  // Host notifications
  for (const booking of hostBookings) {
    const studio = booking.studioTitle || "Studio";
    const customer = booking.userName || "A customer";
    const date = formatDate(booking.date);

    let title = "New booking request";
    let description = `${customer} requested ${studio} for ${date}.`;
    let type: NotificationType = "new";
    let timestamp = booking.createdAt || "";

    if (booking.status === "confirmed") {
      title = "Booking approved";
      description = `The booking for ${studio} on ${date} has been confirmed.`;
      type = "confirmed";
      timestamp =
        booking.confirmedAt ||
        booking.updatedAt ||
        timestamp;
    } else if (booking.status === "cancelled") {
      title = booking.rejectedAt
        ? "Booking rejected"
        : "Booking cancelled";

      description = `The reservation for ${studio} on ${date} was cancelled.`;
      type = "cancelled";
      timestamp =
        booking.cancelledAt ||
        booking.updatedAt ||
        timestamp;
    } else if (booking.rescheduledAt) {
      title = "Customer rescheduled";
      description = `${customer} moved a pending booking for ${studio} to ${date}.`;
      type = "rescheduled";
      timestamp = booking.rescheduledAt;
    }

    notifications.push({
      id: `host-${booking._id}-${type}-${timestamp}`,
      title,
      description,
      type,
      timestamp,
      href: "/host-bookings",
    });
  }

  return notifications
    .sort(
      (a, b) =>
        new Date(b.timestamp || 0).getTime() -
        new Date(a.timestamp || 0).getTime()
    )
    .slice(0, 50);
}

async function fetchBookings(
  endpoint: string,
  signal: AbortSignal
): Promise<Booking[]> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 401) {
    throw new Error("Your login session has expired.");
  }

  if (!response.ok) {
    throw new Error("Unable to load booking activity.");
  }

  const result: BookingResponse =
    await response.json();

  if (!result.success || !Array.isArray(result.data)) {
    throw new Error(
      result.message || "Invalid booking activity response."
    );
  }

  return result.data;
}

export default function BookingNotifications() {
  const { data: session, isPending } =
    authClient.useSession();

  const userId = session?.user?.id;

  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [notificationState, setNotificationState] =
    useState<NotificationState | null>(null);

  const [readState, setReadState] =
    useState<ReadState | null>(null);

  const storageKey = userId
    ? `studiospace-notification-reads-${userId}`
    : "";

  // ==========================================
  // RESTORE READ STATUS
  // ==========================================

  useEffect(() => {
    if (!userId || !storageKey) return;

    let cancelled = false;

    // Restore browser storage asynchronously.
    const restore = Promise.resolve().then(() => {
      let ids: string[] = [];

      try {
        const stored = window.localStorage.getItem(
          storageKey
        );

        const parsed: unknown = stored
          ? JSON.parse(stored)
          : [];

        if (Array.isArray(parsed)) {
          ids = parsed.filter(
            (value): value is string =>
              typeof value === "string"
          );
        }
      } catch {
        ids = [];
      }

      if (!cancelled) {
        setReadState({
          userId,
          ids,
        });
      }
    });

    void restore;

    return () => {
      cancelled = true;
    };
  }, [userId, storageKey]);

  // ==========================================
  // AUTOMATIC REFRESH TIMER
  // ==========================================

  useEffect(() => {
    if (!userId) return;

    const interval = window.setInterval(() => {
      if (!document.hidden) {
        setRefreshKey((value) => value + 1);
      }
    }, REFRESH_INTERVAL);

    function onFocus() {
      if (!document.hidden) {
        setRefreshKey((value) => value + 1);
      }
    }

    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [userId]);

  // ==========================================
  // FETCH NOTIFICATIONS
  // ==========================================

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();

    // The Promise callbacks run after the API
    // requests finish. There is no synchronous
    // state update inside this effect.
    const request = Promise.all([
      fetchBookings(
        "/api/bookings/my",
        controller.signal
      ),
      fetchBookings(
        "/api/host/bookings",
        controller.signal
      ),
    ]);

    request
      .then(([customerBookings, hostBookings]) => {
        if (controller.signal.aborted) return;

        setNotificationState({
          userId,
          items: buildNotifications(
            customerBookings,
            hostBookings
          ),
          error: "",
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load notifications.";

        setNotificationState((previous) => ({
          userId,
          items:
            previous?.userId === userId
              ? previous.items
              : [],
          error: message,
        }));
      });

    return () => {
      controller.abort();
    };
  }, [userId, refreshKey]);

  // ==========================================
  // CURRENT USER DATA
  // ==========================================

  const currentNotifications =
    notificationState?.userId === userId
      ? notificationState
      : null;

  const notifications = useMemo(
    () => currentNotifications?.items ?? [],
    [currentNotifications]
  );

  const error = currentNotifications?.error ?? "";

  const loading =
    Boolean(userId) && currentNotifications === null;

  const readIds =
  readState && readState.userId === userId
    ? readState.ids
    : [];

  const readSet = new Set(readIds);

  const unreadCount = notifications.filter(
    (notification) => !readSet.has(notification.id)
  ).length;

  // ==========================================
  // READ STATUS ACTIONS
  // ==========================================

  function saveReadStatus(ids: string[]) {
    if (!userId || !storageKey) return;

    const uniqueIds = [...new Set(ids)].slice(-500);

    setReadState({
      userId,
      ids: uniqueIds,
    });

    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(uniqueIds)
      );
    } catch {
      // The panel still works without local storage.
    }
  }

  function markRead(id: string) {
    if (readSet.has(id)) return;

    saveReadStatus([...readIds, id]);
  }

  function markAllRead() {
    saveReadStatus([
      ...readIds,
      ...notifications.map((item) => item.id),
    ]);
  }

  function refreshNotifications() {
    setRefreshKey((value) => value + 1);
  }

  if (isPending || !userId) {
    return null;
  }

  return (
    <div className="fixed right-5 top-24 z-[80] sm:right-8">
      <div className="relative">
        {/* Notification bell */}
        <button
          type="button"
          onClick={() => {
            setOpen((current) => !current);

            if (!open) {
              refreshNotifications();
            }
          }}
          aria-label={`Booking notifications, ${unreadCount} unread`}
          aria-expanded={open}
          aria-controls="studiospace-notification-panel"
          className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/30 bg-white text-violet-700 shadow-lg transition hover:scale-105 hover:bg-violet-50 dark:bg-[#261b35] dark:text-violet-200"
        >
          <Bell size={22} />

          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-violet-700 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notifications popup */}
        {open && (
          <>
            <button
              type="button"
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[-1] cursor-default bg-slate-950/15"
            />

            <section
              id="studiospace-notification-panel"
              aria-label="Booking notifications"
              className="absolute right-0 top-16 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-2xl dark:border-violet-400/25 dark:bg-[#21172f]"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-violet-100 px-4 py-4 dark:border-violet-400/20">
                <div>
                  <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                    Notifications
                  </h2>

                  <p className="mt-1 text-xs text-slate-500 dark:text-violet-200">
                    {unreadCount} unread booking updates
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={refreshNotifications}
                    aria-label="Refresh notifications"
                    className="rounded-lg p-2 text-violet-700 hover:bg-violet-50 dark:text-violet-200 dark:hover:bg-violet-500/20"
                  >
                    <RefreshCw size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-violet-200 dark:hover:bg-violet-500/20"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Mark all read */}
              <div className="flex items-center justify-between border-b border-violet-100 px-4 py-2 dark:border-violet-400/20">
                <span className="text-xs text-slate-500 dark:text-violet-200">
                  Recent booking activity
                </span>

                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 disabled:opacity-40 dark:text-violet-300"
                >
                  <Check size={15} />
                  Mark all read
                </button>
              </div>

              {/* Notification list */}
              <div className="max-h-[min(65vh,540px)] overflow-y-auto">
                {error && (
                  <p className="m-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                    {error}
                  </p>
                )}

                {loading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-violet-700 dark:text-violet-200">
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Loading activity...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <Bell
                      size={31}
                      className="mx-auto text-violet-400"
                    />

                    <p className="mt-3 font-semibold text-slate-900 dark:text-white">
                      No booking notifications yet
                    </p>

                    <p className="mt-2 text-xs text-slate-500 dark:text-violet-200">
                      Booking activity will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const Icon = getNotificationIcon(
                      notification.type
                    );

                    const unread = !readSet.has(
                      notification.id
                    );

                    return (
                      <Link
                        key={notification.id}
                        href={notification.href}
                        onClick={() => {
                          markRead(notification.id);
                          setOpen(false);
                        }}
                        className={`flex gap-3 border-b border-violet-100 px-4 py-4 transition hover:bg-violet-50 dark:border-violet-400/10 dark:hover:bg-violet-500/10 ${
                          unread
                            ? "bg-violet-50/60 dark:bg-violet-500/10"
                            : ""
                        }`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
                          <Icon size={19} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {notification.title}
                            </span>

                            {unread && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-violet-600" />
                            )}
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-violet-200">
                            {notification.description}
                          </span>

                          <span className="mt-2 block text-[11px] text-slate-400 dark:text-violet-300/70">
                            {formatTimestamp(
                              notification.timestamp
                            )}
                          </span>
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-violet-100 px-4 py-3 text-center text-[11px] text-slate-500 dark:border-violet-400/20 dark:text-violet-200">
                Booking activity refreshes approximately every
                45 seconds while the page is open.
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
