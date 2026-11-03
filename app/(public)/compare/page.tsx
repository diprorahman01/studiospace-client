
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";

import StudioComparison from "@/components/studios/StudioComparison";
import { getAllStudios } from "@/lib/api/studios";
import type { Studio } from "@/types/studio";

function ComparisonLoading() {
  return (
    <main className="min-h-[70vh]">
      <section className="flex min-h-64 items-center justify-center bg-[#171024] px-5 text-center">
        <p className="text-sm font-medium text-violet-200">
          Loading studio comparison...
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="h-32 animate-pulse rounded-2xl bg-violet-500/10" />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-2xl bg-violet-500/10"
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function ComparisonError() {
  return (
    <main className="flex min-h-[65vh] flex-col items-center justify-center gap-5 px-5 text-center">
      <h1
        className="text-2xl font-extrabold"
        style={{ color: "var(--ss-ink)" }}
      >
        Studio Comparison Unavailable
      </h1>

      <p
        className="max-w-md text-sm leading-7"
        style={{ color: "var(--ss-muted)" }}
      >
        Could not load studios. Please check your
        connection and try again.
      </p>

      <Link
        href="/studios"
        className="ss-cta-primary inline-flex items-center justify-center px-5 py-3"
      >
        Explore Studios
      </Link>
    </main>
  );
}

async function ComparisonContent() {
  // Prevent the live studio fetch from running
  // during static prerendering.
  await connection();

  let studios: Studio[];

  try {
    studios = await getAllStudios();
  } catch (error) {
    console.error(
      "Failed to load comparison studios:",
      error
    );

    return <ComparisonError />;
  }

  return <StudioComparison studios={studios} />;
}

export default function CompareStudiosPage() {
  return (
    <Suspense fallback={<ComparisonLoading />}>
      <ComparisonContent />
    </Suspense>
  );
}
