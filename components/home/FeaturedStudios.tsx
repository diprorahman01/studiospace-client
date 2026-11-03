
import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  Clock3,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react";

import { getFeaturedStudios } from "@/lib/api/studios";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function FeaturedStudios() {
  let studios: Awaited<
    ReturnType<typeof getFeaturedStudios>
  > = [];

  let loadError = false;

  try {
    studios = await getFeaturedStudios();
  } catch (error) {
    console.error("Featured Studios error:", error);
    loadError = true;
  }

  return (
    <section
      id="featured-studios"
      aria-labelledby="featured-studios-heading"
      className="ss-home-section"
    >
      <div className="ss-container">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="ss-kicker">
              <Sparkles size={14} />
              Curated for Creators
            </span>

            <h2
              id="featured-studios-heading"
              className="ss-heading mt-5"
            >
              Featured Studios
            </h2>

            <p className="ss-description mt-4 max-w-xl">
              Discover creative spaces that can turn your
              next big idea into something extraordinary.
            </p>
          </div>

          <Link
            href="/studios"
            className="inline-flex items-center gap-2 self-start rounded-xl border px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 sm:self-auto"
            style={{
              borderColor: "var(--ss-border)",
              background: "var(--ss-surface)",
              color: "var(--ss-accent)",
            }}
          >
            Explore All Studios
            <ArrowRight size={18} />
          </Link>
        </div>

        {loadError ? (
          <div className="ss-card px-6 py-16 text-center">
            <h3
              className="text-xl font-bold"
              style={{ color: "var(--ss-ink)" }}
            >
              Featured studios are temporarily unavailable
            </h3>

            <p
              className="mt-3 text-sm"
              style={{ color: "var(--ss-muted)" }}
            >
              We couldn&apos;t load studios right now.
              Please try again shortly.
            </p>

            <Link
              href="/studios"
              className="ss-cta-primary mt-6"
            >
              Browse Studios
              <ArrowRight size={17} />
            </Link>
          </div>
        ) : studios.length === 0 ? (
          <div className="ss-card px-6 py-16 text-center">
            <h3
              className="text-xl font-bold"
              style={{ color: "var(--ss-ink)" }}
            >
              New creative spaces are coming
            </h3>

            <p
              className="mt-3 text-sm"
              style={{ color: "var(--ss-muted)" }}
            >
              Check back soon for featured studio listings.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {studios.map((studio) => (
              <article
                key={studio._id}
                className="ss-card group flex h-full flex-col"
              >
                <Link
                  href={`/studios/${studio._id}`}
                  aria-label={`View ${studio.title}`}
                  className="relative block h-[225px] overflow-hidden bg-violet-200/30 sm:h-[235px]"
                >
                  {studio.image ? (
                    <Image
                      src={studio.image}
                      alt={studio.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-300/30 to-purple-500/20">
                      <Sparkles
                        size={38}
                        style={{ color: "var(--ss-accent)" }}
                      />
                    </div>
                  )}

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#241431]/30 to-transparent"
                  />

                  <span className="absolute left-4 top-4 max-w-[75%] truncate rounded-full border border-white/50 bg-white/90 px-3 py-1.5 text-xs font-bold text-[#63318b] shadow-sm backdrop-blur-md">
                    {studio.category}
                  </span>

                  
<div className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#322044] shadow-sm">
  {typeof studio.rating === "number" &&
  studio.rating > 0 ? (
    <>
      <Star
        size={14}
        className="fill-amber-400 text-amber-500"
      />

      {studio.rating.toFixed(1)}

      {typeof studio.reviewCount === "number" && (
        <span className="font-normal text-slate-500">
          ({studio.reviewCount})
        </span>
      )}
    </>
  ) : (
    <span className="font-semibold text-violet-700">
      New
    </span>
  )}
</div>

                </Link>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <Link href={`/studios/${studio._id}`}>
                    <h3
                      className="line-clamp-2 min-h-[48px] text-lg font-extrabold leading-6 transition-opacity group-hover:opacity-75"
                      style={{ color: "var(--ss-ink)" }}
                    >
                      {studio.title}
                    </h3>
                  </Link>

                  <div
                    className="mt-4 flex items-start gap-2 text-sm"
                    style={{ color: "var(--ss-muted)" }}
                  >
                    <MapPin
                      size={16}
                      className="mt-0.5 shrink-0"
                    />

                    <span className="line-clamp-2">
                      {studio.location}
                    </span>
                  </div>

                  <div
                    className="mt-3 flex items-center gap-2 text-sm"
                    style={{ color: "var(--ss-muted)" }}
                  >
                    <Clock3 size={16} />
                    Flexible hourly booking
                  </div>

                  <div
                    className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t pt-5"
                    style={{
                      borderColor: "var(--ss-border)",
                      marginTop: "24px",
                    }}
                  >
                    <div>
                      <p
                        className="text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--ss-muted)" }}
                      >
                        Starting at
                      </p>

                      <p
                        className="mt-1 text-2xl font-extrabold"
                        style={{ color: "var(--ss-accent)" }}
                      >
                        {formatPrice(studio.hourlyRate)}

                        <span
                          className="ml-1 text-xs font-medium"
                          style={{ color: "var(--ss-muted)" }}
                        >
                          / hour
                        </span>
                      </p>
                    </div>

                    <Link
                      href={`/studios/${studio._id}`}
                      className="ss-cta-primary px-4 py-3 text-xs"
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
