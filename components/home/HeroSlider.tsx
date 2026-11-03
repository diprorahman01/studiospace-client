
"use client";

import Link from "next/link";
import {
  ArrowRight,
  Aperture,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  Navigation,
  Pagination,
} from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const slides = [
  {
    id: 1,
    eyebrow: "Create Without Boundaries",
    title: "Find & Book the Perfect Creative Studio",
    description:
      "Discover photography studios, film stages and creative spaces designed to bring your next project to life.",
    image: "/images/hero/purple-photo-studio.jpg",
  },
  {
    id: 2,
    eyebrow: "For Every Creative Vision",
    title: "Your Vision Deserves the Perfect Space",
    description:
      "Explore inspiring podcast rooms, music suites and production studios designed for creators.",
    image: "/images/hero/podcast-lounge.jpg",
  },
  {
    id: 3,
    eyebrow: "Turn Ideas Into Reality",
    title: "Create Without Limits",
    description:
      "Find flexible workspaces, explore equipment and pricing, and request the time slot that works for you.",
    image: "/images/hero/film-production-stage.jpg",
  },
];

export default function HeroSlider() {
  return (
    <section
      aria-label="Discover creative studios"
      className="ss-hero relative w-full overflow-hidden"
    >
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        slidesPerView={1}
        loop
        navigation
        pagination={{ clickable: true }}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        className="hero-swiper h-[610px] sm:h-[640px] lg:h-[660px]"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div
              className="relative flex h-full items-center bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(17,8,34,0.97) 0%, rgba(30,12,55,0.86) 43%, rgba(28,15,43,0.40) 100%), url("${slide.image}")`,
              }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_45%,rgba(152,84,205,0.18),transparent_58%)]"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-[#251432]/60 to-transparent"
              />

              <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 sm:px-10 lg:px-12">
                <div className="max-w-[760px] text-white">
                  <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/35 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-100 backdrop-blur-lg">
                    <Sparkles size={15} />
                    {slide.eyebrow}
                  </span>

                  <h1 className="max-w-[740px] text-[39px] font-extrabold leading-[1.10] tracking-[-0.045em] text-white sm:text-5xl lg:text-[65px]">
                    {slide.title}
                  </h1>

                  <p className="mt-6 max-w-[600px] text-[15px] leading-8 text-[#e9ddf6] sm:text-lg">
                    {slide.description}
                  </p>

                  <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link
                      href="/studios"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#9852e7] to-[#7430bc] px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(102,32,163,0.32)] transition hover:-translate-y-1 hover:brightness-110"
                    >
                      Explore Studios
                      <ArrowRight size={19} />
                    </Link>

                    <Link
                      href="/studios"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/20"
                    >
                      <Aperture size={18} />
                      Host Your Space
                    </Link>
                  </div>

                  <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/15 pt-6 text-xs font-medium text-violet-100 sm:text-sm">
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-purple-300" />
                      Explore creative spaces
                    </span>

                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-purple-300" />
                      Flexible hourly requests
                    </span>
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
