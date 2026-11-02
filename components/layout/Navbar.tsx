
"use client";

import { Suspense, useState } from "react";
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

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";

  if (href.startsWith("/#")) {
    return false;
  }

  if (href === "/my-listings") {
    return (
      pathname === "/my-listings" ||
      pathname.startsWith("/edit-studio/") ||
      pathname.startsWith("/studios/edit/")
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationContent() {
  const pathname = usePathname();
  const router = useRouter();

  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const displayName = user?.name?.trim() || "My Account";

  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U";

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
        toast.error(result.error.message || "Unable to sign out.");
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
    <header className="ss-navbar sticky top-0 z-40">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-5"
      >
        <Link
          href="/"
          onClick={closeMenus}
          className="group inline-flex shrink-0 items-center gap-2.5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8f47d5] to-[#6422ac] shadow-[0_8px_22px_rgba(99,36,166,0.25)] transition-transform group-hover:rotate-12">
            <Aperture
              size={26}
              strokeWidth={2.2}
              className="text-white"
              aria-hidden="true"
            />
          </span>

          <span
            className="text-[21px] font-extrabold tracking-tight"
            style={{ color: "var(--ss-ink)" }}
          >
            Studio
            <span className="ss-accent-text">Space</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={closeMenus}
              data-active={isActivePath(pathname, link.href)}
              className="ss-navbar-link text-sm font-semibold"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {isPending ? (
            <div className="flex h-11 w-36 items-center justify-center rounded-xl border border-violet-200/40">
              <LoaderCircle
                size={19}
                className="animate-spin"
                style={{ color: "var(--ss-accent)" }}
              />
            </div>
          ) : user ? (
            <>
              <Link
                href="/add-studio"
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition hover:-translate-y-0.5"
                style={{
                  borderColor: "var(--ss-border)",
                  color: "var(--ss-accent)",
                  background: "var(--ss-surface-alt)",
                }}
              >
                <Plus size={17} />
                Host Your Space
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((old) => !old)}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold"
                  style={{
                    background: "var(--ss-surface)",
                    borderColor: "var(--ss-border)",
                    color: "var(--ss-ink)",
                  }}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-800 text-xs font-bold text-white">
                    {initials}
                  </span>

                  <span className="max-w-28 truncate">
                    {displayName}
                  </span>

                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
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

                    <div
                      role="menu"
                      aria-label="Account navigation"
                      className="ss-navbar-panel absolute right-0 top-[calc(100%+12px)] z-50 w-80 overflow-hidden rounded-[22px]"
                    >
                      <div
                        className="border-b px-5 py-4"
                        style={{
                          borderColor: "var(--ss-border)",
                          background: "var(--ss-surface-alt)",
                        }}
                      >
                        <p
                          className="truncate text-sm font-bold"
                          style={{ color: "var(--ss-ink)" }}
                        >
                          {displayName}
                        </p>
                        <p
                          className="mt-1 truncate text-xs"
                          style={{ color: "var(--ss-muted)" }}
                        >
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
                              role="menuitem"
                              onClick={closeMenus}
                              className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-violet-300/15"
                              style={{
                                color: active
                                  ? "var(--ss-accent)"
                                  : "var(--ss-ink)",
                                background: active
                                  ? "var(--ss-surface-alt)"
                                  : undefined,
                              }}
                            >
                              <span
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                style={{
                                  background: "var(--ss-surface-alt)",
                                }}
                              >
                                <Icon size={18} />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold">
                                  {item.label}
                                </span>
                                <span
                                  className="block text-xs"
                                  style={{ color: "var(--ss-muted)" }}
                                >
                                  {item.description}
                                </span>
                              </span>
                            </Link>
                          );
                        })}
                      </div>

                      <div
                        className="border-t p-2"
                        style={{ borderColor: "var(--ss-border)" }}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          disabled={signingOut}
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-rose-500 transition hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {signingOut ? (
                            <LoaderCircle
                              size={18}
                              className="animate-spin"
                            />
                          ) : (
                            <LogOut size={18} />
                          )}
                          {signingOut ? "Signing Out..." : "Sign Out"}
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
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition hover:opacity-70"
                style={{ color: "var(--ss-ink)" }}
              >
                <LogIn size={17} />
                Login
              </Link>

              <Link
                href="/register"
                className="ss-cta-primary px-5 py-2.5"
              >
                Register
                <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((old) => !old)}
          aria-label={
            mobileOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-controls="mobile-navigation"
          aria-expanded={mobileOpen}
          className="flex h-11 w-11 items-center justify-center rounded-xl border lg:hidden"
          style={{
            color: "var(--ss-ink)",
            borderColor: "var(--ss-border)",
            background: "var(--ss-surface)",
          }}
        >
          {mobileOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </nav>

      {mobileOpen && (
        <div
          id="mobile-navigation"
          className="max-h-[calc(100dvh-76px)] overflow-y-auto border-t px-5 pb-6 pt-4 lg:hidden"
          style={{
            background: "var(--ss-surface)",
            borderColor: "var(--ss-border)",
          }}
        >
          <div className="mx-auto max-w-7xl space-y-1">
            <p
              className="px-3 pb-2 text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--ss-muted)" }}
            >
              Explore
            </p>

            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={closeMenus}
                className="block rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-violet-300/15"
                style={{
                  color: isActivePath(pathname, link.href)
                    ? "var(--ss-accent)"
                    : "var(--ss-ink)",
                }}
              >
                {link.label}
              </Link>
            ))}

            <div
              className="my-4 border-t"
              style={{ borderColor: "var(--ss-border)" }}
            />

            {isPending ? (
              <div
                className="flex items-center gap-3 px-4 py-4 text-sm"
                style={{ color: "var(--ss-muted)" }}
              >
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
                Checking account...
              </div>
            ) : user ? (
              <>
                <div
                  className="mb-4 flex items-center gap-3 rounded-xl p-4"
                  style={{ background: "var(--ss-surface-alt)" }}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-700 text-sm font-bold text-white">
                    {initials}
                  </span>

                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-bold"
                      style={{ color: "var(--ss-ink)" }}
                    >
                      {displayName}
                    </p>
                    <p
                      className="truncate text-xs"
                      style={{ color: "var(--ss-muted)" }}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>

                <p
                  className="px-3 pb-2 text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--ss-muted)" }}
                >
                  My Account
                </p>

                {ACCOUNT_LINKS.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenus}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-violet-300/15"
                      style={{
                        color: isActivePath(pathname, item.href)
                          ? "var(--ss-accent)"
                          : "var(--ss-ink)",
                      }}
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
                  className="mt-3 flex w-full items-center gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-left text-sm font-semibold text-rose-500 disabled:opacity-50"
                >
                  {signingOut ? (
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                  ) : (
                    <LogOut size={19} />
                  )}
                  {signingOut ? "Signing Out..." : "Sign Out"}
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={closeMenus}
                  className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold"
                  style={{
                    borderColor: "var(--ss-border)",
                    color: "var(--ss-ink)",
                  }}
                >
                  <LogIn size={17} />
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={closeMenus}
                  className="ss-cta-primary"
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
    <header className="ss-navbar sticky top-0 z-40">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800">
            <Aperture
              size={26}
              className="text-white"
            />
          </span>
          <span
            className="text-xl font-extrabold"
            style={{ color: "var(--ss-ink)" }}
          >
            StudioSpace
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Home
            size={18}
            className="hidden text-violet-400 sm:block"
          />
          <div className="h-10 w-10 animate-pulse rounded-xl bg-violet-300/30" />
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
