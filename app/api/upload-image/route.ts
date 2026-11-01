
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in to upload images.",
        },
        { status: 401 }
      );
    }

    const origin = request.headers.get("origin");

    if (
      origin &&
      origin !== new URL(request.url).origin
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request origin.",
        },
        { status: 403 }
      );
    }

    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Image upload is not configured on the server.",
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select an image.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only JPG, PNG, WebP and GIF images are allowed.",
        },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Image must be smaller than 5 MB.",
        },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // Validate common image file signatures.
    const isJpeg =
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff;

    const isPng =
      bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(
        Buffer.from([
          137, 80, 78, 71,
          13, 10, 26, 10,
        ])
      );

    const isGif =
      bytes.length >= 6 &&
      ["GIF87a", "GIF89a"].includes(
        bytes.subarray(0, 6).toString("ascii")
      );

    const isWebp =
      bytes.length >= 12 &&
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP";

    const validSignature =
      (file.type === "image/jpeg" && isJpeg) ||
      (file.type === "image/png" && isPng) ||
      (file.type === "image/gif" && isGif) ||
      (file.type === "image/webp" && isWebp);

    if (!validSignature) {
      return NextResponse.json(
        {
          success: false,
          message: "The selected image is invalid.",
        },
        { status: 400 }
      );
    }

    const uploadBody = new FormData();

    const blob = new Blob([bytes], {
      type: file.type,
    });

    uploadBody.append("image", blob, file.name);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        body: uploadBody,
        signal: AbortSignal.timeout(30000),
        cache: "no-store",
      }
    );

    const result = await response.json();

    const imageUrl = result?.data?.url;

    if (
      !response.ok ||
      result?.success !== true ||
      typeof imageUrl !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            result?.error?.message ||
            "The image could not be uploaded.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Image uploaded successfully.",
      url: imageUrl,
    });
  } catch (error) {
    console.error("Image upload failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Image upload failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
