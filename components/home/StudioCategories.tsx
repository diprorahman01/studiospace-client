
import Link from "next/link";
import {
  ArrowUpRight,
  Camera,
  Clapperboard,
  Mic2,
  Music2,
  Palette,
  Sparkles,
} from "lucide-react";

const categories = [
  {
    name: "Photo Studios",
    category: "Photo Studio",
    description: "Photography and visual content creation.",
    icon: Camera,
  },
  {
    name: "Sound Stages",
    category: "Film Stage",
    description: "Film shoots and video production.",
    icon: Clapperboard,
  },
  {
    name: "Podcast Rooms",
    category: "Podcast Lounge",
    description: "Conversations and audio recording.",
    icon: Mic2,
  },
  {
    name: "Music Suites",
    category: "Music Suite",
    description: "Music recording and production.",
    icon: Music2,
  },
  {
    name: "Art Workshops",
    category: "Art Workshop",
    description: "Art, design and hands-on creativity.",
    icon: Palette,
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
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Link
                key={category.name}
                href={`/studios?category=${encodeURIComponent(
                  category.category
                )}`}
                aria-label={`Explore ${category.name}`}
                className="ss-card group flex min-h-[248px] flex-col items-center px-5 py-7 text-center focus-visible:outline"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-fuchsia-300/15 blur-3xl"
                />

                <span className="ss-icon-tile relative mb-5 shrink-0 transition-transform duration-300 group-hover:scale-110">
                  <Icon
                    size={29}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </span>

                <h3
                  className="relative text-[17px] font-extrabold tracking-tight"
                  style={{ color: "var(--ss-ink)" }}
                >
                  {category.name}
                </h3>

                <p
                  className="relative mt-3 flex-1 text-[13px] leading-[1.75]"
                  style={{ color: "var(--ss-muted)" }}
                >
                  {category.description}
                </p>

                <span
                  className="relative mt-5 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition group-hover:gap-2.5"
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
