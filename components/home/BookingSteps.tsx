
import {
  ArrowRight,
  CalendarDays,
  Clapperboard,
  ClipboardCheck,
  Search,
  Sparkles,
} from "lucide-react";

import GradientIcon, {
  type GradientIconTone,
} from "@/components/ui/GradientIcon";

const bookingSteps: {
  number: string;
  title: string;
  description: string;
  icon: typeof Search;
  tone: GradientIconTone;
}[] = [
  {
    number: "01",
    title: "Discover Spaces",
    description:
      "Browse photography studios, film stages, podcast rooms, music suites and creative workspaces.",
    icon: Search,
    tone: "violet",
  },
  {
    number: "02",
    title: "Select Shoot Hours",
    description:
      "Check studio availability, compare hourly rates and select the date and time for your session.",
    icon: CalendarDays,
    tone: "blue",
  },
  {
    number: "03",
    title: "Book Instantly",
    description:
      "Submit your booking request immediately. The studio host may need to confirm it before your session is reserved.",
    icon: ClipboardCheck,
    tone: "cyan",
  },
  {
    number: "04",
    title: "Create & Produce",
    description:
      "Once your booking is confirmed, visit the studio and bring your creative project to life.",
    icon: Clapperboard,
    tone: "pink",
  },
];

export default function BookingSteps() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="booking-steps-heading"
      className="ss-home-section scroll-mt-24"
    >
      <div className="ss-container">
        <div className="mx-auto mb-11 max-w-3xl text-center">
          <span className="ss-kicker">
            <Sparkles size={14} />
            Simple Booking Process
          </span>

          <h2
            id="booking-steps-heading"
            className="ss-heading mt-5"
          >
            How Booking Works
          </h2>

          <p className="ss-description mx-auto mt-4 max-w-2xl">
            Discover your ideal creative space, choose
            your preferred schedule, submit a booking
            request and get ready to create.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {bookingSteps.map((step, index) => (
            <div
              key={step.number}
              className="relative min-w-0"
            >
              <article
                className={[
                  "ss-card group",
                  "relative flex h-full min-h-[300px]",
                  "flex-col items-center p-6 text-center",
                  "transition-transform duration-300",
                  "hover:-translate-y-1",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-8 bottom-0 h-20 rounded-full bg-purple-500/10 blur-3xl"
                />

                <div className="relative z-10 mb-3 flex w-full justify-end">
                  <span
                    className="rounded-full border px-3 py-1 text-xs font-extrabold tracking-wider"
                    style={{
                      background:
                        "var(--ss-surface-alt)",
                      color: "var(--ss-accent)",
                      borderColor: "var(--ss-border)",
                    }}
                  >
                    {step.number}
                  </span>
                </div>

                <GradientIcon
                  icon={step.icon}
                  tone={step.tone}
                  size="lg"
                  className="relative z-10 mb-5 group-hover:scale-110"
                />

                <h3
                  className="relative z-10 text-[17px] font-extrabold tracking-tight"
                  style={{
                    color: "var(--ss-ink)",
                  }}
                >
                  {step.title}
                </h3>

                <p
                  className="relative z-10 mt-3 text-[13px] leading-[1.8]"
                  style={{
                    color: "var(--ss-muted)",
                  }}
                >
                  {step.description}
                </p>
              </article>

              {index < bookingSteps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-[22px] top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-md lg:flex"
                  style={{
                    background: "var(--ss-surface)",
                    borderColor: "var(--ss-border)",
                    color: "var(--ss-accent)",
                  }}
                >
                  <ArrowRight size={17} />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
