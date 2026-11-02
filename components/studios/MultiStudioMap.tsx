
"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type {
  Map as LeafletMap,
  Marker as LeafletMarker,
} from "leaflet";
import type { Studio } from "@/types/studio";

type Props = {
  studios: Studio[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function validCoordinates(studio: Studio) {
  const lat = studio.coordinates?.latitude;
  const lng = studio.coordinates?.longitude;

  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export default function MultiStudioMap({
  studios,
  selectedId,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<
    Map<string, LeafletMarker>
  >(new Map());

  const leafletRef =
    useRef<typeof import("leaflet") | null>(null);

  // Create the map and pins when the studio set changes.
  useEffect(() => {
    if (!containerRef.current || studios.length === 0) {
      return;
    }

    let cancelled = false;
    let createdMap: LeafletMap | null = null;

    async function initializeMap() {
      const L = await import("leaflet");

      if (cancelled || !containerRef.current) {
        return;
      }

      const validStudios = studios.filter(validCoordinates);

      if (validStudios.length === 0) {
        return;
      }

      leafletRef.current = L;

      const first = validStudios[0].coordinates!;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView(
        [first.latitude, first.longitude],
        12
      );

      createdMap = map;
      mapRef.current = map;

      L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      const bounds = L.latLngBounds([]);
      const markers = new Map<string, LeafletMarker>();

      for (const studio of validStudios) {
        const coordinates = studio.coordinates!;

        const icon = createPin(
          L,
          studio._id === selectedId
        );

        const marker = L.marker(
          [coordinates.latitude, coordinates.longitude],
          {
            icon,
            title: studio.title,
            alt: studio.title,
          }
        );

        marker.addTo(map);
        marker.on("click", () => onSelect(studio._id));

        markers.set(studio._id, marker);

        bounds.extend([
          coordinates.latitude,
          coordinates.longitude,
        ]);
      }

      markersRef.current = markers;

      if (validStudios.length === 1) {
        map.setView(
          [first.latitude, first.longitude],
          15
        );
      } else if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [45, 45],
          maxZoom: 14,
        });
      }

      // Needed when the map first appears in a responsive grid.
      window.requestAnimationFrame(() => {
        if (!cancelled) {
          map.invalidateSize();
        }
      });
    }

    void initializeMap();

    return () => {
      cancelled = true;

      if (createdMap) {
        createdMap.remove();
      }

      if (mapRef.current === createdMap) {
        mapRef.current = null;
      }

      markersRef.current.clear();
      leafletRef.current = null;
    };
    // The parent supplies a stable onSelect callback.
  }, [studios, onSelect]);

  // Update highlighted pin without recreating the map.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;

    if (!L || !map) return;

    for (const [id, marker] of markersRef.current) {
      const active = id === selectedId;

      marker.setIcon(createPin(L, active));
      marker.setZIndexOffset(active ? 1000 : 0);
    }

    if (selectedId) {
      const marker = markersRef.current.get(selectedId);

      if (marker) {
        map.panTo(marker.getLatLng(), {
          animate: true,
        });
      }
    }
  }, [selectedId, studios]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl">
      <div
        ref={containerRef}
        aria-label="Interactive map showing studio locations"
        className="h-[400px] w-full bg-[#e9e5f3] sm:h-[510px] lg:h-[590px]"
        style={{ zIndex: 0 }}
      />
    </div>
  );
}

function createPin(
  L: typeof import("leaflet"),
  active: boolean
) {
  const size = active ? 22 : 17;
  const color = active ? "#6d28d9" : "#a78bfa";

  return L.divIcon({
    className: "",
    html: `
      <span style="
        display:block;
        height:${size}px;
        width:${size}px;
        background:${color};
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 3px 12px rgba(0,0,0,.4);
      "></span>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
