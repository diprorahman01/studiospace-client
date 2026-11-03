
import Link from "next/link";

import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  ShieldCheck,
  Sparkles,
  Wrench,
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
    title: "Liability Protection",
    description:
      "Review booking details and host terms before your session. StudioSpace does not currently provide liability insurance, so additional coverage should be arranged independently if needed.",
    icon: ShieldCheck,
    tone: "blue",
  },
  {
    title: "Verified Profiles",
    description:
      "View host and studio information to make informed booking decisions. Independent identity verification is not currently guaranteed for every host.",
    icon: BadgeCheck,
    tone: "pink",
  },
  {
    title: "Equipment Safety",
    description:
      "Check listed studio facilities and equipment before booking. Confirm equipment condition and safety arrangements directly with the host before use.",
    icon: Wrench,
    tone: "cyan",
  },
  {
    title: "24/7 Host Support",
    description:
      "Access your online booking details and reservation status at any time. Host responses and staffed customer support are not guaranteed around the clock.",
    icon: Clock3,
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
              Host Guarantee &

              <span className="block bg-gradient-to-r from-[#a9adff] via-[#d89dff] to-[#ee9edc] bg-clip-text text-transparent">
                Creator Support
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[#cdc7df]">
              Understand studio policies, host profiles,
              equipment arrangements and booking support
              before planning your next creative session.
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
