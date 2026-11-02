
export interface StudioCoordinates {
  latitude: number;
  longitude: number;
}

export interface Studio {
  _id: string;
  title: string;
  category: string;
  location: string;

  // Optional exact location information.
  // Older studio records may not include these.
  fullAddress?: string;
  coordinates?: StudioCoordinates | null;

  hourlyRate: number;
  securityDeposit: number;
  maxCapacity: number;
  image: string;
  images: string[];
  amenities: string[];
  overview: string;

  rating?: number;
  reviewCount?: number;

  ownerName: string;
  ownerEmail: string;
  createdAt: string;

  status?: string;
  isDemo?: boolean;
}

export interface StudiosResponse {
  success: boolean;
  count: number;
  data: Studio[];
}
