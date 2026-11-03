
"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import {
  ArrowRight,
  Mail,
  Sparkles,
} from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";

import { FaXTwitter } from "react-icons/fa6";

import { toast } from "sonner";
import BrandLogo from "@/components/ui/BrandLogo";

const COPYRIGHT_YEAR = 2026;

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Explore Studios", href: "/studios" },
  { name: "How It Works", href: "/#how-it-works" },
  { name: "About Us", href: "/#about" },
  { name: "Terms & Conditions", href: "/terms" },
];

const categories = [
  { name: "Photo Studios", value: "Photo Studio" },
  { name: "Sound Stages", value: "Film Stage" },
  { name: "Podcast Rooms", value: "Podcast Lounge" },
  { name: "Music Suites", value: "Music Suite" },
  { name: "Art Workshops", value: "Art Workshop" },
];

const socialLinks = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/",
    icon: FaFacebookF,
    gradient:
      "from-[#2450af] via-[#5276f2] to-[#873ce0]",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/",
    icon: FaInstagram,
    gradient:
      "from-[#8136ca] via-[#ca3eb8] to-[#ee7196]",
  },
  {
    name: "X",
    href: "https://x.com/",
    icon: FaXTwitter,
    gradient:
      "from-[#26457c] via-[#4a55be] to-[#823ce0]",
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/",
    icon: FaLinkedinIn,
    gradient:
      "from-[#14538f] via-[#267ebd] to-[#6451da]",
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");

  function handleSubscribe(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!email.trim()) {
      toast.error(
        "Please enter your email address."
      );
      return;
    }

    toast.info(
      "Newsletter subscriptions are coming soon."
    );
    setEmail("");
  }

  return (
    <footer className="ss-footer relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 left-0 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.2fr_0.9fr_0.9fr_1.25fr]">
          <div>
            <BrandLogo
              variant="footer"
              className="text-white"
            />

            <p className="mt-5 max-w-xs text-sm leading-7 text-[#d9c9e7]">
              A creative studio marketplace connecting
              creators with inspiring spaces for
              photography, recording, film and more.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className={[
                      "group relative flex h-11 w-11",
                      "items-center justify-center",
                      "overflow-hidden rounded-xl border",
                      "border-white/25 text-white",
                      "shadow-[0_8px_20px_rgba(79,29,141,0.23)]",
                      "transition duration-300",
                      "hover:-translate-y-1",
                      "hover:shadow-[0_12px_27px_rgba(151,70,223,0.38)]",
                      "bg-gradient-to-br",
                      social.gradient,
                    ].join(" ")}
                  >
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/15" />

                    <Icon
                      size={18}
                      aria-hidden="true"
                      className="relative z-10 drop-shadow-md transition-transform group-hover:scale-110"
                    />
                  </a>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-[#c1accf]">
              Social links currently lead to platform
              homepages.
            </p>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white">
              Quick Links
            </h3>

            <div className="mt-5 space-y-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block text-sm text-[#d9c9e7] transition-colors hover:text-[#e4bfff]"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white">
              Studio Categories
            </h3>

            <div className="mt-5 space-y-3">
              {categories.map((category) => (
                <Link
                  key={category.value}
                  href={`/studios?category=${encodeURIComponent(
                    category.value
                  )}`}
                  className="block text-sm text-[#d9c9e7] transition-colors hover:text-[#e4bfff]"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-white">
              Stay in the Loop
            </h3>

            <p className="mt-5 text-sm leading-7 text-[#d9c9e7]">
              Interested in future updates about
              creative studios and the platform?
            </p>

            <form
              onSubmit={handleSubscribe}
              className="mt-5"
            >
              <label
                htmlFor="footer-email"
                className="sr-only"
              >
                Newsletter email
              </label>

              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Mail
                    size={17}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#baa6ce]"
                  />

                  <input
                    id="footer-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="Your email"
                    required
                    className="w-full rounded-xl border border-white/20 bg-white/[0.08] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#baa6ce] focus:border-[#d4aeff]"
                  />
                </div>

                <button
                  type="submit"
                  aria-label="Check newsletter availability"
                  className="flex h-11 w-12 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/40 bg-gradient-to-br from-[#7934c7] via-[#9544e9] to-[#ca40cf] text-white shadow-[0_8px_22px_rgba(150,61,218,0.32)] transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  <ArrowRight
                    size={19}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <p className="mt-3 text-xs text-[#c9b4dc]">
                Newsletter subscriptions are not yet
                active.
              </p>
            </form>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/15 pt-7 text-sm text-[#cbb8dc] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>
              © {COPYRIGHT_YEAR} StudioSpace.
              All rights reserved.
            </span>

            <span
              aria-hidden="true"
              className="hidden text-white/40 sm:inline"
            >
              |
            </span>

            <Link
              href="/terms"
              className="font-medium text-[#e5c9ff] underline-offset-4 transition hover:text-white hover:underline"
            >
              Terms &amp; Conditions
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Sparkles
              size={14}
              className="text-violet-300"
              aria-hidden="true"
            />

            <span>
              Built for creative possibilities
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
