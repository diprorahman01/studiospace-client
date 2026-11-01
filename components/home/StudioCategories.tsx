
import Link from "next/link";
import {
  Camera,
  Clapperboard,
  Mic2,
  Music2,
  Palette,
  ArrowUpRight,
} from "lucide-react";

const categories = [
  {
    name: "Photo Studios",
    category: "Photo Studio",
    description: "Professional spaces for photography and content creation.",
    icon: Camera,
  },
  {
    name: "Sound Stages",
    category: "Film Stage",
    description: "Production spaces for filmmaking and video projects.",
    icon: Clapperboard,
  },
  {
    name: "Podcast Rooms",
    category: "Podcast Lounge",
    description: "Comfortable recording rooms for conversations.",
    icon: Mic2,
  },
  {
    name: "Music Suites",
    category: "Music Suite",
    description: "Creative recording spaces for musicians and producers.",
    icon: Music2,
  },
  {
    name: "Art Workshops",
    category: "Art Workshop",
    description: "Inspiring workspaces for artists and designers.",
    icon: Palette,
  },
];

export default function StudioCategories() {
  return (
    <section className="bg-[#f8f7fd] px-5 py-20 md:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full bg-violet-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-violet-700">
            Find Your Creative Space
          </span>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
            Browse by Studio Categories
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            From photography to music production, discover the perfect
            studio for your next creative project.
          </p>
        </div>

        {/* Categories */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Link
                key={category.name}
                href={`/studios?category=${encodeURIComponent(category.category)}`}
                className="group relative flex flex-col items-center rounded-2xl border border-violet-100 bg-white px-5 py-9 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-violet-300 hover:shadow-xl"
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-100 transition-colors duration-300 group-hover:bg-violet-700">
                  <Icon
                    size={36}
                    strokeWidth={1.8}
                    className="text-violet-700 transition-colors group-hover:text-white"
                  />
                </div>

                <h3 className="text-lg font-bold text-slate-950 transition-colors group-hover:text-violet-700">
                  {category.name}
                </h3>

                <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">
                  {category.description}
                </p>

                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-violet-700">
                  Explore Studios
                  <ArrowUpRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
