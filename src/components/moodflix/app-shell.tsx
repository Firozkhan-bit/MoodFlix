"use client";
/**
 * MoodFlix — application shell.
 *
 * Renders the header, the current view (landing / questionnaire / results /
 * watchlist / about), the sticky footer, and the global movie-details +
 * auth dialogs. Also seeds the local sample dataset into the DB on first
 * mount so watchlist/watched work even before any explicit seeding.
 */
import { useEffect } from "react";
import { Header } from "@/components/moodflix/header";
import { Footer } from "@/components/moodflix/footer";
import { AuthDialog } from "@/components/moodflix/auth-dialog";
import { MovieDetailsDialog } from "@/components/moodflix/movie/movie-details-dialog";
import { LandingView } from "@/components/moodflix/views/landing-view";
import { QuestionnaireView } from "@/components/moodflix/views/questionnaire-view";
import { ResultsView } from "@/components/moodflix/views/results-view";
import { WatchlistView } from "@/components/moodflix/views/watchlist-view";
import { AboutView } from "@/components/moodflix/views/about-view";
import { useMoodflix } from "@/lib/store/moodflix-store";
import { api } from "@/lib/api-client";

export function AppShell() {
  const { view } = useMoodflix();

  // Seed the sample dataset once (idempotent). Failures are non-fatal — the
  // movie service falls back to the in-memory sample list either way.
  useEffect(() => {
    api.seed().catch(() => {
      /* ignore — sample data is also served in-memory */
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {view === "landing" && <LandingView />}
        {view === "questionnaire" && <QuestionnaireView />}
        {view === "results" && <ResultsView />}
        {view === "watchlist" && <WatchlistView />}
        {view === "about" && <AboutView />}
      </main>
      <Footer />

      {/* Global overlays */}
      <MovieDetailsDialog />
      <AuthDialog />
    </div>
  );
}
