
"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  Aperture,
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

const COPYRIGHT_YEAR = 2026;

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Explore Studios", href: "/studios" },
  { name: "How It Works", href: "/#how-it-works" },
  { name: "About Us", href: "/#about" },
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
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/",
    icon: FaInstagram,
  },
  {
    name: "X",
    href: "https://x.com/",
    icon: FaXTwitter,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/",
    icon: FaLinkedinIn,
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");

  function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    toast.info("Newsletter subscriptions are coming soon.");
    setEmail("");
  }

  return (
    <footer className="ss-footer relative overflow-hidden">
      {/* Decorative glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.2fr_0.9fr_0.9fr_1.25fr]">
          {/* Brand and social links */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-800 shadow-lg">
                <Aperture
                  size={27}
                  className="text-white"
                  aria-hidden="true"
                />
              </span>

              <span className="text-xl font-extrabold tracking-tight text-white">
                Studio
                <span className="text-[#d7afff]">
                  Space
                </span>
              </span>
            </Link>

            <p className="mt-5 max-w-xs text-sm leading-7 text-[#d9c9e7]">
              A creative studio marketplace connecting
              creators with inspiring spaces for photography,
              recording, film and more.
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
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.07] text-[#dfc9f0] transition hover:-translate-y-1 hover:border-violet-300/40 hover:bg-white/[0.14]"
                  >
                    <Icon size={16} aria-hidden="true" />
                  </a>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-[#c1accf]">
              Social links currently lead to platform homepages.
            </p>
          </div>

          {/* Quick links */}
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

          {/* Studio categories */}
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

          {/* Newsletter */}
          <div>
            <h3 className="text-base font-extrabold text-white">
              Stay in the Loop
            </h3>

            <p className="mt-5 text-sm leading-7 text-[#d9c9e7]">
              Interested in future updates about creative
              studios and the platform?
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
                  className="flex h-11 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500"
                >
                  <ArrowRight size={19} aria-hidden="true" />
                </button>
              </div>

              <p className="mt-3 text-xs text-[#c9b4dc]">
                Newsletter subscriptions are not yet active.
              </p>
            </form>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="mt-14 flex flex-col gap-4 border-t border-white/15 pt-7 text-sm text-[#cbb8dc] md:flex-row md:items-center md:justify-between">
          <p>
            © {COPYRIGHT_YEAR} StudioSpace. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Sparkles
              size={14}
              className="text-violet-300"
              aria-hidden="true"
            />

            <span>Built for creative possibilities</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
