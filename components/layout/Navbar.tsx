"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Aperture,
  Menu,
  X,
  LayoutDashboard,
  CalendarDays,
  LogOut,
  LoaderCircle,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Explore Studios", href: "/studios" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "About Us", href: "/about-us" },
];

function NavbarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const user = session?.user;

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const { error } = await authClient.signOut();

      if (error) {
        toast.error(error.message || "Failed to sign out.");
        return;
      }

      setProfileOpen(false);
      setMenuOpen(false);

      toast.success("Signed out successfully!");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Something went wrong while signing out.");
    } finally {
      setSigningOut(false);
    }
  }

  function closeMenus() {
    setMenuOpen(false);
    setProfileOpen(false);
  }

  function isActive(href: string) {
    return href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
        {/* Logo */}
        <Link
          href="/"
          onClick={closeMenus}
          className="flex items-center gap-2"
        >
          <Aperture className="h-8 w-8 text-violet-700" />

          <span className="text-xl font-bold text-slate-950">
            StudioSpace
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-violet-700"
                  : "text-slate-600 hover:text-violet-700"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop authentication */}
        <div className="hidden items-center gap-3 md:flex">
          {isPending ? (
            <div className="flex h-10 w-28 items-center justify-center">
              <LoaderCircle
                size={20}
                className="animate-spin text-violet-700"
              />
            </div>
          ) : user ? (
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 transition hover:bg-violet-100"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-700 text-sm font-bold text-white">
                  {initials}
                </span>

                <span className="max-w-28 truncate text-sm font-semibold text-slate-900">
                  {user.name}
                </span>

                <ChevronDown
                  size={16}
                  className={`text-slate-500 transition-transform ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                >
                  {/* User information */}
                  <div className="border-b border-slate-100 bg-violet-50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-700 font-bold text-white">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-950">
                          {user.name}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profile links */}
                  <div className="p-2">
                    <Link
                      href="/dashboard"
                      role="menuitem"
                      onClick={closeMenus}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                    >
                      <LayoutDashboard size={18} />
                      Dashboard
                    </Link>

                    <Link
                      href="/my-bookings"
                      role="menuitem"
                      onClick={closeMenus}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                    >
                      <CalendarDays size={18} />
                      My Bookings
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 p-2">
                    <button
                      type="button"
                      role="menuitem"
                      disabled={signingOut}
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {signingOut ? (
                        <LoaderCircle
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <LogOut size={18} />
                      )}
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-violet-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-800"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-2 text-slate-800 md:hidden"
        >
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </nav>

      {/* Mobile navigation */}
      {menuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-slate-200 bg-white px-5 py-5 md:hidden"
        >
          <div className="flex flex-col gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenus}
                className={`text-sm font-medium ${
                  isActive(link.href)
                    ? "text-violet-700"
                    : "text-slate-700"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {isPending ? (
              <LoaderCircle
                size={22}
                className="animate-spin text-violet-700"
              />
            ) : user ? (
              <>
                <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-700 font-bold text-white">
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">
                      {user.name}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {user.email}
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  onClick={closeMenus}
                  className="flex items-center gap-3 text-sm font-medium text-slate-700"
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>

                <Link
                  href="/my-bookings"
                  onClick={closeMenus}
                  className="flex items-center gap-3 text-sm font-medium text-slate-700"
                >
                  <CalendarDays size={18} />
                  My Bookings
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex items-center gap-3 text-left text-sm font-semibold text-red-600 disabled:opacity-50"
                >
                  {signingOut ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <LogOut size={18} />
                  )}
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <Link
                  href="/login"
                  onClick={closeMenus}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-800"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={closeMenus}
                  className="flex-1 rounded-lg bg-violet-700 px-4 py-2.5 text-center text-sm font-medium text-white"
                >
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

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-20 border-b border-slate-200 bg-white" />}>
      <NavbarContent />
    </Suspense>
  );
}
