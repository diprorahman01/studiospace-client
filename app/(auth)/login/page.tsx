
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Aperture,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

function safeReturnPath(value: string | null): string {
  if (!value) return "/";

  // Only internal routes may be used for login
  // redirection. External URLs are not allowed.
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  ) {
    return "/";
  }

  try {
    const parsed = new URL(
      value,
      "http://localhost"
    );

    if (parsed.origin !== "http://localhost") {
      return "/";
    }

    if (
      parsed.pathname === "/login" ||
      parsed.pathname === "/register" ||
      parsed.pathname.startsWith("/login/") ||
      parsed.pathname.startsWith("/register/")
    ) {
      return "/";
    }

    return (
      parsed.pathname +
      parsed.search +
      parsed.hash
    );
  } catch {
    return "/";
  }
}


function getReturnPath(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  const params = new URLSearchParams(
    window.location.search
  );

  // First check the destination in the login URL.
  const destination =
    params.get("next") ||
    params.get("callbackUrl") ||
    params.get("callbackURL") ||
    params.get("redirect");

  if (destination) {
    return safeReturnPath(destination);
  }

  // If the URL has no destination, check whether
  // a private page saved one before redirecting.
  try {
    const saved = sessionStorage.getItem(
      "studiospace-pending-return-path"
    );

    if (saved) {
      const record = JSON.parse(saved) as {
        path?: string;
        timestamp?: number;
      };

      const validAge =
        typeof record.timestamp === "number" &&
        record.timestamp <= Date.now() &&
        Date.now() - record.timestamp <= 600000;

      if (
        typeof record.path === "string" &&
        validAge
      ) {
        return safeReturnPath(record.path);
      }
    }
  } catch {
    // Continue to homepage if storage is unavailable.
  }

  return "/";
}


export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [googleLoading, setGoogleLoading] =
    useState(false);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.error(
        "Please enter your email and password."
      );
      return;
    }

    if (loading || googleLoading) return;

    const destination = getReturnPath();

    setLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        toast.error(
          error.message ||
            "Invalid email or password."
        );
        return;
      }

      toast.success(
        "Logged in successfully!"
      );

      router.replace(destination);
      router.refresh();
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      toast.error(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (googleLoading || loading) return;

    const destination = getReturnPath();

    setGoogleLoading(true);

    try {
      const { error } =
        await authClient.signIn.social({
          provider: "google",
          callbackURL: destination,
          errorCallbackURL:
            "/login?next=" +
            encodeURIComponent(destination),
        });

      if (error) {
        toast.error(
          error.message ||
            "Google login could not be started."
        );

        setGoogleLoading(false);
      }

      // Better Auth navigates to the Google login
      // page and later returns to callbackURL.
    } catch (error) {
      console.error(
        "Google login error:",
        error
      );

      toast.error(
        "Unable to sign in with Google."
      );

      setGoogleLoading(false);
    }
  }

  function handleForgotPassword() {
    toast.info(
      "Password reset is not available for this assignment. Please use your existing account credentials.",
      { duration: 6000 }
    );
  }

  return (
    <main className="flex min-h-[85vh] items-center justify-center bg-[#f8f7fd] px-4 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-xl lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-[#17112e] p-12 text-white lg:flex">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />

          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-fuchsia-600/20 blur-3xl" />

          <Link
            href="/"
            className="relative flex items-center gap-3"
          >
            <Aperture className="h-9 w-9 text-violet-400" />
            <span className="text-2xl font-bold">
              StudioSpace
            </span>
          </Link>

          <div className="relative">
            <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/20">
              <Aperture className="h-12 w-12 text-violet-300" />
            </div>

            <h2 className="text-4xl font-extrabold leading-tight">
              Welcome Back

              <span className="block text-violet-400">
                To StudioSpace.
              </span>
            </h2>

            <p className="mt-6 max-w-sm leading-8 text-slate-300">
              Sign in to explore creative spaces,
              manage studio bookings, and bring
              your ideas to life.
            </p>

            <div className="mt-9 space-y-4">
              {[
                "Discover professional studios",
                "Manage your bookings",
                "Host your creative workspace",
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2
                    size={19}
                    className="text-violet-400"
                  />

                  <span className="text-sm text-slate-200">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-sm text-slate-400">
            StudioSpace — Create Without Limits
          </p>
        </div>

        <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-12">
          <div className="mb-9">
            <h1 className="text-3xl font-extrabold text-slate-950">
              Sign In
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Welcome back! Enter your account
              credentials to continue.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  aria-hidden="true"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  disabled={
                    loading || googleLoading
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none focus:border-violet-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  aria-hidden="true"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="login-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={
                    loading || googleLoading
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-12 text-sm text-slate-900 outline-none focus:border-violet-600"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-700"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={
                    handleForgotPassword
                  }
                  className="text-xs font-semibold text-violet-700 underline-offset-4 transition hover:text-violet-900 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                loading || googleLoading
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-xs text-slate-400">
              OR CONTINUE WITH
            </span>

            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={
              loading || googleLoading
            }
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {googleLoading ? (
              <LoaderCircle
                size={19}
                className="animate-spin"
              />
            ) : (
              <span
                aria-hidden="true"
                className="text-xl font-bold text-[#4285F4]"
              >
                G
              </span>
            )}

            {googleLoading
              ? "Connecting to Google..."
              : "Continue with Google"}
          </button>

          <p className="mt-8 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}

            <Link
              href="/register"
              className="font-semibold text-violet-700 hover:text-violet-900"
            >
              Create Account
            </Link>
          </p>

          <div className="mt-10 border-t border-slate-100 pt-6 text-center">
            <Link
              href="/"
              className="text-sm font-medium text-slate-500 hover:text-violet-700"
            >
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
