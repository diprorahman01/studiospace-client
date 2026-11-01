
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
  Image as ImageIcon,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (name.trim().length < 2) {
      toast.error("Name must contain at least 2 characters.");
      return;
    }

    if (password.length < 8 || password.length > 128) {
      toast.error("Password must contain 8–128 characters.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      toast.error("Password must contain an uppercase letter.");
      return;
    }

    if (!/[a-z]/.test(password)) {
      toast.error("Password must contain a lowercase letter.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const image = photoUrl.trim();

    if (image) {
      try {
        const url = new URL(image);

        if (
          url.protocol !== "https:" &&
          url.protocol !== "http:"
        ) {
          throw new Error("Invalid protocol");
        }
      } catch {
        toast.error("Please enter a valid Photo URL.");
        return;
      }
    }

    setLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        ...(image ? { image } : {}),
      });

      if (error) {
        toast.error(error.message || "Registration failed.");
        return;
      }

      toast.success("Account created! Please sign in.");

      // Required assignment redirect.
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleRegister() {
    if (loading || googleLoading) return;

    setGoogleLoading(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
        errorCallbackURL: "/register",
      });

      if (error) {
        toast.error(
          error.message || "Could not connect to Google."
        );
        setGoogleLoading(false);
      }
    } catch (error) {
      console.error("Google registration error:", error);
      toast.error("Google registration failed.");
      setGoogleLoading(false);
    }
  }

  return (
    <main className="flex min-h-[85vh] items-center justify-center bg-[#f8f7fd] px-4 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-xl lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-[#17112e] p-12 text-white lg:flex">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-fuchsia-600/20 blur-3xl" />

          <Link href="/" className="relative flex items-center gap-3">
            <Aperture className="h-9 w-9 text-violet-400" />
            <span className="text-2xl font-bold">StudioSpace</span>
          </Link>

          <div className="relative">
            <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/20">
              <Aperture className="h-12 w-12 text-violet-300" />
            </div>

            <h2 className="text-4xl font-extrabold leading-tight">
              Your Creative
              <span className="block text-violet-400">
                Journey Starts Here.
              </span>
            </h2>

            <p className="mt-6 max-w-sm leading-8 text-slate-300">
              Join StudioSpace to discover studios, manage
              bookings, and share inspiring spaces with creators.
            </p>

            <div className="mt-9 space-y-4">
              {[
                "Explore professional creative studios",
                "Manage your studio bookings",
                "List your own creative workspace",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
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

        <div className="px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-950">
              Create an Account
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Enter your information to join StudioSpace.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label
                htmlFor="register-name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Full Name
              </label>
              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  minLength={2}
                  required
                  disabled={loading || googleLoading}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none focus:border-violet-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="register-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  disabled={loading || googleLoading}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none focus:border-violet-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="register-photo"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Photo URL (Optional)
              </label>
              <div className="relative">
                <ImageIcon
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="register-photo"
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  disabled={loading || googleLoading}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none focus:border-violet-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="register-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  disabled={loading || googleLoading}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-12 text-sm text-slate-900 outline-none focus:border-violet-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
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
              <p className="mt-2 text-xs text-slate-500">
                8–128 characters, including an uppercase and
                a lowercase letter.
              </p>
            </div>

            <div>
              <label
                htmlFor="register-confirm-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Confirm Password
              </label>
              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="register-confirm-password"
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                  disabled={loading || googleLoading}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-12 text-sm text-slate-900 outline-none focus:border-violet-600"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((v) => !v)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">
              OR SIGN UP WITH
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading || googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
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

          <p className="mt-7 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-violet-700 hover:text-violet-900"
            >
              Sign In
            </Link>
          </p>

          <p className="mt-8 text-center text-xs leading-6 text-slate-400">
            By registering, you agree to follow the StudioSpace
            platform guidelines.
          </p>
        </div>
      </div>
    </main>
  );
}
