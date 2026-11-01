
import Link from "next/link";
import {
  ShieldCheck,
  BadgeCheck,
  Camera,
  Headset,
  ArrowRight,
} from "lucide-react";

const supportFeatures = [
  {
    title: "Liability Protection",
    description:
      "Clear studio guidelines and booking policies help hosts and creators understand their responsibilities.",
    icon: ShieldCheck,
  },
  {
    title: "Verified Profiles",
    description:
      "Our platform is designed to support trusted host profiles and transparent studio information.",
    icon: BadgeCheck,
  },
  {
    title: "Equipment Safety",
    description:
      "Hosts can share equipment details and safety guidelines to help creators prepare for their sessions.",
    icon: Camera,
  },
  {
    title: "24/7 Host Support",
    description:
      "Our platform aims to make studio communication and booking assistance simple and accessible.",
    icon: Headset,
  },
];

export default function HostSupport() {
  return (
    <section className="bg-[#f8f7fd] px-5 py-20 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-[#111026] px-6 py-14 text-white sm:px-10 lg:px-14 lg:py-20">
          {/* Background decoration */}
          <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-violet-700/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl" />

          <div className="relative z-10">
            {/* Heading */}
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <span className="inline-block rounded-full border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
                Create With Confidence
              </span>

              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Host Guarantee &
                <span className="block text-violet-400">
                  Creator Support
                </span>
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-300">
                StudioSpace is designed to make creative studio
                discovery and hosting more transparent, organized,
                and convenient.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {supportFeatures.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/10"
                  >
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/15 transition-colors group-hover:bg-violet-600">
                      <Icon
                        size={27}
                        strokeWidth={1.8}
                        className="text-violet-300 transition-colors group-hover:text-white"
                      />
                    </div>

                    <h3 className="text-lg font-bold text-white">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-9 md:flex-row">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-white">
                  Have a creative space to share?
                </h3>

                <p className="mt-2 text-sm text-slate-300">
                  Join StudioSpace and introduce your workspace
                  to fellow creators.
                </p>
              </div>

              <Link
                href="/add-studio"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                Become a Host
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
