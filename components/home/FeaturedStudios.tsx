
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Star,
  Clock3,
} from "lucide-react";

const featuredStudios = [
  {
    id: "demo-1",
    title: "The Cyclorama Studio",
    category: "Photo Studio",
    location: "Dhanmondi, Dhaka",
    price: 60,
    rating: 4.9,
    reviews: 124,
    image: "/images/studios/cyclorama-photo.jpg",
  },
  {
    id: "demo-2",
    title: "The Podcast Lounge",
    category: "Podcast Lounge",
    location: "Gulshan, Dhaka",
    price: 40,
    rating: 4.8,
    reviews: 96,
    image: "/images/studios/podcast-lounge.jpg",
  },
  {
    id: "demo-3",
    title: "SoundCraft Recording Suite",
    category: "Music Suite",
    location: "Banani, Dhaka",
    price: 50,
    rating: 4.9,
    reviews: 82,
    image: "/images/studios/music-recording-suite.jpg",
  },
  {
    id: "demo-4",
    title: "Cinema Sound Stage",
    category: "Film Stage",
    location: "Uttara, Dhaka",
    price: 120,
    rating: 4.7,
    reviews: 68,
    image: "/images/studios/cinema-sound-stage.jpg",
  },
  {
    id: "demo-5",
    title: "The Creative Loft",
    category: "Creative Workspace",
    location: "Mohakhali, Dhaka",
    price: 70,
    rating: 4.8,
    reviews: 74,
    image: "/images/studios/creative-loft.jpg",
  },
  {
    id: "demo-6",
    title: "The Artist Workshop",
    category: "Art Workshop",
    location: "Mirpur, Dhaka",
    price: 30,
    rating: 4.9,
    reviews: 112,
    image: "/images/studios/art-workshop.jpg",
  },
];

export default function FeaturedStudios() {
  return (
    <section className="bg-white px-5 py-20 md:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-3 inline-block rounded-full bg-violet-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-violet-700">
              Handpicked for Creators
            </span>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
              Featured Studios
            </h2>

            <p className="mt-3 max-w-xl text-slate-600">
              Discover creative spaces designed to bring your
              next big idea to life.
            </p>
          </div>

          <Link
            href="/studios"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 transition hover:text-violet-900"
          >
            Explore All Studios
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* Studio cards */}
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {featuredStudios.map((studio) => (
            <article
              key={studio.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden">
                <Image
                  src={studio.image}
                  alt={studio.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />

                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm">
                  {studio.category}
                </span>

                <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm">
                  <Star
                    size={14}
                    className="fill-amber-400 text-amber-400"
                  />
                  {studio.rating}
                  <span className="font-normal text-slate-500">
                    ({studio.reviews})
                  </span>
                </div>
              </div>

              {/* Card content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-slate-950 transition group-hover:text-violet-700">
                  {studio.title}
                </h3>

                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={16} />
                  <span>{studio.location}</span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <Clock3 size={16} />
                  <span>Flexible hourly booking</span>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                  <div>
                    <span className="text-2xl font-extrabold text-violet-700">
                      ${studio.price}
                    </span>
                    <span className="text-sm text-slate-500">
                      {" "}/ hour
                    </span>
                  </div>

                  <Link
                    href={`/studios/${studio.id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800"
                  >
                    View Details
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
