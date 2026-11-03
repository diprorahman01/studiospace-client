
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";

import ExploreStudios from "@/components/studios/ExploreStudios";
import { getAllStudios } from "@/lib/api/studios";
import type { Studio } from "@/types/studio";

function StudiosLoading() {
  return (
    <main className="min-h-screen">
      <section className="relative flex min-h-[340px] items-center justify-center bg-[#151026] px-5 text-center">
        <div>
          <div className="mx-auto h-7 w-48 animate-pulse rounded-full bg-violet-400/20" />
          <div className="mt-6 h-12 w-72 max-w-full animate-pulse rounded-xl bg-violet-300/20" />
          <p className="mt-6 text-sm text-violet-200">
            Finding creative studios...
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div
          className="h-32 animate-pulse rounded-2xl border"
          style={{
            background: "var(--ss-surface)",
            borderColor: "var(--ss-border)",
          }}
        />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-96 animate-pulse rounded-2xl border"
              style={{
                background: "var(--ss-surface)",
                borderColor: "var(--ss-border)",
              }}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function StudiosError() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
      <h1
        className="text-3xl font-extrabold"
        style={{ color: "var(--ss-ink)" }}
      >
        Unable to Load Studios
      </h1>

      <p
        className="mt-4 max-w-md text-sm leading-7"
        style={{ color: "var(--ss-muted)" }}
      >
        The studio listings could not be loaded.
        Please check your connection and try again.
      </p>

      <Link
        href="/"
        className="ss-cta-primary mt-6 inline-flex items-center justify-center px-5 py-3"
      >
        Return to Home
      </Link>
    </main>
  );
}

async function StudiosContent() {
  // Defer live API requests until an actual request.
  // This is required with Cache Components enabled.
  await connection();

  let studios: Studio[];

  try {
    studios = await getAllStudios();
  } catch (error) {
    console.error("Failed to load studios:", error);
    return <StudiosError />;
  }

  return <ExploreStudios studios={studios} />;
}

export default function StudiosPage() {
  return (
    <Suspense fallback={<StudiosLoading />}>
      <StudiosContent />
    </Suspense>
  );
}
