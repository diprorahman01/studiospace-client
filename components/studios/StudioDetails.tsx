
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  Clock3,
  MapPin,
  ShieldCheck,
  Star,
  Users,
  Wifi,
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

  const images =
    studio.images?.length > 0
      ? studio.images
      : [studio.image];

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "amenities", label: "Amenities" },
    { id: "availability", label: "Availability" },
    { id: "reviews", label: "Reviews" },
  ];

  function previousImage() {
    setActiveImage(
      (current) =>
        (current - 1 + images.length) % images.length
    );
  }

  function nextImage() {
    setActiveImage(
      (current) => (current + 1) % images.length
    );
  }

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
            {/* Image gallery */}
            <div className="relative h-[280px] overflow-hidden rounded-2xl bg-slate-200 sm:h-[420px] lg:h-[480px]">
              <Image
                src={images[activeImage]}
                alt={`${studio.title} - photo ${activeImage + 1}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 70vw"
                className="object-cover"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={previousImage}
                    aria-label="Previous studio photo"
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white p-3 text-slate-900 shadow-lg hover:bg-violet-100"
                  >
                    <ArrowLeft size={19} />
                  </button>

                  <button
                    type="button"
                    onClick={nextImage}
                    aria-label="Next studio photo"
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white p-3 text-slate-900 shadow-lg hover:bg-violet-100"
                  >
                    <ArrowRight size={19} />
                  </button>
                </>
              )}

              <span className="absolute bottom-4 right-4 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-medium text-white">
                {activeImage + 1} / {images.length}
              </span>
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
                    className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 ${
                      activeImage === index
                        ? "border-violet-700"
                        : "border-transparent"
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

          {/* Sidebar */}
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
    </main>
  );
}
