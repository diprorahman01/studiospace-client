import type { Metadata } from "next";
import { Suspense } from "react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ThemeProvider from "@/providers/ThemeProvider";
import ThemeToggle from "@/components/layout/ThemeToggle";
import BookingNotifications from "@/components/layout/BookingNotifications";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import { Toaster } from "sonner";

import "./globals.css";
import "./gradient-icons.css";

export const metadata: Metadata = {
  title: "StudioSpace | Creative Studio Booking",
  description:
    "Discover and book photography studios, podcast rooms, music suites, and creative production spaces.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen antialiased"
        style={{
          backgroundColor: "var(--ss-bg)",
          color: "var(--ss-ink)",
        }}
      >
        <ThemeProvider>
          <Navbar />
          <main>
            <Suspense
              fallback={
                <div
                  role="status"
                  className="flex min-h-[60vh] items-center justify-center px-5 text-sm"
                  style={{ color: "var(--ss-muted)" }}
                >
                  Loading StudioSpace...
                </div>
              }
            >
              <ProtectedRouteGate>{children}</ProtectedRouteGate>
            </Suspense>
          </main>
          <Footer />
          <ThemeToggle />
          <BookingNotifications />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
