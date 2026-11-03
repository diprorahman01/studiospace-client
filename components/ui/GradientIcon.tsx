
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";

export type GradientIconTone =
  | "violet"
  | "blue"
  | "pink"
  | "cyan"
  | "amber";

export type GradientIconSize =
  | "xs"
  | "sm"
  | "md"
  | "lg";

type GradientIconProps = {
  icon: LucideIcon;
  tone?: GradientIconTone;
  size?: GradientIconSize;
  className?: string;
};

const tones: Record<
  GradientIconTone,
  {
    from: string;
    middle: string;
    to: string;
    glow: string;
    border: string;
    highlight: string;
  }
> = {
  violet: {
    from: "#3a216c",
    middle: "#7136c9",
    to: "#bb38dd",
    glow: "rgba(171,70,245,0.45)",
    border: "rgba(222,154,255,0.52)",
    highlight: "#f8ddff",
  },
  blue: {
    from: "#172b66",
    middle: "#385de3",
    to: "#a04dec",
    glow: "rgba(62,125,255,0.38)",
    border: "rgba(139,190,255,0.55)",
    highlight: "#def5ff",
  },
  pink: {
    from: "#542263",
    middle: "#9934ab",
    to: "#ed59b4",
    glow: "rgba(236,81,193,0.36)",
    border: "rgba(255,167,236,0.55)",
    highlight: "#ffe3f7",
  },
  cyan: {
    from: "#163b68",
    middle: "#306bc9",
    to: "#8c49e0",
    glow: "rgba(53,198,248,0.36)",
    border: "rgba(147,233,255,0.58)",
    highlight: "#d5faff",
  },
  amber: {
    from: "#56306a",
    middle: "#9a49bd",
    to: "#ec7eb2",
    glow: "rgba(255,167,108,0.35)",
    border: "rgba(255,199,171,0.58)",
    highlight: "#fff1d9",
  },
};

const sizes = {
  xs: {
    tile: "h-9 w-9 rounded-xl",
    icon: 18,
  },
  sm: {
    tile: "h-12 w-12 rounded-2xl",
    icon: 25,
  },
  md: {
    tile: "h-[72px] w-[72px] rounded-[22px]",
    icon: 35,
  },
  lg: {
    tile: "h-[88px] w-[88px] rounded-[26px]",
    icon: 42,
  },
};

export default function GradientIcon({
  icon: Icon,
  tone = "violet",
  size = "md",
  className = "",
}: GradientIconProps) {
  const palette = tones[tone];
  const dimensions = sizes[size];

  const styles: CSSProperties = {
    background: `linear-gradient(
      145deg,
      ${palette.from} 0%,
      ${palette.middle} 58%,
      ${palette.to} 100%
    )`,
    borderColor: palette.border,
    boxShadow: `
      0 14px 29px -10px ${palette.glow},
      inset 0 1px 1px rgba(255,255,255,0.36),
      inset 0 -8px 16px rgba(20,7,47,0.25)
    `,
  };

  return (
    <span
      aria-hidden="true"
      data-ss-gradient-icon=""
      className={[
        "relative isolate inline-flex shrink-0",
        "items-center justify-center overflow-hidden border",
        "transition-transform duration-300",
        dimensions.tile,
        className,
      ].join(" ")}
      style={styles}
    >
      <span
        className="pointer-events-none absolute inset-[3px] rounded-[inherit] border border-white/15"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.24), transparent 43%, rgba(28,7,58,0.18))",
        }}
      />

      <span className="pointer-events-none absolute -left-3 -top-6 h-12 w-20 rotate-[-25deg] rounded-full bg-white/25 blur-xl" />

      <Icon
        size={dimensions.icon}
        strokeWidth={2.2}
        className="relative z-10"
        style={{
          color: palette.highlight,
          filter:
            "drop-shadow(0 2px 0 rgba(31,10,74,0.55)) drop-shadow(0 0 7px rgba(255,255,255,0.32))",
        }}
      />

      <span className="pointer-events-none absolute bottom-1.5 right-2 h-1.5 w-1.5 rounded-full bg-white/60 blur-[1px]" />
    </span>
  );
}
