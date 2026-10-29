"use client";
/**
 * MoodFlix — single user-visible route (`/`).
 *
 * The app is a single-page experience with view-routing handled by the
 * Zustand store (landing, questionnaire, results, watchlist, about). This
 * keeps everything on one route while still feeling like a multi-page site.
 */
import { AppShell } from "@/components/moodflix/app-shell";

export default function Home() {
  return <AppShell />;
}
