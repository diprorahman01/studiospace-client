
"use client";

import Link from "next/link";
import { useState } from "react";
import { Aperture, ArrowRight } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { toast } from "sonner";

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Explore Studios", href: "/studios" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "About Us", href: "/about-us" },
];

const categories = [
  "Photo Studios",
  "Sound Stages",
  "Podcast Rooms",
  "Music Suites",
  "Art Workshops",
];

export default function Footer() {
  const [email, setEmail] = useState("");

  function handleSubscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    toast.info("Newsletter subscriptions are coming soon.");
    setEmail("");
  }

  return (
    <footer className="bg-[#111026] text-white">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Aperture className="h-8 w-8 text-violet-400" />
              <span className="text-xl font-bold">StudioSpace</span>
            </Link>

            <p className="mt-4 text-sm leading-7 text-slate-400">
              A peer-to-peer marketplace connecting creators with
              professional studios and creative workspaces.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <a href="https://www.facebook.com/" target="_blank"
                rel="noopener noreferrer" aria-label="Facebook">
                <FaFacebookF className="text-slate-400 hover:text-violet-400" />
              </a>

              <a href="https://www.instagram.com/" target="_blank"
                rel="noopener noreferrer" aria-label="Instagram">
                <FaInstagram className="text-slate-400 hover:text-violet-400" />
              </a>

              <a href="https://x.com/" target="_blank"
                rel="noopener noreferrer" aria-label="X">
                <FaXTwitter className="text-slate-400 hover:text-violet-400" />
              </a>

              <a href="https://www.linkedin.com/" target="_blank"
                rel="noopener noreferrer" aria-label="LinkedIn">
                <FaLinkedinIn className="text-slate-400 hover:text-violet-400" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-sm text-slate-400 hover:text-violet-400">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-lg font-semibold">
              Studio Categories
            </h3>
            <ul className="space-y-3">
              {categories.map((category) => (
                <li key={category}>
                  <Link
                    href={`/studios?category=${encodeURIComponent(category)}`}
                    className="text-sm text-slate-400 hover:text-violet-400"
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-lg font-semibold">
              Stay in the Loop
            </h3>

            <p className="mb-5 text-sm leading-6 text-slate-400">
              Get updates on new studios, creative resources,
              and platform news.
            </p>

            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email address"
                aria-label="Newsletter email"
                required
                className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400 focus:border-violet-500"
              />

              <button
                type="submit"
                aria-label="Subscribe"
                className="rounded-lg bg-violet-700 px-4 py-2 hover:bg-violet-800"
              >
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© 2026 StudioSpace. All rights reserved.</p>

          <div className="flex gap-5">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
