
import { notFound } from "next/navigation";
import StudioDetails from "@/components/studios/StudioDetails";
import { getStudioById } from "@/lib/api/studios";

interface StudioDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudioDetailsPage({
  params,
}: StudioDetailsPageProps) {
  const { id } = await params;

  // MongoDB ObjectIds contain 24 hexadecimal characters
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    notFound();
  }

  const studio = await getStudioById(id);

  if (!studio) {
    notFound();
  }

  return <StudioDetails studio={studio} />;
}
