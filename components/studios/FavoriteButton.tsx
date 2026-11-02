
"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useFavorites } from "@/lib/favorites";

type Props = {
  studioId: string;
  studioTitle: string;
};

export default function FavoriteButton({
  studioId,
  studioTitle,
}: Props) {
  const router = useRouter();

  const { data: session, isPending } =
    authClient.useSession();

  const userId = session?.user?.id;

  const { isFavorite, toggle } = useFavorites(userId);

  const saved = isFavorite(studioId);

  function handleClick() {
    if (isPending) return;

    if (!userId) {
      toast.info("Log in to save your favorite studios.");
      router.push("/login");
      return;
    }

    try {
      toggle(studioId);

      if (saved) {
        toast.success("Removed from your favorites.");
      } else {
        toast.success(
          `${studioTitle} added to your favorites.`
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save favorites."
      );
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={
        saved
          ? `Remove ${studioTitle} from favorites`
          : `Save ${studioTitle} to favorites`
      }
      aria-pressed={saved}
      title={
        saved ? "Remove from favorites" : "Save to favorites"
      }
      className={`absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border shadow-md backdrop-blur-md transition hover:scale-110 disabled:opacity-50 ${
        saved
          ? "border-rose-200 bg-rose-50 text-rose-600"
          : "border-white/50 bg-white/95 text-violet-700 hover:text-rose-600 dark:border-violet-300/30 dark:bg-[#21172f]/95 dark:text-violet-200"
      }`}
    >
      <Heart
        size={19}
        fill={saved ? "currentColor" : "none"}
        strokeWidth={2.2}
      />
    </button>
  );
}
