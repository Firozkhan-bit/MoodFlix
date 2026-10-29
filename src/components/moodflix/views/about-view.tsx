"use client";
/**
 * MoodFlix — About / how-it-works view.
 *
 * Explains the transparent scoring system, the weight breakdown, the data
 * sources, and privacy. Keeps the tone friendly for a portfolio project.
 */
import {
  Brain, Scale, Database, ShieldCheck, Sparkles, Code2, Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMoodflix } from "@/lib/store/moodflix-store";
import { WEIGHTS } from "@/lib/recommendation/weights";

const WEIGHT_ROWS: { label: string; value: number; note: string }[] = [
  { label: "Mood & emotional tone", value: WEIGHTS.mood, note: "The heart of MoodFlix — the biggest signal." },
  { label: "Genre compatibility", value: WEIGHTS.genre, note: "How well the genres match your picks." },
  { label: "Desired experience", value: WEIGHTS.experience, note: "Light, intense, funny, thought-provoking…" },
  { label: "Release era", value: WEIGHTS.releaseYear, note: "Classic, retro, modern." },
  { label: "Language", value: WEIGHTS.language, note: "Your preferred language." },
  { label: "Rating & quality", value: WEIGHTS.rating, note: "Higher-rated films rank better." },
  { label: "Runtime suitability", value: WEIGHTS.runtime, note: "Does it fit your time window?" },
];

export function AboutView() {
  const { setView } = useMoodflix();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
          <Sparkles className="h-3.5 w-3.5" />
          Transparent by design
        </div>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">How MoodFlix works</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          MoodFlix is a mood-based movie recommendation engine with a fully
          transparent, rule-based scoring system. No black box — you can see
          exactly why every movie was recommended.
        </p>
      </div>

      {/* Pipeline */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <Card icon={Brain} title="1. You tell us your mood">
          A short, 9-step questionnaire captures your mood, desired experience,
          runtime, era, audience, genres, language, after-feel and optional
          fine-tuning. Skip anything you don't care about.
        </Card>
        <Card icon={Scale} title="2. We apply mandatory filters">
          Age suitability, excluded genres, minimum rating, runtime cap, and
          already-watched titles are filtered out first — never silently ignored.
        </Card>
        <Card icon={Database} title="3. We score the survivors">
          Each remaining movie is scored on 7 weighted criteria, with bonuses
          and penalties for mood conflicts and your desired after-feel.
        </Card>
        <Card icon={Sparkles} title="4. You get 5–10 ranked matches">
          Results are diversified, ranked, and each one ships with a clear,
          personalized explanation of why it fits your answers.
        </Card>
      </section>

      {/* Weights */}
      <section className="mt-12">
        <h2 className="text-xl font-bold sm:text-2xl">The scoring weights</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Configurable in a single documented file
          (<code className="rounded bg-muted px-1.5 py-0.5 text-xs">src/lib/recommendation/weights.ts</code>).
          They always sum to 100%.
        </p>
        <div className="mt-5 overflow-hidden rounded-2xl border border-border/60 bg-card/40">
          {WEIGHT_ROWS.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center gap-4 p-4 ${i !== 0 ? "border-t border-border/50" : ""}`}
            >
              <div className="w-44 shrink-0">
                <div className="text-sm font-medium">{row.label}</div>
                <div className="text-xs text-muted-foreground">{row.note}</div>
              </div>
              <div className="flex-1">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500"
                    style={{ width: `${row.value * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
                {Math.round(row.value * 100)}%
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Data & privacy */}
      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <Card icon={Database} title="Movie data">
          By default, MoodFlix runs on a curated local sample of {`50+`} films
          across 9 languages and 7 decades, so it works fully offline. When a
          TMDB API key is configured, real metadata (posters, ratings, cast,
          trailers) is fetched and cached. Ratings in sample mode are
          approximate and clearly labeled.
        </Card>
        <Card icon={ShieldCheck} title="Privacy & safety">
          Passwords are hashed with scrypt (never logged). Guests can use the
          questionnaire without an account. Watchlists and watched history are
          private per user. We never claim a movie is available on a streaming
          service unless that's verified through a supported source.
        </Card>
      </section>

      {/* Tech */}
      <section className="mt-12 rounded-2xl border border-border/60 bg-card/40 p-6">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-amber-300" />
          <h2 className="text-lg font-semibold">Built with</h2>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {["Next.js 16", "TypeScript", "Prisma + SQLite", "NextAuth", "Tailwind CSS", "shadcn/ui", "TanStack Query", "Zustand", "Framer Motion"].map((t) => (
            <span key={t} className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs">
              {t}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          The original spec called for React + Vite and Django. This
          implementation delivers the same functionality as a single, cohesive
          Next.js full-stack app — frontend, API routes, database, and the
          rule-based engine all in one project, which is easier to run and
          review for a portfolio.
        </p>
      </section>

      {/* CTA */}
      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <Button
          size="lg"
          onClick={() => setView("questionnaire")}
          className="gap-2 bg-gradient-to-r from-amber-400 to-rose-500 text-black hover:opacity-90 hover:text-black"
        >
          <Sparkles className="h-4 w-4" /> Try it now
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Github className="h-3.5 w-3.5" />
          Beginner-friendly, well-commented source — ideal for a GitHub portfolio.
        </p>
      </div>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Brain;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400/20 to-rose-500/20 text-amber-300">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
