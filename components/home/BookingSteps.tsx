
import {
  Search,
  CalendarDays,
  ClipboardCheck,
  Clapperboard,
  ArrowRight,
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
    title: "Book Instantly",
    description:
      "Submit your booking request and manage your reservation easily.",
    icon: ClipboardCheck,
  },
  {
    number: "04",
    title: "Create & Produce",
    description:
      "Visit your booked studio and bring your creative vision to life.",
    icon: Clapperboard,
  },
];

export default function BookingSteps() {
  return (
    <section className="bg-white px-5 py-20 md:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="mb-14 text-center">
          <span className="inline-block rounded-full bg-violet-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-violet-700">
            Simple Booking Process
          </span>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
            How Booking Works
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Book your ideal creative studio in four simple steps.
            Spend less time searching and more time creating.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {bookingSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.number} className="relative">
                <div className="group flex h-full flex-col items-center rounded-2xl border border-violet-100 bg-[#f8f7fd] px-6 py-10 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  {/* Number */}
                  <span className="absolute right-5 top-5 text-sm font-bold text-violet-400">
                    {step.number}
                  </span>

                  {/* Icon */}
                  <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-100 transition-colors group-hover:bg-violet-700">
                    <Icon
                      size={36}
                      strokeWidth={1.8}
                      className="text-violet-700 transition-colors group-hover:text-white"
                    />
                  </div>

                  <h3 className="text-xl font-bold text-slate-950">
                    {step.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {step.description}
                  </p>
                </div>

                {/* Arrow connector on desktop */}
                {index < bookingSteps.length - 1 && (
                  <div className="absolute -right-5 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-violet-200 bg-white p-2 text-violet-700 lg:flex">
                    <ArrowRight size={17} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
