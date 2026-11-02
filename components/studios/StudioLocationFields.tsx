
"use client";

import { ExternalLink, MapPin, RotateCcw } from "lucide-react";

export type StudioLocationValue = {
  fullAddress: string;
  latitude: string;
  longitude: string;
};

type Props = {
  value: StudioLocationValue;
  onChange: (next: StudioLocationValue) => void;
  disabled?: boolean;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-600 dark:border-violet-400/30 dark:bg-[#30213f] dark:text-white";

export function parseStudioCoordinates(
  value: StudioLocationValue
):
  | { latitude: number; longitude: number }
  | null {
  const lat = value.latitude.trim();
  const lng = value.longitude.trim();

  if (!lat && !lng) return null;

  if (!lat || !lng) {
    throw new Error(
      "Enter both latitude and longitude, or leave both empty."
    );
  }

  const latitude = Number(lat);
  const longitude = Number(lng);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      "Latitude must be between -90 and 90, and longitude between -180 and 180."
    );
  }

  return { latitude, longitude };
}

export default function StudioLocationFields({
  value,
  onChange,
  disabled = false,
}: Props) {
  function update(key: keyof StudioLocationValue, text: string) {
    onChange({ ...value, [key]: text });
  }

  let validCoordinates: {
    latitude: number;
    longitude: number;
  } | null = null;

  try {
    validCoordinates = parseStudioCoordinates(value);
  } catch {
    validCoordinates = null;
  }

  const mapUrl = validCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${validCoordinates.latitude},${validCoordinates.longitude}`
      )}`
    : "";

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 dark:border-violet-400/20 dark:bg-[#21172f]">
      <div className="mb-5 flex items-start gap-3">
        <MapPin
          size={23}
          className="mt-0.5 shrink-0 text-violet-700 dark:text-violet-300"
        />

        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">
            Exact Studio Location
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-violet-200">
            Add the full address and exact map coordinates.
            These fields are optional, but they help customers
            locate your studio accurately.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700 dark:text-violet-100 sm:col-span-2">
          Full Street Address (Optional)
          <input
            type="text"
            value={value.fullAddress}
            onChange={(event) =>
              update("fullAddress", event.target.value)
            }
            maxLength={300}
            disabled={disabled}
            placeholder="Building, floor, street, neighborhood, city"
            className={inputClass}
          />
          <span className="mt-2 block text-xs font-normal text-slate-500 dark:text-violet-300">
            Use the actual studio address. Leave blank if you
            do not want to publish it yet.
          </span>
        </label>

        <label className="block text-sm font-semibold text-slate-700 dark:text-violet-100">
          Latitude (Optional)
          <input
            type="number"
            min="-90"
            max="90"
            step="any"
            value={value.latitude}
            onChange={(event) =>
              update("latitude", event.target.value)
            }
            disabled={disabled}
            placeholder="e.g. 23.7809"
            className={inputClass}
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700 dark:text-violet-100">
          Longitude (Optional)
          <input
            type="number"
            min="-180"
            max="180"
            step="any"
            value={value.longitude}
            onChange={(event) =>
              update("longitude", event.target.value)
            }
            disabled={disabled}
            placeholder="e.g. 90.4073"
            className={inputClass}
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-violet-50 p-4 dark:bg-violet-500/10">
        <p className="max-w-lg text-xs leading-6 text-violet-900 dark:text-violet-100">
          In Google Maps, right-click the studio location
          (or long-press on mobile) to find its coordinates.
          Copy the latitude and longitude exactly.
          The entered location will be visible to visitors
          when connected to the map.
        </p>

        {validCoordinates ? (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white"
          >
            Preview Map
            <ExternalLink size={15} />
          </a>
        ) : (
          <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
            No coordinates selected
          </span>
        )}
      </div>

      {(value.fullAddress ||
        value.latitude ||
        value.longitude) && (
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onChange({
              fullAddress: "",
              latitude: "",
              longitude: "",
            })
          }
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-violet-700 dark:text-violet-300"
        >
          <RotateCcw size={14} />
          Clear Exact Location
        </button>
      )}
    </section>
  );
}
