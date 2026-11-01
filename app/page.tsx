
import Link from "next/link";
import { Aperture, ArrowRight, Camera, Music, Mic } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-[70vh] bg-gradient-to-br from-white via-violet-50 to-white">
      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center md:py-32">
        <div className="mb-7 flex items-center gap-2 rounded-full border border-violet-200 bg-violet-100 px-5 py-2 text-sm font-medium text-violet-700">
          <Aperture size={18} />
          Creative Spaces for Creators
        </div>

        <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-slate-950 md:text-7xl">
          Find & Book the Perfect
          <span className="block text-violet-700">
            Creative Studio
          </span>
        </h1>

        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
          Discover professional photography studios, podcast rooms,
          music suites, film stages, and creative workspaces.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link
            href="/studios"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-7 py-3 font-medium text-white hover:bg-violet-800"
          >
            Explore Studios
            <ArrowRight size={19} />
          </Link>

          <Link
            href="/add-studio"
            className="rounded-lg border border-violet-300 bg-white px-7 py-3 font-medium text-violet-700 hover:bg-violet-50"
          >
            Host Your Space
          </Link>
        </div>

        <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            { name: "Photo Studios", Icon: Camera },
            { name: "Podcast Rooms", Icon: Mic },
            { name: "Music Suites", Icon: Music },
          ].map(({ name, Icon }) => (
            <div
              key={name}
              className="flex flex-col items-center gap-3 rounded-2xl border border-violet-100 bg-white p-8 shadow-sm"
            >
              <Icon className="h-9 w-9 text-violet-700" />
              <h3 className="font-semibold text-slate-900">
                {name}
              </h3>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
