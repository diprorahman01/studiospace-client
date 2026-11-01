
import Link from "next/link";
import { Aperture, ArrowLeft, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-gradient-to-b from-violet-50 to-white px-6 py-20">
      <div className="mx-auto max-w-xl text-center">
        {/* Studio illustration */}
        <div className="relative mx-auto mb-8 flex h-36 w-36 items-center justify-center rounded-full bg-violet-100">
          <Aperture className="h-20 w-20 text-violet-700" />

          <div className="absolute -bottom-3 -right-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 shadow-lg">
            <Clapperboard className="h-9 w-9 text-white" />
          </div>
        </div>

        {/* Error number */}
        <h1 className="text-8xl font-extrabold tracking-tight text-violet-700 sm:text-9xl">
          404
        </h1>

        {/* Error message */}
        <h2 className="mt-4 text-3xl font-bold text-slate-900">
          Page Not Found
        </h2>

        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-600">
          Oops! The creative space you are looking for does not exist
          or has been moved. Let&apos;s get you back on track.
        </p>

        {/* Navigation button */}
        <div className="mt-9">
          <Button
            asChild
            size="lg"
            className="rounded-lg bg-violet-700 px-8 text-white hover:bg-violet-800"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Link>
          </Button>
        </div>

        <p className="mt-12 text-sm text-slate-400">
          StudioSpace — Create Without Limits
        </p>
      </div>
    </main>
  );
}
