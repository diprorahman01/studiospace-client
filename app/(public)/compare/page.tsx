
import Link from "next/link";
import { Suspense } from "react";
import StudioComparison from "@/components/studios/StudioComparison";
import { getAllStudios } from "@/lib/api/studios";
import type { Studio } from "@/types/studio";

function ComparisonLoading() {
  return (
    <main className="min-h-[70vh]">
      <div className="flex min-h-64 items-center justify-center bg-[#171024] px-5 text-center">
        <p className="text-sm font-medium text-violet-200">
          Loading studio comparison...
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-12">
        <div className="h-32 animate-pulse rounded-2xl bg-violet-500/10" />

        <div className="mt-8 grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-2xl bg-violet-500/10"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

async function ComparisonContent() {
  let studios: Studio[] = [];
  let errorMessage = "";

  try {
    studios = await getAllStudios();
  } catch (error) {
    console.error(
      "Failed to load comparison studios:",
      error
    );

    errorMessage =
      "Could not load studios. Please check your server connection.";
  }

  if (errorMessage) {
    return (
      <main className="flex min-h-[65vh] flex-col items-center justify-center gap-5 px-5 text-center">
        <h1
          className="text-2xl font-extrabold"
          style={{ color: "var(--ss-ink)" }}
        >
          Studio Comparison Unavailable
        </h1>

        <p
          className="text-sm"
          style={{ color: "var(--ss-muted)" }}
        >
          {errorMessage}
        </p>

        <Link href="/studios" className="ss-cta-primary">
          Explore Studios
        </Link>
      </main>
    );
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
