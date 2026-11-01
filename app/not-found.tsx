
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  SearchX,
} from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-[#f8f7fd] px-5 py-16">
      <div className="mx-auto w-full max-w-xl text-center">

        {/* Error icon */}
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-violet-100">
          <SearchX
            size={48}
            className="text-violet-700"
          />
        </div>

        {/* Error number */}
        <h1 className="text-7xl font-extrabold tracking-tight text-violet-700 sm:text-8xl">
          404
        </h1>

        {/* Message */}
        <h2 className="mt-5 text-2xl font-bold text-slate-950 sm:text-3xl">
          Oops! Page Not Found
        </h2>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
          The page you are looking for might have been
          moved, deleted, or never existed. Don&apos;t worry,
          you can continue exploring StudioSpace.
        </p>

        {/* Navigation buttons */}
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">

          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-800 sm:w-auto"
          >
            <Home size={18} />
            Back to Home
          </Link>

          <Link
            href="/studios"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-6 py-3.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 sm:w-auto"
          >
            <ArrowLeft size={18} />
            Explore Studios
          </Link>

        </div>

        {/* Footer message */}
        <p className="mt-10 text-xs text-slate-400">
          StudioSpace — Create Without Limits
        </p>

      </div>
    </main>
  );
}
