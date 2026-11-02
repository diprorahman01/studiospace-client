
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Expand,
  MapPin,
  ShieldCheck,
  Star,
  Users,
  Wifi,
  X,
} from "lucide-react";

import type { Studio } from "@/types/studio";
import BookingModal from "@/components/bookings/BookingModal";
import StudioAvailabilityCalendar from "@/components/studios/StudioAvailabilityCalendar";

interface StudioDetailsProps {
  studio: Studio;
}

type Tab =
  | "overview"
  | "amenities"
  | "availability"
  | "reviews";

export default function StudioDetails({
  studio,
}: StudioDetailsProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] =
    useState<Tab>("overview");

  const [lightboxOpen, setLightboxOpen] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  const images = [
    ...new Set(
      (studio.images?.length
        ? studio.images
        : [studio.image]
      ).filter(
        (image): image is string =>
          typeof image === "string" && image.trim().length > 0
      )
    ),
  ];

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "amenities", label: "Amenities" },
    { id: "availability", label: "Availability" },
    { id: "reviews", label: "Reviews" },
  ];

  function previousImage() {
    if (images.length <= 1) return;

    setActiveImage(
      (current) =>
        (current - 1 + images.length) % images.length
    );
  }

  function nextImage() {
    if (images.length <= 1) return;

    setActiveImage(
      (current) => (current + 1) % images.length
    );
  }

  function openLightbox() {
    if (!images.length) return;
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  // Enable keyboard navigation inside the lightbox.
  useEffect(() => {
    if (!lightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      }

      if (event.key === "ArrowLeft" && images.length > 1) {
        event.preventDefault();
        setActiveImage(
          (current) =>
            (current - 1 + images.length) % images.length
        );
      }

      if (event.key === "ArrowRight" && images.length > 1) {
        event.preventDefault();
        setActiveImage(
          (current) => (current + 1) % images.length
        );
      }

      if (event.key === "Tab") {
        const focusables = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[data-studio-lightbox] button:not([disabled])'
          )
        );

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      openButtonRef.current?.focus();
    };
  }, [lightboxOpen, images.length]);

  const hasImages = images.length > 0;
  const currentImage = images[activeImage] || images[0];

  return (
    <main className="min-h-screen bg-[#f8f7fd] px-5 py-10 md:py-14">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/studios"
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          <ArrowLeft size={17} />
          Back to Explore Studios
        </Link>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            {/* Main image gallery */}
            <div className="relative h-[280px] overflow-hidden rounded-2xl bg-slate-200 sm:h-[420px] lg:h-[480px]">
              {hasImages ? (
                <Image
                  src={currentImage}
                  alt={`${studio.title} - photo ${activeImage + 1}`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 70vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">
                  <Camera size={44} />
                </div>
              )}

              {/* Clickable surface to enlarge image */}
              {hasImages && (
                <button
                  ref={openButtonRef}
                  type="button"
                  onClick={openLightbox}
                  aria-label={`Open full-screen gallery for ${studio.title}`}
                  className="absolute inset-0 z-10 cursor-zoom-in focus-visible:outline-4 focus-visible:outline-violet-500"
                />
              )}

              {/* Prev and next controls */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={previousImage}
                    aria-label="Previous studio photo"
                    className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-3 text-slate-900 shadow-lg transition hover:bg-violet-100"
                  >
                    <ArrowLeft size={19} />
                  </button>

                  <button
                    type="button"
                    onClick={nextImage}
                    aria-label="Next studio photo"
                    className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-3 text-slate-900 shadow-lg transition hover:bg-violet-100"
                  >
                    <ArrowRight size={19} />
                  </button>
                </>
              )}

              {/* Main image counter */}
              {hasImages && (
                <span className="pointer-events-none absolute bottom-4 right-4 z-20 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-medium text-white">
                  {activeImage + 1} / {images.length}
                </span>
              )}

              {/* Expand button */}
              {hasImages && (
                <button
                  type="button"
                  onClick={openLightbox}
                  className="absolute bottom-4 left-4 z-20 inline-flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
                  aria-label="View photos in full screen"
                >
                  <Expand size={15} />
                  View Full Screen
                </button>
              )}
            </div>

            {/* Image thumbnails */}
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Show photo ${index + 1}`}
                    aria-pressed={activeImage === index}
                    className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      activeImage === index
                        ? "border-violet-700"
                        : "border-transparent hover:border-violet-400"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${studio.title} thumbnail ${index + 1}`}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main studio information */}
            <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700">
                  {studio.category}
                </span>

                {typeof studio.rating === "number" && (
                  <span className="flex items-center gap-1 text-sm text-slate-700">
                    <Star
                      size={17}
                      className="fill-amber-400 text-amber-400"
                    />
                    {studio.rating}
                    {typeof studio.reviewCount === "number" &&
                      ` (${studio.reviewCount} demo reviews)`}
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-extrabold text-slate-950 md:text-4xl">
                {studio.title}
              </h1>

              <p className="mt-4 flex items-center gap-2 text-slate-600">
                <MapPin
                  size={18}
                  className="text-violet-700"
                />
                {studio.location}
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-violet-50 p-4">
                  <Users
                    className="mb-2 text-violet-700"
                    size={23}
                  />
                  <p className="text-sm text-slate-500">
                    Capacity
                  </p>
                  <p className="mt-1 font-bold text-slate-900">
                    Up to {studio.maxCapacity} people
                  </p>
                </div>

                <div className="rounded-xl bg-violet-50 p-4">
                  <Clock3
                    className="mb-2 text-violet-700"
                    size={23}
                  />
                  <p className="text-sm text-slate-500">
                    Booking
                  </p>
                  <p className="mt-1 font-bold text-slate-900">
                    Hourly Rental
                  </p>
                </div>

                <div className="rounded-xl bg-violet-50 p-4">
                  <Camera
                    className="mb-2 text-violet-700"
                    size={23}
                  />
                  <p className="text-sm text-slate-500">
                    Category
                  </p>
                  <p className="mt-1 font-bold text-slate-900">
                    {studio.category}
                  </p>
                </div>
              </div>

              {/* Information tabs */}
              <div className="mt-9 flex gap-6 overflow-x-auto border-b border-slate-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 border-b-2 pb-4 text-sm font-semibold transition ${
                      activeTab === tab.id
                        ? "border-violet-700 text-violet-700"
                        : "border-transparent text-slate-500 hover:text-violet-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="min-h-48 py-7">
                {activeTab === "overview" && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      About This Studio
                    </h2>
                    <p className="mt-4 whitespace-pre-line leading-8 text-slate-600">
                      {studio.overview}
                    </p>
                  </div>
                )}

                {activeTab === "amenities" && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      Studio Amenities
                    </h2>

                    {studio.amenities?.length ? (
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        {studio.amenities.map((amenity) => (
                          <div
                            key={amenity}
                            className="flex items-center gap-3 rounded-lg bg-slate-50 p-3"
                          >
                            <Wifi
                              size={18}
                              className="text-violet-700"
                            />
                            <span className="text-sm text-slate-700">
                              {amenity}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-slate-500">
                        No amenities have been listed yet.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "availability" && (
                  <StudioAvailabilityCalendar
                    studio={studio}
                  />
                )}

                {activeTab === "reviews" && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      Studio Reviews
                    </h2>
                    <p className="mt-4 text-slate-600">
                      Verified customer reviews have not
                      been added yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Hourly Rate
              </p>

              <div className="mt-2">
                <span className="text-4xl font-extrabold text-violet-700">
                  ${studio.hourlyRate}
                </span>
                <span className="text-slate-500">
                  {" "}/ hour
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5 text-sm">
                <span className="text-slate-500">
                  Security Deposit
                </span>
                <span className="font-semibold text-slate-900">
                  ${studio.securityDeposit}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  Maximum Capacity
                </span>
                <span className="font-semibold text-slate-900">
                  {studio.maxCapacity} people
                </span>
              </div>

              <div className="mt-6">
                <BookingModal studio={studio} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-bold text-slate-950">
                Hosted By
              </h3>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">
                  {studio.ownerName?.charAt(0).toUpperCase() ||
                    "S"}
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    {studio.ownerName || "Studio Host"}
                  </p>
                  <p className="text-xs text-slate-500">
                    StudioSpace Host
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm text-slate-600">
                <BadgeCheck
                  size={18}
                  className="text-violet-700"
                />
                Host information provided
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-violet-100 p-5">
              <ShieldCheck className="shrink-0 text-violet-700" />
              <p className="text-sm leading-6 text-violet-900">
                Review the studio information, equipment,
                and booking terms before making a reservation.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* ======================================
          FULL-SCREEN PHOTO LIGHTBOX
          ====================================== */}

      {lightboxOpen && hasImages && (
        <div
          data-studio-lightbox
          role="dialog"
          aria-modal="true"
          aria-label={`${studio.title} photo gallery`}
          className="fixed inset-0 z-[200] flex flex-col bg-[#090613]/[0.98] text-white"
        >
          {/* Lightbox header */}
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-7">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white sm:text-base">
                {studio.title}
              </p>
              <p className="mt-1 text-xs text-violet-200">
                Photo {activeImage + 1} of {images.length}
              </p>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeLightbox}
              aria-label="Close full-screen gallery"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            >
              <X size={23} />
            </button>
          </div>

          {/* Main full-screen image */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3 py-5 sm:px-16">
            <div className="relative h-full w-full max-w-6xl">
              <Image
                src={currentImage}
                alt={`${studio.title} full-screen photo ${activeImage + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={previousImage}
                  aria-label="Previous full-screen photo"
                  className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition hover:bg-violet-700 sm:left-6"
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Next full-screen photo"
                  className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition hover:bg-violet-700 sm:right-6"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail navigation */}
          {images.length > 1 && (
            <div className="shrink-0 border-t border-white/10 px-4 py-4 sm:px-7">
              <div className="mx-auto flex max-w-5xl justify-start gap-3 overflow-x-auto py-1 sm:justify-center">
                {images.map((image, index) => (
                  <button
                    key={`${image}-lightbox-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Show full-screen photo ${index + 1}`}
                    aria-pressed={activeImage === index}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-20 sm:w-28 ${
                      activeImage === index
                        ? "border-violet-400 opacity-100"
                        : "border-white/15 opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${studio.title} gallery thumbnail ${index + 1}`}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>

              <p className="mt-2 hidden text-center text-xs text-violet-200 sm:block">
                Use ← and → to browse photos · Press Esc to close
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
