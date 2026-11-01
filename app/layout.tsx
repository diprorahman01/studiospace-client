
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ThemeProvider from "@/providers/ThemeProvider";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { Toaster } from "sonner";
import "./globals.css";

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
      <body className="min-h-screen bg-[#f8f7fd] text-slate-900 antialiased">
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <ThemeToggle />
          <Toaster
            richColors
            position="top-right"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
