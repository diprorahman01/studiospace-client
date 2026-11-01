
"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

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

type Studio = {
  _id: string;
  ownerId?: string;
  title: string;
  category: string;
  location: string;
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

function validImageUrl(value: string) {
  const image = value.trim();

  if (!image || image.length > 2048) return false;

  if (
    image.startsWith("/") &&
    !image.startsWith("//") &&
    !image.includes("..") &&
    !image.includes("\\")
  ) {
    return true;
  }

  try {
    const url = new URL(image);

    return (
      ["http:", "https:"].includes(url.protocol) &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

function getStudioFromResponse(
  value: unknown
): Studio | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const body = value as Record<string, unknown>;

  const possible =
    body.data ?? body.studio ?? body;

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

  const [form, setForm] =
    useState<FormValues>(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [accessDenied, setAccessDenied] =
    useState(false);

  const [newImage, setNewImage] = useState("");
  const [newAmenity, setNewAmenity] = useState("");
  const [previewFailed, setPreviewFailed] =
    useState(false);

  const [originalStudio, setOriginalStudio] =
    useState<Studio | null>(null);

  function updateField(
    key: keyof FormValues,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

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
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Studio not found."
              : "Unable to load studio information."
          );
        }

        const result: unknown = await response.json();

        const studio = getStudioFromResponse(result);

        if (!studio) {
          throw new Error(
            "The studio response has an unexpected format."
          );
        }

        // This is a UI check only.
        // The PATCH API must enforce ownership independently.
        if (
          typeof studio.ownerId !== "string" ||
          studio.ownerId !== user?.id
        ) {
          if (!controller.signal.aborted) {
            setAccessDenied(true);
          }
          return;
        }

        const mainImage = studio.image || "";

        const images = Array.isArray(studio.images)
          ? studio.images.filter(
              (item): item is string =>
                typeof item === "string" &&
                item !== mainImage
            )
          : [];

        const amenities = Array.isArray(
          studio.amenities
        )
          ? studio.amenities.filter(
              (item): item is string =>
                typeof item === "string"
            )
          : [];

        if (!controller.signal.aborted) {
          setOriginalStudio(studio);

          setForm({
            title: studio.title || "",
            category: studio.category || "",
            location: studio.location || "",
            overview: studio.overview || "",
            hourlyRate: String(
              studio.hourlyRate ?? ""
            ),
            securityDeposit: String(
              studio.securityDeposit ?? 0
            ),
            maxCapacity: String(
              studio.maxCapacity ?? 1
            ),
            image: mainImage,
            images,
            amenities,
          });

          setLoadError("");
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load the studio."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadStudio();

    return () => controller.abort();
  }, [checkingSession, studioId, user?.id, router]);

  function addImage() {
    const value = newImage.trim();

    if (!validImageUrl(value)) {
      toast.error("Enter a valid image URL.");
      return;
    }

    if (
      value === form.image.trim() ||
      form.images.includes(value)
    ) {
      toast.error("This image has already been added.");
      return;
    }

    if (form.images.length >= 9) {
      toast.error("A studio can have at most 10 images.");
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

  function addAmenity() {
    const value = newAmenity.trim();

    if (value.length < 2 || value.length > 80) {
      toast.error("Amenity must contain 2–80 characters.");
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
      toast.error("Maximum 30 amenities allowed.");
      return;
    }

    setForm((current) => ({
      ...current,
      amenities: [...current.amenities, value],
    }));

    setNewAmenity("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving || !originalStudio || !user) {
      return;
    }

    const title = form.title.trim();
    const location = form.location.trim();
    const overview = form.overview.trim();
    const image = form.image.trim();

    const hourlyRate = Number(form.hourlyRate);
    const securityDeposit = Number(
      form.securityDeposit
    );
    const maxCapacity = Number(form.maxCapacity);

    if (title.length < 5 || title.length > 120) {
      toast.error("Studio name must be 5–120 characters.");
      return;
    }

    if (!CATEGORIES.includes(form.category)) {
      toast.error("Select a valid category.");
      return;
    }

    if (
      location.length < 3 ||
      location.length > 150
    ) {
      toast.error("Location must be 3–150 characters.");
      return;
    }

    if (
      overview.length < 30 ||
      overview.length > 3000
    ) {
      toast.error("Description must be 30–3000 characters.");
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
      toast.error("Capacity must be 1–500.");
      return;
    }

    if (!validImageUrl(image)) {
      toast.error("Enter a valid main image URL.");
      return;
    }

    if (
      form.images.some((item) => !validImageUrl(item))
    ) {
      toast.error("Please check additional image URLs.");
      return;
    }

    const images = [
      ...new Set([image, ...form.images]),
    ];

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
            overview,
            hourlyRate,
            securityDeposit,
            maxCapacity,
            image,
            images,
            amenities: form.amenities,
          }),
        }
      );

      const result: StudioResponse =
        await response.json();

      if (response.status === 401) {
        toast.error("Please log in again.");
        router.push("/login");
        return;
      }

      if (response.status === 403 ||
          response.status === 404) {
        toast.error(
          result.message ||
            "You cannot edit this studio."
        );
        return;
      }

      if (!response.ok || !result.success) {
        toast.error(
          result.message ||
            "Failed to update the studio."
        );
        return;
      }

      toast.success("Studio updated successfully!");

      router.push("/my-listings");
      router.refresh();
    } catch (error) {
      console.error("Edit studio error:", error);
      toast.error(
        "Could not connect to the server."
      );
    } finally {
      setSaving(false);
    }
  }

  if (checkingSession || (user && loading)) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <LoaderCircle
          size={36}
          className="animate-spin text-violet-700"
        />
        <p className="text-sm text-slate-500">
          Loading studio information...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-5">
        <ShieldAlert
          size={48}
          className="text-violet-700"
        />
        <h1 className="text-2xl font-bold">
          Login Required
        </h1>
        <Link
          href="/login"
          className="rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white"
        >
          Go to Login
        </Link>
      </main>
    );
  }

  if (accessDenied || loadError) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-5">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <ShieldAlert
            size={46}
            className="mx-auto mb-4 text-red-500"
          />
          <h1 className="text-2xl font-bold text-slate-950">
            {accessDenied
              ? "Access Denied"
              : "Unable to Load Studio"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            {accessDenied
              ? "Only the studio owner can edit this listing."
              : loadError}
          </p>
          <Link
            href="/my-listings"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3 text-sm font-semibold text-white"
          >
            <ArrowLeft size={17} />
            Back to My Listings
          </Link>
        </div>
      </main>
    );
  }

  if (!originalStudio) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f8f7fd]">
      <section className="border-b border-violet-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <Link
            href="/my-listings"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-700"
          >
            <ArrowLeft size={16} />
            Back to My Listings
          </Link>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-700">
            STUDIO MANAGEMENT
          </p>

          <h1 className="text-3xl font-extrabold text-slate-950 sm:text-4xl">
            Edit Studio
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Update your studio information and save your changes.
          </p>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div className="space-y-7">
          {/* Basic information */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Building2
                size={23}
                className="text-violet-700"
              />
              <h2 className="text-xl font-bold">
                Studio Information
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="edit-title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Studio Name *
                </label>
                <input
                  id="edit-title"
                  required
                  minLength={5}
                  maxLength={120}
                  value={form.title}
                  onChange={(event) =>
                    updateField("title", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-category"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Category *
                </label>
                <select
                  id="edit-category"
                  required
                  value={form.category}
                  onChange={(event) =>
                    updateField(
                      "category",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-600"
                >
                  <option value="">
                    Select a category
                  </option>
                  {CATEGORIES.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="edit-location"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <MapPin
                    size={16}
                    className="text-violet-700"
                  />
                  Location *
                </label>
                <input
                  id="edit-location"
                  required
                  minLength={3}
                  maxLength={150}
                  value={form.location}
                  onChange={(event) =>
                    updateField(
                      "location",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-overview"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Studio Description *
                </label>
                <textarea
                  id="edit-overview"
                  required
                  minLength={30}
                  maxLength={3000}
                  rows={6}
                  value={form.overview}
                  onChange={(event) =>
                    updateField(
                      "overview",
                      event.target.value
                    )
                  }
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 outline-none focus:border-violet-600"
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {form.overview.length}/3000
                </p>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Wallet
                size={23}
                className="text-violet-700"
              />
              <h2 className="text-xl font-bold">
                Pricing & Capacity
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="edit-rate"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Hourly Rate (BDT) *
                </label>
                <input
                  id="edit-rate"
                  type="number"
                  min="0.01"
                  max="100000"
                  step="0.01"
                  required
                  value={form.hourlyRate}
                  onChange={(event) =>
                    updateField(
                      "hourlyRate",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-deposit"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Security Deposit (BDT) *
                </label>
                <input
                  id="edit-deposit"
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  required
                  value={form.securityDeposit}
                  onChange={(event) =>
                    updateField(
                      "securityDeposit",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="edit-capacity"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  <Users
                    size={16}
                    className="text-violet-700"
                  />
                  Maximum Capacity *
                </label>
                <input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  max="500"
                  step="1"
                  required
                  value={form.maxCapacity}
                  onChange={(event) =>
                    updateField(
                      "maxCapacity",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-600"
                />
              </div>
            </div>
          </section>

          {/* Image URLs */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Camera
                size={23}
                className="text-violet-700"
              />
              <h2 className="text-xl font-bold">
                Studio Images
              </h2>
            </div>

            <label
              htmlFor="edit-main-image"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Main Image URL *
            </label>

            <input
              id="edit-main-image"
              required
              value={form.image}
              onChange={(event) => {
                updateField(
                  "image",
                  event.target.value
                );
                setPreviewFailed(false);
              }}
              placeholder="https://example.com/studio.jpg"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-600"
            />

            <label
              htmlFor="edit-extra-image"
              className="mb-2 mt-6 block text-sm font-semibold text-slate-700"
            >
              Additional Images
            </label>

            <div className="flex gap-2">
              <input
                id="edit-extra-image"
                value={newImage}
                onChange={(event) =>
                  setNewImage(event.target.value)
                }
                placeholder="Paste another image URL"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-600"
              />
              <button
                type="button"
                onClick={addImage}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-100 px-4 py-3 text-sm font-semibold text-violet-700"
              >
                <Plus size={17} />
                Add
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {form.images.map((imageUrl) => (
                <div
                  key={imageUrl}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <span className="min-w-0 truncate text-xs text-slate-600">
                    {imageUrl}
                  </span>

                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        images: current.images.filter(
                          (item) => item !== imageUrl
                        ),
                      }))
                    }
                    className="text-red-500"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Amenities */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <CheckCircle2
                size={23}
                className="text-violet-700"
              />
              <h2 className="text-xl font-bold">
                Studio Amenities
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {COMMON_AMENITIES.map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={form.amenities.includes(
                      item
                    )}
                    onChange={() =>
                      toggleAmenity(item)
                    }
                    className="h-4 w-4 accent-violet-700"
                  />
                  {item}
                </label>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <input
                value={newAmenity}
                onChange={(event) =>
                  setNewAmenity(event.target.value)
                }
                placeholder="Add custom amenity"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-600"
              />

              <button
                type="button"
                onClick={addAmenity}
                className="inline-flex items-center gap-2 rounded-xl border border-violet-200 px-4 py-3 text-sm font-semibold text-violet-700"
              >
                <Plus size={17} />
                Add
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {form.amenities
                .filter(
                  (item) =>
                    !COMMON_AMENITIES.includes(
                      item
                    )
                )
                .map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700"
                  >
                    {item}
                    <button
                      type="button"
                      aria-label={`Remove ${item}`}
                      onClick={() =>
                        toggleAmenity(item)
                      }
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
            </div>
          </section>
        </div>

        {/* Preview and actions */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            {validImageUrl(form.image) &&
            !previewFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image.trim()}
                alt="Studio preview"
                onError={() =>
                  setPreviewFailed(true)
                }
                className="h-52 w-full object-cover"
              />
            ) : (
              <div className="flex h-52 items-center justify-center bg-violet-50">
                <Camera
                  size={42}
                  className="text-violet-300"
                />
              </div>
            )}

            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                LIVE PREVIEW
              </p>

              <h3 className="mt-2 text-lg font-bold text-slate-950">
                {form.title || "Studio Name"}
              </h3>

              <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={15} />
                {form.location || "Location"}
              </p>

              <p className="mt-4 text-lg font-bold text-violet-700">
                ৳{Number(
                  form.hourlyRate || 0
                ).toLocaleString("en-BD")}
                <span className="text-sm font-normal text-slate-500">
                  {" "}/hour
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">
              Save Your Changes
            </h3>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              Your updates will be saved to MongoDB
              and reflected in the studio listing.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            <Link
              href="/my-listings"
              className="mt-3 flex w-full items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </aside>
      </form>
    </main>
  );
}
