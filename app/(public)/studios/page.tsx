
import { Suspense } from "react";
import ExploreStudios from "@/components/studios/ExploreStudios";
import { getAllStudios } from "@/lib/api/studios";

export default async function StudiosPage() {
  let studios;

  try {
    studios = await getAllStudios();
  } catch (error) {
    console.error("Failed to load studios:", error);

    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          Unable to Load Studios
        </h1>

        <p className="mt-4 text-slate-600">
          Please check your connection and try again.
        </p>
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-slate-600">
            Loading studio filters...
          </p>
        </div>
      }
    >
      <ExploreStudios studios={studios} />
    </Suspense>
  );
}
