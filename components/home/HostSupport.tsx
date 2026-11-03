
import Link from "next/link";

import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Headset,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import GradientIcon, {
  type GradientIconTone,
} from "@/components/ui/GradientIcon";

const supportFeatures: {
  title: string;
  description: string;
  icon: typeof ShieldCheck;
  tone: GradientIconTone;
}[] = [
  {
    title: "Clear Booking Details",
    description:
      "Review studio information, rates and booking details before making a request.",
    icon: ShieldCheck,
    tone: "blue",
  },
  {
    title: "Host Information",
    description:
      "Explore the details shared by hosts and learn more about each creative space.",
    icon: BadgeCheck,
    tone: "pink",
  },
  {
    title: "Equipment Information",
    description:
      "Check available equipment and facilities to plan your creative session.",
    icon: Camera,
    tone: "cyan",
  },
  {
    title: "Booking Management",
    description:
      "Manage your reservations and stay informed about their current status.",
    icon: Headset,
    tone: "violet",
  },
];

export default function HostSupport() {
  return (
    <section
      id="about"
      aria-labelledby="host-support-heading"
      className="ss-home-section scroll-mt-24"
    >
      <div className="ss-container">
        <div className="ss-host-panel px-6 py-14 sm:px-10 lg:px-14 lg:py-20">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
              <Sparkles size={14} />
              Create with Confidence
            </span>

            <h2
              id="host-support-heading"
              className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              Creator Support &

              <span className="block bg-gradient-to-r from-[#a9adff] via-[#d89dff] to-[#ee9edc] bg-clip-text text-transparent">
                Studio Hosting
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[#cdc7df]">
              StudioSpace is designed to make creative
              studio discovery and hosting more
              transparent, organized, and convenient.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {supportFeatures.map((feature) => (
              <article
                key={feature.title}
                className="ss-host-card group flex h-full flex-col p-6 transition-transform duration-300 hover:-translate-y-1"
              >
                <GradientIcon
                  icon={feature.icon}
                  tone={feature.tone}
                  size="md"
                  className="mb-6 group-hover:scale-105"
                />

                <h3 className="text-lg font-bold text-white">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#cdc7df]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-9 text-center md:flex-row md:text-left">
            <div>
              <h3 className="text-xl font-bold text-white">
                Have a creative space to share?
              </h3>

              <p className="mt-2 text-sm leading-7 text-[#cdc7df]">
                Join StudioSpace and introduce your
                workspace to fellow creators.
              </p>
            </div>

            <Link
              href="/add-studio"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7934c7] via-[#9947e6] to-[#c43fd2] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(109,40,217,0.32)] transition duration-300 hover:-translate-y-1 hover:brightness-110"
            >
              Become a Host
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
