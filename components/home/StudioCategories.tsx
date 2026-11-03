
import Link from "next/link";

import {
  ArrowUpRight,
  Camera,
  Clapperboard,
  Headphones,
  Mic2,
  Palette,
  Sparkles,
} from "lucide-react";

import GradientIcon, {
  type GradientIconTone,
} from "@/components/ui/GradientIcon";

const categories: {
  name: string;
  category: string;
  description: string;
  icon: typeof Camera;
  tone: GradientIconTone;
}[] = [
  {
    name: "Photo Studios",
    category: "Photo Studio",
    description:
      "Photography and visual content creation.",
    icon: Camera,
    tone: "blue",
  },
  {
    name: "Sound Stages",
    category: "Film Stage",
    description:
      "Film shoots and video production.",
    icon: Clapperboard,
    tone: "violet",
  },
  {
    name: "Podcast Rooms",
    category: "Podcast Lounge",
    description:
      "Conversations and audio recording.",
    icon: Mic2,
    tone: "pink",
  },
  {
    name: "Music Suites",
    category: "Music Suite",
    description:
      "Music recording and production.",
    icon: Headphones,
    tone: "cyan",
  },
  {
    name: "Art Workshops",
    category: "Art Workshop",
    description:
      "Art, design and hands-on creativity.",
    icon: Palette,
    tone: "amber",
  },
];

export default function StudioCategories() {
  return (
    <section
      id="categories"
      aria-labelledby="studio-categories-heading"
      className="ss-home-section"
    >
      <div className="ss-container">
        <div className="mx-auto mb-11 max-w-3xl text-center">
          <span className="ss-kicker">
            <Sparkles size={14} />
            Find Your Creative Space
          </span>

          <h2
            id="studio-categories-heading"
            className="ss-heading mt-5"
          >
            Browse by Studio Categories
          </h2>

          <p className="ss-description mx-auto mt-4 max-w-2xl">
            Whatever you&apos;re creating, find a space
            that fits your vision and your workflow.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/studios?category=${encodeURIComponent(
                category.category
              )}`}
              aria-label={`Explore ${category.name}`}
              className={[
                "ss-card group",
                "relative flex min-h-[265px] flex-col",
                "items-center px-5 py-7 text-center",
                "transition-transform duration-300",
                "hover:-translate-y-1",
                "focus-visible:outline-2",
                "focus-visible:outline-offset-4",
                "focus-visible:outline-violet-500",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-fuchsia-300/15 blur-3xl"
              />

              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-14 left-1/2 h-28 w-48 -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl"
              />

              <GradientIcon
                icon={category.icon}
                tone={category.tone}
                size="lg"
                className="relative z-10 mb-5 group-hover:scale-110"
              />

              <h3
                className="relative z-10 text-[17px] font-extrabold tracking-tight"
                style={{
                  color: "var(--ss-ink)",
                }}
              >
                {category.name}
              </h3>

              <p
                className="relative z-10 mt-3 flex-1 text-[13px] leading-[1.75]"
                style={{
                  color: "var(--ss-muted)",
                }}
              >
                {category.description}
              </p>

              <span
                className="relative z-10 mt-5 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-300 group-hover:gap-2.5 group-hover:border-purple-400/50"
                style={{
                  borderColor: "var(--ss-border)",
                  background: "var(--ss-surface-alt)",
                  color: "var(--ss-accent)",
                }}
              >
                Explore Studios
                <ArrowUpRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
