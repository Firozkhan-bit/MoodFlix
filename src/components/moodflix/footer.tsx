"use client";
/**
 * MoodFlix — footer.
 * Sticks to the viewport bottom on short pages (via the flex column layout in
 * the app shell) and is pushed down naturally when content overflows.
 */
import { Film, Github, Heart } from "lucide-react";
import { useMoodflix, type ViewKey } from "@/lib/store/moodflix-store";

export function Footer() {
  const { setView } = useMoodflix();
  const go = (v: ViewKey) => () => setView(v);

  return (
    <footer className="mt-auto border-t border-border/60 bg-background/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-rose-500 text-black">
              <Film className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <span className="text-base font-bold mf-text-gradient">MoodFlix</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            Find the movie that fits your mood. A transparent, rule-based
            recommendation engine — no black box, just clear matches.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground/90">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <button className="hover:text-foreground transition-colors" onClick={go("landing")}>
                Home
              </button>
            </li>
            <li>
              <button className="hover:text-foreground transition-colors" onClick={go("questionnaire")}>
                Discover
              </button>
            </li>
            <li>
              <button className="hover:text-foreground transition-colors" onClick={go("watchlist")}>
                Watchlist
              </button>
            </li>
            <li>
              <button className="hover:text-foreground transition-colors" onClick={go("about")}>
                About &amp; how it works
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground/90">Good to know</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Guests can get recommendations — no account needed.</li>
            <li>Sign in to save a watchlist and watched history.</li>
            <li>Ratings are sample data when no TMDB key is configured.</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p className="flex items-center gap-1.5">
            Built with <Heart className="h-3.5 w-3.5 text-rose-400" /> using Next.js, Prisma &amp; a transparent scoring engine.
          </p>
          <p className="flex items-center gap-2">
            <Github className="h-3.5 w-3.5" />
            Sample data for offline use — not affiliated with any streaming service.
          </p>
        </div>
      </div>
    </footer>
  );
}
