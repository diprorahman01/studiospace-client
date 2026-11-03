
import Link from "next/link";
import { Aperture } from "lucide-react";

import GradientIcon from "@/components/ui/GradientIcon";

type BrandLogoProps = {
  variant?: "navbar" | "footer";
  onClick?: () => void;
  className?: string;
};

export default function BrandLogo({
  variant = "navbar",
  onClick,
  className = "",
}: BrandLogoProps) {
  const isFooter = variant === "footer";

  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="StudioSpace — Home"
      className={[
        "group inline-flex shrink-0 items-center gap-2.5",
        "rounded-xl focus-visible:outline-2",
        "focus-visible:outline-offset-4",
        "focus-visible:outline-violet-400",
        className,
      ].join(" ")}
    >
      <GradientIcon
        icon={Aperture}
        tone="violet"
        size="sm"
        className="group-hover:rotate-6 group-hover:scale-105"
      />

      <span
        className="text-[21px] font-extrabold tracking-tight"
        style={
          isFooter
            ? { color: "#ffffff" }
            : { color: "var(--ss-ink)" }
        }
      >
        Studio
        <span
          className={
            isFooter
              ? "text-[#d7afff]"
              : "ss-accent-text"
          }
        >
          Space
        </span>
      </span>
    </Link>
  );
}
