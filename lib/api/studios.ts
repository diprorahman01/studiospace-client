
import "server-only";

import type {
  Studio,
  StudiosResponse,
} from "@/types/studio";

/*
  Local development:
  Always use the localhost Express backend.

  Production:
  Use the deployed Express backend URL.
*/

const API_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5000"
    : (
        process.env.API_SERVER_URL ||
        "http://localhost:5000"
      ).replace(/\/$/, "");

interface StudioDetailsResponse {
  success: boolean;
  data: Studio;
}

async function fetchStudios(
  endpoint: string
): Promise<Studio[]> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch studios: ${response.status}`
    );
  }

  const result: StudiosResponse =
    await response.json();

  if (
    !result.success ||
    !Array.isArray(result.data)
  ) {
    throw new Error(
      "Invalid studios API response"
    );
  }

  return result.data;
}

// Homepage: only the original featured studios.
export async function getFeaturedStudios(): Promise<
  Studio[]
> {
  return fetchStudios(
    "/api/studios/featured"
  );
}

// Explore Studios: all studios in the database.
export async function getAllStudios(): Promise<
  Studio[]
> {
  return fetchStudios(
    "/api/studios"
  );
}

// Studio details page.
export async function getStudioById(
  id: string
): Promise<Studio | null> {
  const response = await fetch(
    `${API_URL}/api/studios/${encodeURIComponent(id)}`,
    {
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch studio: ${response.status}`
    );
  }

  const result: StudioDetailsResponse =
    await response.json();

  if (
    !result.success ||
    !result.data
  ) {
    throw new Error(
      "Invalid studio details response"
    );
  }

  return result.data;
}
