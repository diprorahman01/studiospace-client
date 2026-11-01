
import type { Studio, StudiosResponse } from "@/types/studio";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function fetchStudios(endpoint: string): Promise<Studio[]> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch studios: ${response.status}`);
  }

  const result: StudiosResponse = await response.json();

  if (!result.success || !Array.isArray(result.data)) {
    throw new Error("Invalid studios API response");
  }

  return result.data;
}

// Homepage: six featured studios
export async function getFeaturedStudios(): Promise<Studio[]> {
  return fetchStudios("/api/studios/featured");
}

// Explore page: all studios
export async function getAllStudios(): Promise<Studio[]> {
  return fetchStudios("/api/studios");
}
