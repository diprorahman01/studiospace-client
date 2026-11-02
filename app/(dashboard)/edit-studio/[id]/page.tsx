
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  LoaderCircle,
  Plus,
  Save,
  ShieldAlert,
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

const AMENITIES = [
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

type Studio = {
  _id: string;
  ownerId?: string;
  title: string;
  category: string;
  location: string;
  fullAddress?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
  overview: string;
  hourlyRate: number;
  securityDeposit: number;
  maxCapacity: number;
  image: string;
  images?: string[];
  amenities?: string[];
};

type StudioResponse = {
  success?: boolean;
  message?: string;
  data?: Studio;
  studio?: Studio;
};

type FormValues = {
  title: string;
  category: string;
  location: string;
  overview: string;
  hourlyRate: string;
  securityDeposit: string;
  maxCapacity: string;
  image: string;
  images: string[];
  amenities: string[];
};

const EMPTY_FORM: FormValues = {
  title: "",
  category: "",
  location: "",
  overview: "",
  hourlyRate: "",
  securityDeposit: "0",
  maxCapacity: "1",
  image: "",
  images: [],
  amenities: [],
};

const EMPTY_LOCATION: StudioLocationValue = {
  fullAddress: "",
  latitude: "",
  longitude: "",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600";

function validImageUrl(value: string) {
  if (!value.trim() || value.length > 2048) {
    return false;
  }

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

function extractStudio(value: unknown): Studio | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const response = value as StudioResponse;
  const possible =
    response.data ??
    response.studio ??
    value;

  if (!possible || typeof possible !== "object") {
    return null;
  }

  const studio = possible as Partial<Studio>;

  if (
    typeof studio._id !== "string" ||
    typeof studio.title !== "string"
  ) {
    return null;
  }

  return studio as Studio;
}

export default function EditStudioPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const studioId = params.id;

  const {
    data: session,
    isPending: checkingSession,
  } = authClient.useSession();

  const user = session?.user;

  const [form, setForm] = useState<FormValues>(EMPTY_FORM);

  const [exactLocation, setExactLocation] =
    useState<StudioLocationValue>(EMPTY_LOCATION);

  const [originalStudio, setOriginalStudio] =
    useState<Studio | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [accessDenied, setAccessDenied] =
    useState(false);

  const [newImage, setNewImage] = useState("");
  const [newAmenity, setNewAmenity] = useState("");

  // ========================================
  // Load existing studio information.
  // ========================================

  useEffect(() => {
    if (checkingSession) return;

    if (!user?.id) {
      router.replace("/login");
      return;
    }

    const controller = new AbortController();

    async function loadStudio() {
      try {
        if (!/^[a-fA-F0-9]{24}$/.test(studioId)) {
          throw new Error("Invalid studio ID.");
        }

        const response = await fetch(
          `${API_URL}/api/studios/${studioId}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Studio not found."
              : "Unable to load studio."
          );
        }

        const data: unknown = await response.json();
        const studio = extractStudio(data);

        if (!studio) {
          throw new Error("Unexpected studio response.");
        }

        if (studio.ownerId !== user?.id) {
          if (!controller.signal.aborted) {
            setAccessDenied(true);
          }
          return;
        }

        const gallery = Array.isArray(studio.images)
          ? studio.images.filter(
              (url) =>
                typeof url === "string" &&
                url !== studio.image
            )
          : [];

        if (!controller.signal.aborted) {
          setOriginalStudio(studio);

          setForm({
            title: studio.title || "",
            category: studio.category || "",
            location: studio.location || "",
            overview: studio.overview || "",
            hourlyRate: String(studio.hourlyRate ?? ""),
            securityDeposit: String(
              studio.securityDeposit ?? 0
            ),
            maxCapacity: String(studio.maxCapacity ?? 1),
            image: studio.image || "",
            images: gallery,
            amenities: Array.isArray(studio.amenities)
              ? studio.amenities
              : [],
          });

          setExactLocation({
            fullAddress: studio.fullAddress || "",
            latitude:
              typeof studio.coordinates?.latitude === "number"
                ? String(studio.coordinates.latitude)
                : "",
            longitude:
              typeof studio.coordinates?.longitude === "number"
                ? String(studio.coordinates.longitude)
                : "",
          });

          setLoadError("");
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not load studio."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadStudio();

    return () => controller.abort();
  }, [checkingSession, user?.id, studioId, router]);

  function setField(
    key: keyof FormValues,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function addImage(url: string) {
    const value = url.trim();

    if (!validImageUrl(value)) {
      toast.error("Enter a valid image URL.");
      return;
    }

    if (
      value === form.image ||
      form.images.includes(value)
    ) {
      toast.error("Image already added.");
      return;
    }

    if (form.images.length >= 9) {
      toast.error("Maximum 10 images allowed.");
      return;
    }

    setForm((current) => ({
      ...current,
      images: [...current.images, value],
    }));

    setNewImage("");
  }

  function toggleAmenity(value: string) {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(value)
        ? current.amenities.filter(
            (item) => item !== value
          )
        : current.amenities.length < 30
          ? [...current.amenities, value]
          : current.amenities,
    }));
  }

  function addCustomAmenity() {
    const value = newAmenity.trim();

    if (value.length < 2 || value.length > 80) {
      toast.error("Amenity must be 2–80 characters.");
      return;
    }

    if (
      form.amenities.some(
        (item) =>
          item.toLowerCase() === value.toLowerCase()
      )
    ) {
      toast.error("Amenity already exists.");
      return;
    }

    if (form.amenities.length >= 30) {
      toast.error("Maximum 30 amenities.");
      return;
    }

    setForm((current) => ({
      ...current,
      amenities: [...current.amenities, value],
    }));

    setNewAmenity("");
  }

  // ========================================
  // Submit studio updates.
  // ========================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving || !originalStudio || !user) return;

    const title = form.title.trim();
    const location = form.location.trim();
    const overview = form.overview.trim();
    const image = form.image.trim();

    const hourlyRate = Number(form.hourlyRate);
    const securityDeposit = Number(form.securityDeposit);
    const maxCapacity = Number(form.maxCapacity);

    if (title.length < 5 || title.length > 120) {
      toast.error("Studio name must be 5–120 characters.");
      return;
    }

    if (!CATEGORIES.includes(form.category)) {
      toast.error("Select a valid category.");
      return;
    }

    if (location.length < 3 || location.length > 150) {
      toast.error("Location must be 3–150 characters.");
      return;
    }

    if (overview.length < 30 || overview.length > 3000) {
      toast.error("Overview must be 30–3000 characters.");
      return;
    }

    if (
      !form.hourlyRate.trim() ||
      !Number.isFinite(hourlyRate) ||
      hourlyRate <= 0 ||
      hourlyRate > 100000
    ) {
      toast.error("Enter a valid hourly rate.");
      return;
    }

    if (
      !form.securityDeposit.trim() ||
      !Number.isFinite(securityDeposit) ||
      securityDeposit < 0 ||
      securityDeposit > 1000000
    ) {
      toast.error("Enter a valid deposit.");
      return;
    }

    if (
      !form.maxCapacity.trim() ||
      !Number.isInteger(maxCapacity) ||
      maxCapacity < 1 ||
      maxCapacity > 500
    ) {
      toast.error("Capacity must be between 1 and 500.");
      return;
    }

    if (
      !validImageUrl(image) ||
      form.images.some((url) => !validImageUrl(url))
    ) {
      toast.error("Check the image URLs.");
      return;
    }

    if (exactLocation.fullAddress.trim().length > 300) {
      toast.error(
        "Full address must be 300 characters or fewer."
      );
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
          : "Invalid map coordinates."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/api/studios/${studioId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            title,
            category: form.category,
            location,
            fullAddress: exactLocation.fullAddress.trim(),
            coordinates,
            overview,
            hourlyRate,
            securityDeposit,
            maxCapacity,
            image,
            images: [...new Set([image, ...form.images])],
            amenities: form.amenities,
          }),
        }
      );

      const result: StudioResponse = await response.json();

      if (response.status === 401) {
        toast.error("Please log in again.");
        router.push("/login");
        return;
      }

      if (!response.ok || !result.success) {
        toast.error(
          result.message ||
            "Could not update the studio."
        );
        return;
      }

      toast.success("Studio updated successfully!");
      router.push("/my-listings");
      router.refresh();
    } catch (error) {
      console.error("Edit studio error:", error);
      toast.error("Could not connect to the server.");
    } finally {
      setSaving(false);
    }
  }

  if (checkingSession || (user && loading)) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center gap-3">
        <LoaderCircle
          size={34}
          className="animate-spin text-violet-700"
        />
        Loading Studio...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <ShieldAlert
          size={42}
          className="text-violet-700"
        />

        <h1 className="text-xl font-bold">
          Login Required
        </h1>

        <Link
          href="/login"
          className="rounded-xl bg-violet-700 px-5 py-3 text-white"
        >
          Go to Login
        </Link>
      </main>
    );
  }

  if (accessDenied || loadError) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-5 text-center">
        <ShieldAlert
          size={44}
          className="text-red-600"
        />

        <h1 className="text-2xl font-bold">
          {accessDenied
            ? "Access Denied"
            : "Unable to Edit Studio"}
        </h1>

        <p className="text-sm text-slate-500">
          {accessDenied
            ? "You can edit only studios owned by your account."
            : loadError}
        </p>

        <Link
          href="/my-listings"
          className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white"
        >
          Back to My Listings
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-[#f8f7fd] px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/my-listings"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-700"
        >
          <ArrowLeft size={17} />
          Back to My Listings
        </Link>

        <h1 className="text-3xl font-extrabold text-slate-950">
          Edit Studio
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Update your workspace information, images,
          and map location.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-7"
        >
          {/* Studio information */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
              <Building2
                size={22}
                className="text-violet-700"
              />
              Studio Information
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Studio Name *
                <input
                  value={form.title}
                  onChange={(event) =>
                    setField("title", event.target.value)
                  }
                  required
                  minLength={5}
                  maxLength={120}
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Category *
                <select
                  value={form.category}
                  onChange={(event) =>
                    setField("category", event.target.value)
                  }
                  required
                  className={inputClass}
                >
                  <option value="">
                    Select a category
                  </option>

                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Location *
                <input
                  value={form.location}
                  onChange={(event) =>
                    setField("location", event.target.value)
                  }
                  maxLength={150}
                  required
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Hourly Rate (USD) *
                <input
                  type="number"
                  min="1"
                  max="100000"
                  step="0.01"
                  value={form.hourlyRate}
                  onChange={(event) =>
                    setField("hourlyRate", event.target.value)
                  }
                  required
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Security Deposit (USD) *
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  value={form.securityDeposit}
                  onChange={(event) =>
                    setField(
                      "securityDeposit",
                      event.target.value
                    )
                  }
                  required
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Maximum Capacity *
                <input
                  type="number"
                  min="1"
                  max="500"
                  step="1"
                  value={form.maxCapacity}
                  onChange={(event) =>
                    setField(
                      "maxCapacity",
                      event.target.value
                    )
                  }
                  required
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Owner Name
                <input
                  value={user.name}
                  readOnly
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Owner Email
                <input
                  value={user.email}
                  readOnly
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Detailed Overview *
                <textarea
                  value={form.overview}
                  onChange={(event) =>
                    setField("overview", event.target.value)
                  }
                  rows={6}
                  minLength={30}
                  maxLength={3000}
                  required
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          {/* New exact location fields */}
          <StudioLocationFields
            value={exactLocation}
            onChange={setExactLocation}
            disabled={saving}
          />

          {/* Images */}
          <section className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-950">
              Studio Images
            </h2>

            <label className="block text-sm font-semibold text-slate-700">
              Main Image URL *
              <input
                value={form.image}
                onChange={(event) =>
                  setField("image", event.target.value)
                }
                required
                className={inputClass}
              />
            </label>

            <StudioImageUploader
              label="Upload New Main Image"
              disabled={saving}
              onUploaded={(url) =>
                setField("image", url)
              }
            />

            {validImageUrl(form.image) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image}
                alt="Current main studio image"
                className="h-52 w-full rounded-xl object-cover"
              />
            )}

            <div className="border-t border-slate-100 pt-5">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Gallery Images
              </p>

              <div className="flex gap-3">
                <input
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
                  className="mt-2 rounded-xl bg-violet-700 px-5 py-3 text-white"
                >
                  <Plus size={17} />
                </button>
              </div>

              <div className="mt-4">
                <StudioImageUploader
                  label="Upload Gallery Image"
                  disabled={
                    saving || form.images.length >= 9
                  }
                  onUploaded={addImage}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {form.images.map((url) => (
                  <div
                    key={url}
                    className="relative overflow-hidden rounded-xl border border-slate-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Studio gallery"
                      className="h-28 w-full object-cover"
                    />

                    <button
                      type="button"
                      aria-label="Remove gallery image"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          images: current.images.filter(
                            (item) => item !== url
                          ),
                        }))
                      }
                      className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-red-600"
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
              {AMENITIES.map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={form.amenities.includes(item)}
                    onChange={() => toggleAmenity(item)}
                    className="accent-violet-700"
                  />
                  {item}
                </label>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <input
                value={newAmenity}
                onChange={(event) =>
                  setNewAmenity(event.target.value)
                }
                placeholder="Add another amenity"
                className={inputClass}
              />

              <button
                type="button"
                onClick={addCustomAmenity}
                className="mt-2 rounded-xl bg-violet-700 px-5 py-3 text-white"
              >
                <Plus size={17} />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {form.amenities
                .filter(
                  (item) => !AMENITIES.includes(item)
                )
                .map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAmenity(item)}
                    className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700"
                  >
                    {item}
                    <Trash2 size={13} />
                  </button>
                ))}
            </div>
          </section>

          {/* Form buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/my-listings"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-7 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
