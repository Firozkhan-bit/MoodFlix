"use client";
/**
 * MoodFlix — sticky top navigation header.
 * Logo, primary nav (Home / Discover / Watchlist / About), and the
 * Sign in / Account area. Fully keyboard-accessible.
 */
import { useSession, signOut } from "next-auth/react";
import { Film, Sparkles, Bookmark, Info, Home, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMoodflix, type ViewKey } from "@/lib/store/moodflix-store";
import { cn } from "@/lib/utils";

const NAV: { key: ViewKey; label: string; icon: typeof Film }[] = [
  { key: "landing", label: "Home", icon: Home },
  { key: "questionnaire", label: "Discover", icon: Sparkles },
  { key: "watchlist", label: "Watchlist", icon: Bookmark },
  { key: "about", label: "About", icon: Info },
];

export function Header() {
  const { view, setView, openAuth } = useMoodflix();
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => setView("landing")}
          className="group flex items-center gap-2.5 focus-visible:outline-none"
          aria-label="MoodFlix home"
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-black shadow-lg shadow-rose-500/20 transition-transform group-hover:scale-105">
            <Film className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <span className="hidden text-lg font-bold tracking-tight sm:block">
            <span className="mf-text-gradient">MoodFlix</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              aria-current={view === key ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                view === key
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={() => setView("questionnaire")}
            size="sm"
            className="hidden sm:inline-flex bg-gradient-to-r from-amber-400 to-rose-500 text-black hover:opacity-90 hover:text-black"
          >
            <Sparkles className="mr-1 h-4 w-4" />
            Find My Movie
          </Button>

          {status === "authenticated" && session?.user ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("watchlist")}
                className="gap-2"
              >
                <UserRound className="h-4 w-4" />
                <span className="max-w-[10ch] truncate">{session.user.name ?? session.user.email}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut({ redirect: false })}
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => openAuth("login")}>
              Sign in
            </Button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <nav
        className="flex items-center gap-1 overflow-x-auto px-3 pb-2 md:hidden mf-scroll"
        aria-label="Primary mobile"
      >
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            aria-current={view === key ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              view === key
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
