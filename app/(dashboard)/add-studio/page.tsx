
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  LoaderCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import StudioImageUploader from "@/components/studios/StudioImageUploader";
import StudioLocationFields, {
  parseStudioCoordinates,
  type StudioLocationValue,
} from "@/components/studios/StudioLocationFields";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const CATEGORIES = [
  "Photo Studio",
  "Podcast Lounge",
  "Music Suite",
  "Film Stage",
  "Creative Workspace",
  "Art Workshop",
];

const AMENITY_OPTIONS = [
  "Wi-Fi",
  "Air Conditioning",
  "Free Parking",
  "Lighting Equipment",
  "Sound System",
  "Changing Room",
  "Makeup Station",
  "Green Screen",
  "Recording Equipment",
  "Restroom",
  "Waiting Area",
  "Power Backup",
];

type StudioResponse = {
  success: boolean;
  message?: string;
  data?: { _id: string };
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600";

function validImageUrl(value: string) {
  if (!value.trim() || value.length > 2048) return false;

  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("..") &&
    !value.includes("\\")
  ) {
    return true;
  }

  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export default function AddStudioPage() {
  const router = useRouter();

  const {
    data: session,
    isPending: checkingSession,
  } = authClient.useSession();

  const user = session?.user;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [overview, setOverview] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [securityDeposit, setSecurityDeposit] =
    useState("0");
  const [maxCapacity, setMaxCapacity] = useState("1");

  const [exactLocation, setExactLocation] =
    useState<StudioLocationValue>({
      fullAddress: "",
      latitude: "",
      longitude: "",
    });

  const [image, setImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [newImage, setNewImage] = useState("");

  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");

  const [submitting, setSubmitting] = useState(false);

  function addImage(url: string) {
    const value = url.trim();

    if (!validImageUrl(value)) {
      toast.error("Enter a valid image URL.");
      return;
    }

    if (value === image || images.includes(value)) {
      toast.error("This image has already been added.");
      return;
    }

    if (images.length >= 9) {
      toast.error("Maximum 10 images per studio.");
      return;
    }

    setImages((current) => [...current, value]);
    setNewImage("");
  }

  function toggleAmenity(value: string) {
    setAmenities((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : current.length < 30
          ? [...current, value]
          : current
    );
  }

  function addCustomAmenity() {
    const value = customAmenity.trim();

    if (value.length < 2 || value.length > 80) {
      toast.error("Amenity must be 2–80 characters.");
      return;
    }

    if (
      amenities.some(
        (item) => item.toLowerCase() === value.toLowerCase()
      )
    ) {
      toast.error("Amenity already added.");
      return;
    }

    if (amenities.length >= 30) {
      toast.error("Maximum 30 amenities.");
      return;
    }

    setAmenities((current) => [...current, value]);
    setCustomAmenity("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting || !user) return;

    const name = title.trim();
    const area = location.trim();
    const description = overview.trim();
    const mainImage = image.trim();

    const rate = Number(hourlyRate);
    const deposit = Number(securityDeposit);
    const capacity = Number(maxCapacity);

    if (name.length < 5 || name.length > 120) {
      toast.error("Studio name must be 5–120 characters.");
      return;
    }

    if (!CATEGORIES.includes(category)) {
      toast.error("Choose a valid category.");
      return;
    }

    if (area.length < 3 || area.length > 150) {
      toast.error("Location must be 3–150 characters.");
      return;
    }

    if (
      description.length < 30 ||
      description.length > 3000
    ) {
      toast.error("Description must be 30–3000 characters.");
      return;
    }

    if (
      !hourlyRate.trim() ||
      !Number.isFinite(rate) ||
      rate <= 0 ||
      rate > 100000
    ) {
      toast.error("Enter a valid hourly rate.");
      return;
    }

    if (
      !securityDeposit.trim() ||
      !Number.isFinite(deposit) ||
      deposit < 0 ||
      deposit > 1000000
    ) {
      toast.error("Enter a valid security deposit.");
      return;
    }

    if (
      !maxCapacity.trim() ||
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      capacity > 500
    ) {
      toast.error("Capacity must be between 1 and 500.");
      return;
    }

    if (
      !validImageUrl(mainImage) ||
      images.some((url) => !validImageUrl(url))
    ) {
      toast.error("Provide valid studio image URLs.");
      return;
    }

    if (exactLocation.fullAddress.trim().length > 300) {
      toast.error("Full address must be 300 characters or fewer.");
      return;
    }

    let coordinates: {
      latitude: number;
      longitude: number;
    } | null;

    try {
      coordinates = parseStudioCoordinates(exactLocation);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Invalid studio coordinates."
      );
      return;
    }

    setSubmitting(true);

    try {
      
const response = await fetch("/api/studios", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({
    title: name,
    category,
    location: area,
    fullAddress: exactLocation.fullAddress.trim(),
    coordinates,
    overview: description,
    hourlyRate: rate,
    securityDeposit: deposit,
    maxCapacity: capacity,
    image: mainImage,
    images: [...new Set([mainImage, ...images])],
    amenities,
  }),
});


      const result: StudioResponse = await response.json();

      if (response.status === 401) {
        toast.error("Please log in again.");
        router.push("/login");
        return;
      }

      if (!response.ok || !result.success) {
        toast.error(
          result.message || "Could not create studio."
        );
        return;
      }

      toast.success("Studio created successfully!");
      router.push("/my-listings");
      router.refresh();
    } catch (error) {
      console.error("Create studio error:", error);
      toast.error("Could not connect to the server.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession || !user) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        {checkingSession ? (
          <LoaderCircle
            size={34}
            className="animate-spin text-violet-700"
          />
        ) : (
          <>
            <p className="text-lg font-bold">Login Required</p>
            <Link
              href="/login"
              className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white"
            >
              Go to Login
            </Link>
          </>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-[85vh] bg-[#f8f7fd] px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="mb-5 inline-flex items-center gap-2 text-sm text-violet-700"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
            HOST YOUR SPACE
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-slate-950">
            Add a New Studio
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Publish your workspace for other creators to discover.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Studio information */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-950">
              <Building2
                size={22}
                className="text-violet-700"
              />
              Studio Information
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                Studio Name *
                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  minLength={5}
                  maxLength={120}
                  required
                  placeholder="e.g. Violet Lens Photography Studio"
                  className={`mt-2 ${inputClass}`}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Category *
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  required
                  className={`mt-2 ${inputClass}`}
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Location *
                <input
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  required
                  maxLength={150}
                  placeholder="e.g. Gulshan, Dhaka"
                  className={`mt-2 ${inputClass}`}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Hourly Rate (USD) *
                <input
                  type="number"
                  min="1"
                  max="100000"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(event) =>
                    setHourlyRate(event.target.value)
                  }
                  required
                  className={`mt-2 ${inputClass}`}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Security Deposit (USD) *
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  value={securityDeposit}
                  onChange={(event) =>
                    setSecurityDeposit(event.target.value)
                  }
                  required
                  className={`mt-2 ${inputClass}`}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Maximum Capacity *
                <input
                  type="number"
                  min="1"
                  max="500"
                  step="1"
                  value={maxCapacity}
                  onChange={(event) =>
                    setMaxCapacity(event.target.value)
                  }
                  required
                  className={`mt-2 ${inputClass}`}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Owner Name
                <input
                  value={user.name}
                  readOnly
                  className={`mt-2 ${inputClass}`}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                Owner Email
                <input
                  value={user.email}
                  readOnly
                  className={`mt-2 ${inputClass}`}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                Detailed Overview *
                <textarea
                  rows={6}
                  minLength={30}
                  maxLength={3000}
                  required
                  value={overview}
                  onChange={(event) =>
                    setOverview(event.target.value)
                  }
                  placeholder="Describe your studio, equipment, facilities, and what creators can do here."
                  className={`mt-2 ${inputClass}`}
                />
              </label>
            </div>
          </section>

          {/* New exact location fields */}
          <StudioLocationFields
            value={exactLocation}
            onChange={setExactLocation}
            disabled={submitting}
          />

          {/* Studio images */}
          <section className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-950">
              Studio Images
            </h2>

            <label className="block text-sm font-semibold text-slate-700">
              Main Image URL *
              <input
                value={image}
                onChange={(event) =>
                  setImage(event.target.value)
                }
                required
                placeholder="https://example.com/studio.jpg"
                className={`mt-2 ${inputClass}`}
              />
            </label>

            <StudioImageUploader
              label="Upload Main Image"
              disabled={submitting}
              onUploaded={setImage}
            />

            {image && validImageUrl(image) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt="Main studio preview"
                className="h-52 w-full rounded-xl object-cover"
              />
            )}

            <div className="border-t border-slate-100 pt-5">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Additional Images (up to 9)
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="url"
                  value={newImage}
                  onChange={(event) =>
                    setNewImage(event.target.value)
                  }
                  placeholder="Additional image URL"
                  className={inputClass}
                />

                <button
                  type="button"
                  onClick={() => addImage(newImage)}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white"
                >
                  <Plus size={17} />
                  Add URL
                </button>
              </div>

              <div className="mt-3">
                <StudioImageUploader
                  label="Upload Additional Image"
                  disabled={
                    submitting || images.length >= 9
                  }
                  onUploaded={addImage}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((url) => (
                  <div
                    key={url}
                    className="relative overflow-hidden rounded-xl border border-slate-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Additional studio"
                      className="h-28 w-full object-cover"
                    />

                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() =>
                        setImages((current) =>
                          current.filter((item) => item !== url)
                        )
                      }
                      className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-red-600 shadow"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Amenities */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-5 text-xl font-bold text-slate-950">
              Amenities
            </h2>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {AMENITY_OPTIONS.map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={amenities.includes(item)}
                    onChange={() => toggleAmenity(item)}
                    className="accent-violet-700"
                  />
                  {item}
                </label>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <input
                value={customAmenity}
                onChange={(event) =>
                  setCustomAmenity(event.target.value)
                }
                placeholder="Add another amenity"
                className={inputClass}
              />

              <button
                type="button"
                onClick={addCustomAmenity}
                className="rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {amenities
                .filter(
                  (item) => !AMENITY_OPTIONS.includes(item)
                )
                .map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleAmenity(item)}
                    className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700"
                  >
                    {item}
                    <Trash2 size={13} />
                  </button>
                ))}
            </div>
          </section>

          {/* Form actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/my-listings"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-7 py-3 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                  Creating Studio...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Add Studio
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
