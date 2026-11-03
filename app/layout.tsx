
import type { Metadata } from "next";

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
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#f8f7fd] text-slate-900 antialiased"
      >
        <ThemeProvider>
          <Navbar />

          <main>
            <ProtectedRouteGate>
              {children}
            </ProtectedRouteGate>
          </main>

          <Footer />

          <ThemeToggle />

          <BookingNotifications />

          <Toaster
            richColors
            position="top-right"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
