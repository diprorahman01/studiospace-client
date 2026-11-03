
"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";

type ProtectedRouteGateProps = {
  children: ReactNode;
};

const PRIVATE_ROUTES = [
  "/dashboard",
  "/account-settings",
  "/add-studio",
  "/admin",
  "/booking-completions",
  "/booking-invoices",
  "/edit-studio",
  "/host-analytics",
  "/host-availability",
  "/host-bookings",
  "/host-calendar",
  "/my-bookings",
  "/my-listings",
  "/favorites",
  "/studios/edit",
];

const RETURN_PATH_KEY =
  "studiospace-pending-return-path";

function isPrivateRoute(pathname: string) {
  return PRIVATE_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );
}

function CheckingAccount() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center"
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg"
        style={{
          background:
            "var(--ss-surface-alt)",
          borderColor: "var(--ss-border)",
          color: "var(--ss-accent)",
        }}
      >
        <LoaderCircle
          size={29}
          className="animate-spin"
        />
      </div>

      <div>
        <h1
          className="text-lg font-bold"
          style={{
            color: "var(--ss-ink)",
          }}
        >
          Checking your account
        </h1>

        <p
          className="mt-2 text-sm"
          style={{
            color: "var(--ss-muted)",
          }}
        >
          Verifying your StudioSpace session.
        </p>
      </div>
    </div>
  );
}

function SignInRequired() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <LockKeyhole
        size={32}
        style={{
          color: "var(--ss-accent)",
        }}
      />

      <p
        className="text-sm font-medium"
        style={{
          color: "var(--ss-muted)",
        }}
      >
        Sign in to continue to your requested page.
      </p>
    </div>
  );
}

export default function ProtectedRouteGate({
  children,
}: ProtectedRouteGateProps) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    data: session,
    isPending,
  } = authClient.useSession();

  const protectedPage =
    isPrivateRoute(pathname);

  const authenticated =
    Boolean(session?.user?.id);

  useEffect(() => {
    try {
      if (protectedPage) {
        const destination =
          window.location.pathname +
          window.location.search +
          window.location.hash;

        // Remember the destination in this browser tab.
        // This also covers older private pages which
        // redirect directly to "/login" on API 401.
        sessionStorage.setItem(
          RETURN_PATH_KEY,
          JSON.stringify({
            path: destination,
            timestamp: Date.now(),
          })
        );
      } else if (
        pathname !== "/login" &&
        pathname !== "/register"
      ) {
        // Remove older destinations after navigating
        // to a normal public page.
        sessionStorage.removeItem(RETURN_PATH_KEY);
      }
    } catch {
      // Storage may be unavailable in privacy modes.
      // The explicit ?next= parameter still works.
    }
  }, [pathname, protectedPage]);

  useEffect(() => {
    if (
      !protectedPage ||
      isPending ||
      authenticated
    ) {
      return;
    }

    const destination =
      window.location.pathname +
      window.location.search +
      window.location.hash;

    router.replace(
      "/login?next=" +
        encodeURIComponent(destination)
    );
  }, [
    authenticated,
    isPending,
    protectedPage,
    router,
  ]);

  if (!protectedPage) {
    return <>{children}</>;
  }

  if (isPending) {
    return <CheckingAccount />;
  }

  if (!authenticated) {
    return <SignInRequired />;
  }

  return <>{children}</>;
}
