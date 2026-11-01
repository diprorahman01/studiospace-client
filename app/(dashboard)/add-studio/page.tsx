
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CATEGORIES = [
  "Photo Studio",
  "Podcast Lounge",
  "Music Suite",
  "Film Stage",
  "Creative Workspace",
  "Art Workshop",
];

const COMMON_AMENITIES = [
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

type CreateStudioResponse = {
  success: boolean;
  message?: string;
  data?: {
    _id: string;
  };
};

function isValidImageUrl(value: string) {
  const url = value.trim();

  if (!url) return false;

  if (
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.includes("..") &&
    !url.includes("\\")
  ) {
    return true;
  }

  try {
    const parsed = new URL(url);
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      Boolean(parsed.hostname)
    );
  } catch {
    return false;
  }
}

export default function AddStudioPage() {
  const router = useRouter();

  const { data: session, isPending: checkingSession } =
    authClient.useSession();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [overview, setOverview] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("0");
  const [maxCapacity, setMaxCapacity] = useState("1");

  const [image, setImage] = useState("");
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [newImage, setNewImage] = useState("");

  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  const user = session?.user;

  function toggleAmenity(value: string) {
    setAmenities((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  function addCustomAmenity() {
    const value = customAmenity.trim();

    if (value.length < 2 || value.length > 80) {
      toast.error("Amenity must contain 2–80 characters.");
      return;
    }

    if (amenities.some(
      (item) => item.toLowerCase() === value.toLowerCase()
    )) {
      toast.error("This amenity has already been added.");
      return;
    }

    if (amenities.length >= 30) {
      toast.error("You can add up to 30 amenities.");
      return;
    }

    setAmenities((current) => [...current, value]);
    setCustomAmenity("");
  }

  function addImage() {
    const value = newImage.trim();

    if (!isValidImageUrl(value) || value.length > 2048) {
      toast.error("Enter a valid image URL.");
      return;
    }

    if (additionalImages.includes(value) || image.trim() === value) {
      toast.error("This image has already been added.");
      return;
    }

    if (additionalImages.length >= 9) {
      toast.error("You can use up to 10 images including the main image.");
      return;
    }

    setAdditionalImages((current) => [...current, value]);
    setNewImage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    if (checkingSession) {
      toast.info("Checking your account...");
      return;
    }

    if (!user) {
      toast.error("Please log in to list a studio.");
      router.push("/login");
      return;
    }

    const studioTitle = title.trim();
    const studioLocation = location.trim();
    const studioOverview = overview.trim();
    const mainImage = image.trim();

    const rate = Number(hourlyRate);
    const deposit = Number(securityDeposit);
    const capacity = Number(maxCapacity);

    if (studioTitle.length < 5 || studioTitle.length > 120) {
      toast.error("Studio name must be 5–120 characters.");
      return;
    }

    if (!CATEGORIES.includes(category)) {
      toast.error("Select a studio category.");
      return;
    }

    if (
      studioLocation.length < 3 ||
      studioLocation.length > 150
    ) {
      toast.error("Location must be 3–150 characters.");
      return;
    }

    if (
      studioOverview.length < 30 ||
      studioOverview.length > 3000
    ) {
      toast.error("Description must be 30–3000 characters.");
      return;
    }

    if (!hourlyRate.trim() ||
        !Number.isFinite(rate) ||
        rate <= 0 ||
        rate > 100000) {
      toast.error("Enter a valid hourly rate.");
      return;
    }

    if (!securityDeposit.trim() ||
        !Number.isFinite(deposit) ||
        deposit < 0 ||
        deposit > 1000000) {
      toast.error("Enter a valid security deposit.");
      return;
    }

    if (!Number.isInteger(capacity) ||
        capacity < 1 ||
        capacity > 500) {
      toast.error("Capacity must be between 1 and 500.");
      return;
    }

    if (!isValidImageUrl(mainImage) ||
        mainImage.length > 2048) {
      toast.error("Enter a valid main image URL.");
      return;
    }

    const images = [mainImage, ...additionalImages].filter(
      (value, index, array) => array.indexOf(value) === index
    );

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/studios`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: studioTitle,
          category,
          location: studioLocation,
          overview: studioOverview,
          hourlyRate: rate,
          securityDeposit: deposit,
          maxCapacity: capacity,
          image: mainImage,
          images,
          amenities,
        }),
      });

      const result: CreateStudioResponse = await response.json();

      if (response.status === 401) {
        toast.error("Your session expired. Please log in again.");
        router.push("/login");
        return;
      }

      if (!response.ok || !result.success) {
        toast.error(
          result.message || "Unable to create studio."
        );
        return;
      }

      if (!result.data?._id) {
        toast.error("Studio created, but its ID was not returned.");
        return;
      }

      toast.success("Your studio was listed successfully!");

      router.push(`/studios/${result.data._id}`);
      router.refresh();
    } catch (error) {
      console.error("Create studio error:", error);

      toast.error(
        "Could not connect to the server. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle
            size={34}
            className="animate-spin text-violet-700"
          />
          <p className="text-sm text-slate-500">
            Checking your account...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f8f7fd] px-5">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldCheck
            size={48}
            className="mx-auto mb-5 text-violet-700"
          />
          <h1 className="text-2xl font-bold text-slate-950">
            Login Required
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Sign in to your StudioSpace account before
            listing a creative studio.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-800"
          >
            Go to Login
            <ArrowRight size={17} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f7fd]">
      {/* Heading */}
      <section className="border-b border-violet-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <Link
            href="/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-700"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="flex items-start gap-4">
            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 sm:flex">
              <Building2 size={28} />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-700">
                HOST YOUR SPACE
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Add a New Studio
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                Share your creative workspace with photographers,
                filmmakers, musicians, and other creators.
              </p>
            </div>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_340px]"
      >
        {/* Main fields */}
        <div className="space-y-7">
          {/* Basic information */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Building2 className="text-violet-700" size={23} />
              <h2 className="text-xl font-bold text-slate-950">
                Studio Information
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="studio-title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Studio Name *
                </label>
                <input
                  id="studio-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  minLength={5}
                  maxLength={120}
                  required
                  placeholder="e.g. Violet Lens Photography Studio"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label
                  htmlFor="studio-category"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Category *
                </label>
                <select
                  id="studio-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="studio-location"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <MapPin size={16} className="text-violet-700" />
                  Location *
                </label>
                <input
                  id="studio-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  minLength={3}
                  maxLength={150}
                  required
                  placeholder="e.g. Dhanmondi, Dhaka"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label
                  htmlFor="studio-overview"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Studio Description *
                </label>
                <textarea
                  id="studio-overview"
                  value={overview}
                  onChange={(event) => setOverview(event.target.value)}
                  minLength={30}
                  maxLength={3000}
                  rows={6}
                  required
                  placeholder="Describe your workspace, equipment, facilities, and what makes your studio special..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 text-slate-900 outline-none focus:border-violet-600"
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {overview.length}/3000
                </p>
              </div>
            </div>
          </section>

          {/* Pricing and capacity */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Wallet className="text-violet-700" size={23} />
              <h2 className="text-xl font-bold text-slate-950">
                Pricing & Capacity
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="studio-rate"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Hourly Rate (BDT) *
                </label>
                <input
                  id="studio-rate"
                  type="number"
                  min="0.01"
                  max="100000"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(event) => setHourlyRate(event.target.value)}
                  required
                  placeholder="1500"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label
                  htmlFor="studio-deposit"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Security Deposit (BDT) *
                </label>
                <input
                  id="studio-deposit"
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  value={securityDeposit}
                  onChange={(event) =>
                    setSecurityDeposit(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="studio-capacity"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <Users size={17} className="text-violet-700" />
                  Maximum Capacity *
                </label>
                <input
                  id="studio-capacity"
                  type="number"
                  min="1"
                  max="500"
                  step="1"
                  value={maxCapacity}
                  onChange={(event) =>
                    setMaxCapacity(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600"
                />
              </div>
            </div>
          </section>

          {/* Images */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Camera className="text-violet-700" size={23} />
              <h2 className="text-xl font-bold text-slate-950">
                Studio Images
              </h2>
            </div>

            <div>
              <label
                htmlFor="studio-image"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Main Image URL *
              </label>
              <input
                id="studio-image"
                type="text"
                value={image}
                onChange={(event) => {
                  setImage(event.target.value);
                  setPreviewFailed(false);
                }}
                required
                placeholder="https://example.com/studio.jpg"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600"
              />
              <p className="mt-2 text-xs text-slate-500">
                Use a public image URL or a local image path
                beginning with /images/.
              </p>
            </div>

            <div className="mt-6">
              <label
                htmlFor="additional-image"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Additional Image URLs
              </label>
              <div className="flex gap-2">
                <input
                  id="additional-image"
                  type="text"
                  value={newImage}
                  onChange={(event) => setNewImage(event.target.value)}
                  placeholder="Paste another image URL"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600"
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-100 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-200"
                >
                  <ImagePlus size={18} />
                  Add
                </button>
              </div>

              {additionalImages.length > 0 && (
                <div className="mt-4 space-y-2">
                  {additionalImages.map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <span className="min-w-0 truncate text-xs text-slate-600">
                        {item}
                      </span>
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() =>
                          setAdditionalImages((current) =>
                            current.filter((value) => value !== item)
                          )
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Amenities */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <CheckCircle2 className="text-violet-700" size={23} />
              <h2 className="text-xl font-bold text-slate-950">
                Studio Amenities
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {COMMON_AMENITIES.map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 hover:border-violet-300"
                >
                  <input
                    type="checkbox"
                    checked={amenities.includes(item)}
                    onChange={() => toggleAmenity(item)}
                    className="h-4 w-4 accent-violet-700"
                  />
                  {item}
                </label>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <input
                type="text"
                value={customAmenity}
                onChange={(event) =>
                  setCustomAmenity(event.target.value)
                }
                placeholder="Add a custom amenity"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600"
              />
              <button
                type="button"
                onClick={addCustomAmenity}
                className="flex items-center gap-2 rounded-xl border border-violet-200 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50"
              >
                <Plus size={17} />
                Add
              </button>
            </div>

            {amenities.filter(
              (item) => !COMMON_AMENITIES.includes(item)
            ).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {amenities
                  .filter((item) => !COMMON_AMENITIES.includes(item))
                  .map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700"
                    >
                      {item}
                      <button
                        type="button"
                        aria-label={`Remove ${item}`}
                        onClick={() => toggleAmenity(item)}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            {image.trim() &&
            isValidImageUrl(image) &&
            !previewFailed ? (
              // Native img supports both external and local URLs.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.trim()}
                alt="Studio preview"
                onError={() => setPreviewFailed(true)}
                className="h-52 w-full object-cover"
              />
            ) : (
              <div className="flex h-52 flex-col items-center justify-center gap-3 bg-violet-50 text-violet-400">
                <Camera size={40} />
                <span className="text-xs text-violet-600">
                  Studio image preview
                </span>
              </div>
            )}

            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                LIVE PREVIEW
              </p>
              <h3 className="mt-2 text-lg font-bold text-slate-950">
                {title.trim() || "Your Studio Name"}
              </h3>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={15} />
                {location.trim() || "Studio location"}
              </p>
              <p className="mt-4 text-lg font-bold text-violet-700">
                ৳{Number(hourlyRate || 0).toLocaleString("en-BD")}
                <span className="text-sm font-normal text-slate-500">
                  {" "}/hour
                </span>
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={20} className="text-violet-700" />
              <h3 className="font-bold text-slate-950">
                Ready to Publish?
              </h3>
            </div>

            <p className="mb-5 text-sm leading-7 text-slate-500">
              Double-check your studio information before
              publishing. Your listing will be visible to
              creators once it is saved.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={19} className="animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  Publish Studio
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </section>
        </aside>
      </form>
    </main>
  );
}
