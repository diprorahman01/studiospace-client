import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "StudioSpace | Book Creative Studios",
  description: "Discover and reserve inspiring spaces for photography, music, films and podcasts.",
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body className="min-h-screen bg-[#f8f7fd] text-slate-900 antialiased">
    <Navbar/><main>{children}</main><Footer/><Toaster richColors position="top-right" />
  </body></html>;
}
