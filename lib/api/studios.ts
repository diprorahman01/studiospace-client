
import "server-only";

import type {
  Studio,
  StudiosResponse,
} from "@/types/studio";

// Server-side requests should use the actual
// Express backend, not the Vercel frontend domain.
const API_URL = (
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
      next: {
        revalidate: 60,
      },
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

// Fetch featured studios.
export async function getFeaturedStudios(): Promise<
  Studio[]
> {
  return fetchStudios(
    "/api/studios/featured"
  );
}

// Fetch all studios.
export async function getAllStudios(): Promise<
  Studio[]
> {
  return fetchStudios(
    "/api/studios"
  );
}

// Fetch studio details.
export async function getStudioById(
  id: string
): Promise<Studio | null> {
  const response = await fetch(
    `${API_URL}/api/studios/${encodeURIComponent(id)}`,
    {
      next: {
        revalidate: 60,
      },
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
