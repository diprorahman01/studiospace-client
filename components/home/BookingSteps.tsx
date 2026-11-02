
import {
  ArrowRight,
  CalendarDays,
  Clapperboard,
  ClipboardCheck,
  Search,
  Sparkles,
} from "lucide-react";

const bookingSteps = [
  {
    number: "01",
    title: "Discover Spaces",
    description:
      "Explore creative studios and find the perfect space for your project.",
    icon: Search,
  },
  {
    number: "02",
    title: "Select Shoot Hours",
    description:
      "Choose your preferred date and time according to your schedule.",
    icon: CalendarDays,
  },
  {
    number: "03",
    title: "Request Your Booking",
    description:
      "Send a booking request and manage your reservation easily.",
    icon: ClipboardCheck,
  },
  {
    number: "04",
    title: "Create & Produce",
    description:
      "Visit your confirmed studio and bring your creative vision to life.",
    icon: Clapperboard,
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
            From discovering the right studio to bringing
            your project to life, the process is simple.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {bookingSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="relative min-w-0"
              >
                <article className="ss-card group flex h-full min-h-[258px] flex-col items-center p-6 text-center">
                  <div className="mb-4 flex w-full justify-end">
                    <span
                      className="rounded-full border px-3 py-1 text-xs font-extrabold tracking-wider"
                      style={{
                        background: "var(--ss-surface-alt)",
                        color: "var(--ss-accent)",
                        borderColor: "var(--ss-border)",
                      }}
                    >
                      {step.number}
                    </span>
                  </div>

                  <div className="ss-icon-tile mb-5 transition-transform duration-300 group-hover:scale-110">
                    <Icon
                      size={29}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </div>

                  <h3
                    className="text-[17px] font-extrabold tracking-tight"
                    style={{ color: "var(--ss-ink)" }}
                  >
                    {step.title}
                  </h3>

                  <p
                    className="mt-3 text-[13px] leading-[1.8]"
                    style={{ color: "var(--ss-muted)" }}
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
