"use client";
/**
 * MoodFlix — Watchlist view.
 *
 * Two tabs: Watchlist and Watched. Requires authentication; guests see a
 * friendly sign-in prompt. Uses the TanStack Query hooks for data + the
 * shared MovieCard for rows.
 */
import { Bookmark, Eye, LogIn, Film, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MovieCard } from "@/components/moodflix/movie/movie-card";
import { useMoodflix } from "@/lib/store/moodflix-store";
import { useWatchlist, useWatched, useToggleWatchlist } from "@/hooks/use-user-movies";
import { useSession } from "next-auth/react";

export function WatchlistView() {
  const { status } = useSession();
  const { openAuth, setView } = useMoodflix();
  const watchlist = useWatchlist();
  const watched = useWatched();
  const removeWatchlist = useToggleWatchlist();

  if (status !== "authenticated") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-300">
          <Bookmark className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">Your watchlist lives here</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to save movies, track what you've watched, and keep your
          preferences across sessions. Guests can still get recommendations.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => openAuth("register")} className="gap-1.5">
            <LogIn className="h-4 w-4" /> Create an account
          </Button>
          <Button variant="outline" onClick={() => openAuth("login")}>
            Sign in
          </Button>
        </div>
        <Button variant="link" onClick={() => setView("questionnaire")} className="mt-3 text-muted-foreground">
          Continue as guest →
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400/20 to-rose-500/20 text-amber-300">
          <Bookmark className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Your library</h1>
          <p className="text-sm text-muted-foreground">
            Movies you want to watch and ones you've already seen.
          </p>
        </div>
      </div>

      <Tabs defaultValue="watchlist" className="mt-6">
        <TabsList>
          <TabsTrigger value="watchlist" className="gap-1.5">
            <Bookmark className="h-4 w-4" />
            Watchlist
            {watchlist.data && (
              <span className="ml-1 rounded-full bg-amber-400/20 px-1.5 text-xs text-amber-200">
                {watchlist.data.items.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="watched" className="gap-1.5">
            <Eye className="h-4 w-4" />
            Watched
            {watched.data && (
              <span className="ml-1 rounded-full bg-emerald-400/20 px-1.5 text-xs text-emerald-200">
                {watched.data.items.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Watchlist */}
        <TabsContent value="watchlist" className="mt-5">
          {watchlist.isLoading ? (
            <RowSkeletons />
          ) : watchlist.data && watchlist.data.items.length > 0 ? (
            <div className="grid gap-4">
              {watchlist.data.items.map((item) => (
                <div key={item.id} className="relative">
                  <MovieCard movie={item.movie} />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      removeWatchlist.mutate({ externalId: item.movie.externalId, add: false })
                    }
                    disabled={removeWatchlist.isPending}
                    className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-rose-300"
                    title="Remove from watchlist"
                    aria-label="Remove from watchlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Your watchlist is empty"
              body="Save movies from any recommendation or details view and they'll appear here."
              cta
            />
          )}
        </TabsContent>

        {/* Watched */}
        <TabsContent value="watched" className="mt-5">
          {watched.isLoading ? (
            <RowSkeletons />
          ) : watched.data && watched.data.items.length > 0 ? (
            <div className="grid gap-4">
              {watched.data.items.map((item) => (
                <MovieCard key={item.id} movie={item.movie} compact />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nothing watched yet"
              body="Mark movies as watched from the results page to keep track of what you've seen."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ title, body, cta = false }: { title: string; body: string; cta?: boolean }) {
  const { setView } = useMoodflix();
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-card/30 p-10 text-center">
      <Film className="mx-auto h-8 w-8 text-muted-foreground" />
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      {cta && (
        <Button onClick={() => setView("questionnaire")} className="mt-5 gap-1.5">
          Find movies to watch
        </Button>
      )}
    </div>
  );
}

function RowSkeletons() {
  return (
    <div className="grid gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-4 rounded-2xl border border-border/60 bg-card/40 p-4">
          <Skeleton className="h-36 w-24" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
