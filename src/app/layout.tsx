import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MoodFlix — Find the movie that fits your mood",
  description:
    "MoodFlix is a mood-based movie recommendation engine. Answer a short, friendly questionnaire about how you feel and what you're in the mood for, and get 5–10 personally matched movies with clear explanations of why each one fits.",
  keywords: [
    "MoodFlix",
    "movie recommendation",
    "mood based",
    "what to watch",
    "film finder",
  ],
  authors: [{ name: "MoodFlix" }],
  openGraph: {
    title: "MoodFlix — Find the movie that fits your mood",
    description:
      "A mood-based movie recommendation engine with transparent, explainable matching.",
    siteName: "MoodFlix",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
          <SonnerToaster position="top-center" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
