
"use client";

import {
  Suspense,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Aperture,
  ArrowRight,
  Building2,
  CalendarCheck2,
  ChevronDown,
  Home,
  LayoutDashboard,
  LoaderCircle,
  LogIn,
  LogOut,
  Menu,
  Plus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const PUBLIC_LINKS = [
  { label: "Home", href: "/" },
  { label: "Explore Studios", href: "/studios" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "About Us", href: "/#about" },
];

const ACCOUNT_LINKS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Your account overview",
  },
  {
    label: "My Listings",
    href: "/my-listings",
    icon: Building2,
    description: "Manage studios you own",
  },
  {
    label: "Host Bookings",
    href: "/host-bookings",
    icon: Users,
    description: "Customer reservations",
  },
  {
    label: "My Bookings",
    href: "/my-bookings",
    icon: CalendarCheck2,
    description: "Reservations you made",
  },
  {
    label: "Add Studio",
    href: "/add-studio",
    icon: Plus,
    description: "Publish a new workspace",
  },
];

function isActivePath(
  pathname: string,
  href: string
) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href.startsWith("/#")) {
    return pathname === "/";
  }

  if (href === "/my-listings") {
    return (
      pathname === "/my-listings" ||
      pathname.startsWith("/edit-studio/")
    );
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

function NavigationContent() {
  const pathname = usePathname();
  const router = useRouter();

  const {
    data: session,
    isPending,
  } = authClient.useSession();

  const user = session?.user;

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [signingOut, setSigningOut] =
    useState(false);

  const displayName =
    user?.name?.trim() || "My Account";

  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  function closeMenus() {
    setMobileOpen(false);
    setProfileOpen(false);
  }

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        toast.error(
          result.error.message || "Unable to sign out."
        );
        return;
      }

      closeMenus();

      toast.success("Signed out successfully.");

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-5"
      >
        {/* Brand */}
        <Link
          href="/"
          onClick={closeMenus}
          className="inline-flex shrink-0 items-center gap-2.5"
        >
          <Aperture
            size={31}
            strokeWidth={2.5}
            className="text-violet-700"
          />

          <span className="text-xl font-extrabold tracking-tight text-slate-950">
            StudioSpace
          </span>
        </Link>

        {/* Desktop public navigation */}
        <div className="hidden items-center gap-7 lg:flex">
          {PUBLIC_LINKS.map((link) => {
            const active = isActivePath(
              pathname,
              link.href
            );

            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={closeMenus}
                className={`text-sm font-semibold transition ${
                  active
                    ? "text-violet-700"
                    : "text-slate-600 hover:text-violet-700"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop account actions */}
        <div className="hidden items-center gap-3 lg:flex">
          {isPending ? (
            <div className="flex h-11 w-36 items-center justify-center rounded-xl bg-slate-50">
              <LoaderCircle
                size={19}
                className="animate-spin text-violet-700"
              />
            </div>
          ) : user ? (
            <>
              <Link
                href="/add-studio"
                className="inline-flex items-center gap-2 rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50"
              >
                <Plus size={17} />
                Host Your Space
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setProfileOpen((current) => !current)
                  }
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-3 rounded-xl bg-violet-50 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-violet-100"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-700 text-xs font-bold text-white">
                    {initials || "U"}
                  </span>

                  <span className="max-w-32 truncate">
                    {displayName}
                  </span>

                  <ChevronDown
                    size={16}
                    className={`text-slate-500 transition-transform ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {profileOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Close account menu"
                      onClick={() => setProfileOpen(false)}
                      className="fixed inset-0 z-40 cursor-default"
                    />

                    <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                      <div className="border-b border-slate-100 bg-violet-50 px-5 py-4">
                        <p className="truncate text-sm font-bold text-slate-950">
                          {displayName}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>

                      <div className="p-2">
                        {ACCOUNT_LINKS.map((item) => {
                          const Icon = item.icon;
                          const active = isActivePath(
                            pathname,
                            item.href
                          );

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={closeMenus}
                              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                                active
                                  ? "bg-violet-50 text-violet-700"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                                <Icon size={18} />
                              </span>

                              <span className="min-w-0">
                                <span className="block text-sm font-semibold">
                                  {item.label}
                                </span>

                                <span className="block text-xs text-slate-500">
                                  {item.description}
                                </span>
                              </span>
                            </Link>
                          );
                        })}
                      </div>

                      <div className="border-t border-slate-100 p-2">
                        <button
                          type="button"
                          disabled={signingOut}
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {signingOut ? (
                            <LoaderCircle
                              size={18}
                              className="animate-spin"
                            />
                          ) : (
                            <LogOut size={18} />
                          )}

                          {signingOut
                            ? "Signing Out..."
                            : "Sign Out"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-violet-700"
              >
                <LogIn size={17} />
                Login
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800"
              >
                Register
                <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() =>
            setMobileOpen((current) => !current)
          }
          aria-label={
            mobileOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-800 lg:hidden"
        >
          {mobileOpen ? (
            <X size={23} />
          ) : (
            <Menu size={23} />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-navigation"
          className="max-h-[calc(100dvh-76px)] overflow-y-auto border-t border-slate-100 bg-white px-5 pb-6 pt-4 lg:hidden"
        >
          <div className="mx-auto max-w-7xl space-y-1">
            <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Explore
            </p>

            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={closeMenus}
                className={`block rounded-xl px-4 py-3 text-sm font-semibold ${
                  isActivePath(pathname, link.href)
                    ? "bg-violet-50 text-violet-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="my-4 border-t border-slate-100" />

            {isPending ? (
              <div className="flex items-center gap-3 px-4 py-4 text-sm text-slate-500">
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
                Checking account...
              </div>
            ) : user ? (
              <>
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-violet-50 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-700 text-sm font-bold text-white">
                    {initials || "U"}
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-950">
                      {displayName}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {user.email}
                    </span>
                  </span>
                </div>

                <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  My Account
                </p>

                {ACCOUNT_LINKS.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenus}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${
                        isActivePath(pathname, item.href)
                          ? "bg-violet-50 text-violet-700"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={19} />
                      {item.label}
                    </Link>
                  );
                })}

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="mt-3 flex w-full items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-600 disabled:opacity-50"
                >
                  {signingOut ? (
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                  ) : (
                    <LogOut size={19} />
                  )}
                  {signingOut
                    ? "Signing Out..."
                    : "Sign Out"}
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={closeMenus}
                  className="flex items-center justify-center gap-2 rounded-xl border border-violet-200 px-4 py-3 text-sm font-semibold text-violet-700"
                >
                  <LogIn size={17} />
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={closeMenus}
                  className="flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white"
                >
                  <UserRound size={17} />
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavbarFallback() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5"
        >
          <Aperture
            size={31}
            className="text-violet-700"
          />

          <span className="text-xl font-extrabold text-slate-950">
            StudioSpace
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Home
            size={18}
            className="hidden text-slate-300 sm:block"
          />

          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<NavbarFallback />}>
      <NavigationContent />
    </Suspense>
  );
}
