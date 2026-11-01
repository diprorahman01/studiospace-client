
import { Suspense } from "react";
import { notFound } from "next/navigation";

import StudioDetails from "@/components/studios/StudioDetails";
import { getStudioById } from "@/lib/api/studios";

type StudioDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

// This component handles URL-dependent data.
async function StudioDetailsContent({
  params,
}: StudioDetailsPageProps) {
  const { id } = await params;

  // MongoDB ObjectIds contain 24 hexadecimal characters.
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    notFound();
  }

  const studio = await getStudioById(id);

  if (!studio) {
    notFound();
  }

  return <StudioDetails studio={studio} />;
}

// The page itself does not await URL parameters.
export default function StudioDetailsPage({
  params,
}: StudioDetailsPageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f8f7fd]">
          <div className="mx-auto max-w-7xl animate-pulse px-5 py-12">
            <div className="mb-8 h-5 w-40 rounded bg-slate-200" />

            <div className="mb-5 h-10 w-2/3 rounded bg-slate-200" />

            <div className="mb-8 h-6 w-1/3 rounded bg-slate-200" />

            <div className="mb-8 h-80 rounded-2xl bg-slate-200" />

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="h-72 rounded-2xl bg-slate-200 lg:col-span-2" />
              <div className="h-72 rounded-2xl bg-slate-200" />
            </div>
          </div>
        </main>
      }
    >
      <StudioDetailsContent params={params} />
    </Suspense>
  );
}
