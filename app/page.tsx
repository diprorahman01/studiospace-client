
import { Suspense } from "react";
import { connection } from "next/server";

import HeroSlider from "@/components/home/HeroSlider";
import FeaturedStudios from "@/components/home/FeaturedStudios";
import StudioCategories from "@/components/home/StudioCategories";
import BookingSteps from "@/components/home/BookingSteps";
import HostSupport from "@/components/home/HostSupport";

// This component loads featured studios at request time.
// It prevents dynamic backend data from being accessed
// during static prerendering.
async function DynamicFeaturedStudios() {
  await connection();

  return <FeaturedStudios />;
}

// Loading skeleton displayed while studios are fetched.
function FeaturedStudiosLoading() {
  return (
    <section
      id="featured-studios"
      className="ss-home-section"
      aria-label="Loading featured studios"
    >
      <div className="ss-container">
        <div className="mb-10">
          <div className="h-5 w-40 animate-pulse rounded-full bg-violet-200 dark:bg-violet-500/20" />

          <div className="mt-5 h-10 w-64 animate-pulse rounded-xl bg-violet-200 dark:bg-violet-500/20" />

          <div className="mt-4 h-5 w-full max-w-lg animate-pulse rounded-lg bg-violet-100 dark:bg-violet-500/10" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-violet-100 bg-white dark:border-violet-500/20 dark:bg-[#21172f]"
            >
              <div className="h-[235px] animate-pulse bg-violet-100 dark:bg-violet-500/15" />

              <div className="space-y-4 p-6">
                <div className="h-6 w-3/4 animate-pulse rounded-lg bg-violet-100 dark:bg-violet-500/15" />

                <div className="h-4 w-1/2 animate-pulse rounded-lg bg-violet-100 dark:bg-violet-500/15" />

                <div className="h-4 w-2/3 animate-pulse rounded-lg bg-violet-100 dark:bg-violet-500/15" />

                <div className="mt-6 h-11 w-full animate-pulse rounded-xl bg-violet-100 dark:bg-violet-500/15" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// StudioSpace Home Page
export default function Home() {
  return (
    <main>
      <HeroSlider />

      <Suspense fallback={<FeaturedStudiosLoading />}>
        <DynamicFeaturedStudios />
      </Suspense>

      <StudioCategories />

      <BookingSteps />

      <HostSupport />
    </main>
  );
}
