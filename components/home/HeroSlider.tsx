
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const slides = [
  {
    id: 1,
    title: "Find & Book the Perfect Creative Studio",
    description:
      "Discover professional photography studios, film stages, and creative spaces for your next project.",
    image: "/images/hero/purple-photo-studio.jpg",
  },
  {
    id: 2,
    title: "Your Vision Deserves the Perfect Space",
    description:
      "Explore inspiring podcast rooms, music suites, and production studios designed for creators.",
    image: "/images/hero/podcast-lounge.jpg",
  },
  {
    id: 3,
    title: "Create Without Limits",
    description:
      "Find flexible workspaces with professional equipment, transparent pricing, and simple booking.",
    image: "/images/hero/film-production-stage.jpg",
  },
];

export default function HeroSlider() {
  return (
    <section className="relative w-full">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        slidesPerView={1}
        loop={true}
        navigation={true}
        pagination={{ clickable: true }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        className="h-[520px] md:h-[620px]"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div
              className="relative flex h-full items-center bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(10,8,28,0.93) 0%, rgba(10,8,28,0.65) 55%, rgba(10,8,28,0.3) 100%), url('${slide.image}')`,
              }}
            >
              <div className="mx-auto w-full max-w-7xl px-6">
                <div className="max-w-2xl text-white">
                  <span className="mb-6 inline-block rounded-full border border-violet-400/40 bg-violet-500/20 px-5 py-2 text-sm font-medium text-violet-200">
                    Creative Spaces for Creators
                  </span>

                  <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
                    {slide.title}
                  </h1>

                  <p className="mt-6 max-w-xl text-base leading-8 text-slate-200 md:text-lg">
                    {slide.description}
                  </p>

                  <div className="mt-9 flex flex-wrap gap-4">
                    <Link
                      href="/studios"
                      className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-7 py-3.5 font-semibold text-white transition hover:bg-violet-800"
                    >
                      Explore Studios
                      <ArrowRight size={19} />
                    </Link>

                    <Link
                      href="/add-studio"
                      className="inline-flex items-center rounded-lg border border-white/60 bg-white/10 px-7 py-3.5 font-semibold text-white transition hover:bg-white/20"
                    >
                      Host Your Space
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
