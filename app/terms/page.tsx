
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Terms & Conditions | StudioSpace",
  description:
    "General platform guidelines for using the StudioSpace creative studio marketplace.",
};

const sections = [
  {
    title: "1. About StudioSpace",
    text: "StudioSpace is a platform where studio owners can list creative workspaces and users can discover studios and submit booking requests. StudioSpace helps connect creators and hosts.",
  },
  {
    title: "2. Accounts and User Information",
    text: "Users are responsible for providing accurate account information and keeping their login details secure. Users should not access accounts or information belonging to other people without permission.",
  },
  {
    title: "3. Studio Listings",
    text: "Hosts should provide accurate information about their studio, including its location, facilities, equipment, availability, and hourly rates. Hosts are responsible for keeping listing information up to date.",
  },
  {
    title: "4. Booking Requests",
    text: "Users should review studio details, dates, times, and prices before requesting a booking. Booking status may change as a host reviews or manages the reservation. Users should check their booking dashboard for the current status.",
  },
  {
    title: "5. Prices and Payments",
    text: "StudioSpace displays studio prices in US dollars (USD). A booking record or generated confirmation does not by itself prove that payment has been collected. Users and hosts should agree on any payment arrangements separately when applicable.",
  },
  {
    title: "6. Cancellations and Changes",
    text: "Booking cancellations and schedule changes depend on the options available in the platform. Users should review the latest reservation status and communicate with the relevant host when necessary.",
  },
  {
    title: "7. Responsible Use",
    text: "Users and hosts should use StudioSpace respectfully, provide accurate information, and avoid fraudulent listings, misleading booking requests, and unauthorized activity.",
  },
  {
    title: "8. Platform Availability",
    text: "StudioSpace may be updated or temporarily unavailable during maintenance or technical issues. Listing availability and reservation details should be verified before making arrangements outside the platform.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-[75vh] px-5 py-14 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-75"
          style={{ color: "var(--ss-accent)" }}
        >
          <ArrowLeft size={17} />
          Back to Home
        </Link>

        <div
          className="overflow-hidden rounded-[26px] border"
          style={{
            borderColor: "var(--ss-border)",
            background: "var(--ss-surface)",
            boxShadow: "var(--ss-shadow)",
          }}
        >
          <div className="border-b border-violet-400/15 bg-gradient-to-br from-[#24143d] via-[#3b2065] to-[#5e2b8c] px-7 py-12 text-white sm:px-12">
            <span className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-200/30 bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg">
              <FileText size={29} />
            </span>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Terms &amp; Conditions
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-violet-100">
              General guidelines for creators and studio
              hosts using the StudioSpace marketplace.
            </p>
          </div>

          <div className="space-y-9 px-7 py-10 sm:px-12 sm:py-12">
            {sections.map((section) => (
              <section key={section.title}>
                <h2
                  className="text-lg font-bold"
                  style={{ color: "var(--ss-ink)" }}
                >
                  {section.title}
                </h2>

                <p
                  className="mt-3 text-sm leading-8"
                  style={{ color: "var(--ss-muted)" }}
                >
                  {section.text}
                </p>
              </section>
            ))}

            <div
              className="flex items-start gap-3 rounded-2xl border p-5"
              style={{
                borderColor: "var(--ss-border)",
                background: "var(--ss-surface-alt)",
              }}
            >
              <ShieldCheck
                size={22}
                className="mt-0.5 shrink-0 text-violet-500"
              />

              <p
                className="text-sm leading-7"
                style={{ color: "var(--ss-muted)" }}
              >
                These guidelines describe the current
                platform experience. They do not replace
                any separate written agreement between
                a studio host and a customer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
