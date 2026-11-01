
"use client";

import { useRef, useState } from "react";
import {
  ImagePlus,
  LoaderCircle,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

type Props = {
  onUploaded: (url: string) => void;
  disabled?: boolean;
  label?: string;
};

type UploadResult = {
  success: boolean;
  message?: string;
  url?: string;
};

export default function StudioImageUploader({
  onUploaded,
  disabled = false,
  label = "Upload Image",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file?: File) {
    if (!file || disabled || uploading) return;

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowed.includes(file.type)) {
      toast.error("Select a JPG, PNG, WebP or GIF image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("The image must be smaller than 5 MB.");
      return;
    }

    setUploading(true);

    try {
      const form = new FormData();
      form.append("image", file);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const result: UploadResult = await response.json();

      if (!response.ok || !result.success || !result.url) {
        throw new Error(
          result.message || "Image upload failed."
        );
      }

      onUploaded(result.url);
      toast.success("Image uploaded successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to upload image."
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={disabled || uploading}
        onChange={(event) =>
          void handleFile(event.target.files?.[0])
        }
        className="hidden"
        aria-label={label}
      />

      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50 px-5 py-4 text-sm font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50 dark:border-violet-700 dark:bg-slate-800 dark:text-violet-300"
      >
        {uploading ? (
          <>
            <LoaderCircle
              size={19}
              className="animate-spin"
            />
            Uploading...
          </>
        ) : (
          <>
            <ImagePlus size={19} />
            <Upload size={16} />
            {label}
          </>
        )}
      </button>

      <p className="mt-2 text-xs text-slate-500">
        JPG, PNG, WebP or GIF. Maximum 5 MB.
      </p>
    </div>
  );
}
