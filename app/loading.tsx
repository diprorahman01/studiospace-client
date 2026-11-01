
import { Aperture, LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-100">
          <Aperture className="h-11 w-11 text-violet-700" />

          <LoaderCircle className="absolute -bottom-2 -right-2 h-7 w-7 animate-spin text-violet-600" />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            StudioSpace
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Preparing your creative space...
          </p>
        </div>

        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-violet-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-violet-600" />
        </div>
      </div>
    </div>
  );
}
