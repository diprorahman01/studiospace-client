
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
    title: "Clear Booking Details",
    description:
      "Review studio information, rates and booking details before making a request.",
    icon: ShieldCheck,
  },
  {
    title: "Host Information",
    description:
      "Explore the details shared by hosts and learn more about each creative space.",
    icon: BadgeCheck,
  },
  {
    title: "Equipment Information",
    description:
      "Check available equipment and facilities to plan your creative session.",
    icon: Camera,
  },
  {
    title: "Booking Management",
    description:
      "Manage your reservations and stay informed about their current status.",
    icon: Headset,
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

          {/* Heading */}
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
              Create with Confidence
            </span>

            <h2
              id="host-support-heading"
              className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              Creator Support &
              <span className="block text-[#a78bfa]">
                Studio Hosting
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[#cdc7df]">
              StudioSpace is designed to make creative
              studio discovery and hosting more transparent,
              organized, and convenient.
            </p>
          </div>

          {/* Four feature cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {supportFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="ss-host-card group flex h-full flex-col p-6"
                >
                  <div className="ss-host-icon mb-6 transition-colors duration-300 group-hover:bg-violet-600">
                    <Icon
                      size={27}
                      strokeWidth={1.8}
                      aria-hidden="true"
                      className="transition-colors duration-300 group-hover:text-white"
                    />
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-[#cdc7df]">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>

          {/* Bottom call to action */}
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
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-700 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(109,40,217,0.22)] transition duration-300 hover:-translate-y-1 hover:bg-violet-600"
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
