
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Star,
  Clock3,
} from "lucide-react";

import { getFeaturedStudios } from "@/lib/api/studios";

export default async function FeaturedStudios() {
  let studios;

  try {
    studios = await getFeaturedStudios();
  } catch (error) {
    console.error("Featured Studios error:", error);

    return (
      <section className="bg-white px-5 py-20">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            Featured Studios
          </h2>

          <p className="mt-4 text-slate-500">
            Unable to load featured studios. Please try again later.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white px-5 py-20 md:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-3 inline-block rounded-full bg-violet-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-violet-700">
              Handpicked for Creators
            </span>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
              Featured Studios
            </h2>

            <p className="mt-3 max-w-xl text-slate-600">
              Discover creative spaces designed to bring your
              next big idea to life.
            </p>
          </div>

          <Link
            href="/studios"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
          >
            Explore All Studios
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* Empty state */}
        {studios.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-16 text-center">
            <h3 className="text-xl font-bold text-slate-900">
              No studios available yet
            </h3>
            <p className="mt-2 text-slate-500">
              New creative spaces will appear here soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {studios.map((studio) => (
              <article
                key={studio._id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Studio image */}
                <div className="relative h-56 overflow-hidden bg-slate-100">
                  <Image
                    src={studio.image}
                    alt={studio.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />

                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm">
                    {studio.category}
                  </span>

                  {typeof studio.rating === "number" && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm">
                      <Star
                        size={14}
                        className="fill-amber-400 text-amber-400"
                      />
                      {studio.rating}

                      {typeof studio.reviewCount === "number" && (
                        <span className="font-normal text-slate-500">
                          ({studio.reviewCount})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Studio information */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-950 transition group-hover:text-violet-700">
                    {studio.title}
                  </h3>

                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin size={16} />
                    <span>{studio.location}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <Clock3 size={16} />
                    <span>Flexible hourly booking</span>
                  </div>

                  {/* Price and details */}
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                    <div>
                      <span className="text-2xl font-extrabold text-violet-700">
                        ${studio.hourlyRate}
                      </span>

                      <span className="text-sm text-slate-500">
                        {" "}/ hour
                      </span>
                    </div>

                    <Link
                      href={`/studios/${studio._id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800"
                    >
                      View Details
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
