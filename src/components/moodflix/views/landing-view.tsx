"use client";
/**
 * MoodFlix — Landing view.
 * Hero, "how it works", and a sample of movies to demonstrate the experience.
 */
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Brain, SlidersHorizontal, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoviePoster } from "@/components/moodflix/movie/movie-poster";
import { useMoodflix } from "@/lib/store/moodflix-store";
import { SAMPLE_MOVIES } from "@/lib/data/sample-movies";
import { MovieCard } from "@/components/moodflix/movie/movie-card";

const HERO_SAMPLES = [
  "mf-3", // Inception
  "mf-8", // Spirited Away
  "mf-9", // Parasite
  "mf-44", // Premam
  "mf-52", // Your Name
  "mf-25", // Endgame
].map((id) => SAMPLE_MOVIES.find((m) => m.externalId === id)!).filter(Boolean);

const SAMPLE_GRID = [
  "mf-1", "mf-7", "mf-13", "mf-19", "mf-22", "mf-49", "mf-50", "mf-10",
].map((id) => SAMPLE_MOVIES.find((m) => m.externalId === id)!).filter(Boolean);

const STEPS = [
  {
    icon: Brain,
    title: "Tell us your mood",
    body: "Pick how you feel and what kind of experience you want. No endless scrolling — just a friendly, guided questionnaire.",
  },
  {
    icon: SlidersHorizontal,
    title: "Tune the details",
    body: "Set your runtime, era, language, audience, and genre preferences. Skip anything you don't care about.",
  },
  {
    icon: Film,
    title: "Get matched movies",
    body: "Our transparent scoring engine ranks 5–10 films and explains exactly why each one fits your answers.",
  },
];

export function LandingView() {
  const { setView } = useMoodflix();
  const start = () => setView("questionnaire");

  return (
    <div className="space-y-20 pb-4">
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-12 sm:px-6 md:grid-cols-2 md:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              Mood-based movie recommendations
            </div>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Find the movie that
              <br />
              <span className="mf-text-gradient">fits your mood.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
              Not sure what to watch? Answer a short, friendly questionnaire
              about how you feel and what you're in the mood for. MoodFlix
              matches you with 5–10 films — each with a clear reason why.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={start}
                className="gap-2 bg-gradient-to-r from-amber-400 to-rose-500 text-black hover:opacity-90 hover:text-black"
              >
                <Sparkles className="h-4 w-4" />
                Find My Movie
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => setView("about")}>
                How it works
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No sign-up needed to get recommendations. Free, transparent, and
              powered by a rule-based scoring engine.
            </p>
          </motion.div>

          {/* Floating sample posters */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative mx-auto hidden h-[28rem] w-full max-w-md md:block"
          >
            <div className="grid grid-cols-3 gap-3">
              {HERO_SAMPLES.slice(0, 6).map((mv, i) => (
                <div
                  key={mv.externalId}
                  className={`mf-float ${i % 2 === 0 ? "" : "translate-y-6"}`}
                  style={{ animationDelay: `${i * 0.4}s` }}
                >
                  <MoviePoster movie={mv} className="w-full shadow-2xl shadow-black/40" />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-amber-500/10 blur-3xl" />
          </motion.div>
        </div>

        {/* mobile posters */}
        <div className="mx-auto mt-8 flex gap-3 overflow-x-auto px-4 pb-2 md:hidden mf-scroll sm:px-6">
          {HERO_SAMPLES.map((mv) => (
            <div key={mv.externalId} className="w-32 shrink-0">
              <MoviePoster movie={mv} />
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">How MoodFlix works</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Three simple steps from “I don't know what to watch” to a shortlist
            you'll actually enjoy.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl border border-border/60 bg-card/60 p-6"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-400/20 to-rose-500/20 text-amber-300">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Step {i + 1}
              </div>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- Sample movies ---------------- */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">A taste of the catalog</h2>
            <p className="mt-2 text-muted-foreground">
              A few films from the curated sample dataset. The full engine ranks
              across {SAMPLE_MOVIES.length}+ titles.
            </p>
          </div>
          <Button variant="outline" onClick={start} className="gap-1.5 shrink-0">
            Start
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {SAMPLE_GRID.map((mv) => (
            <MovieCard key={mv.externalId} movie={mv} compact />
          ))}
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-card to-background p-8 sm:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Ready to find your next favorite?
            </h2>
            <p className="mt-3 text-muted-foreground">
              It takes under a minute. Tell us your mood, and we'll do the rest.
            </p>
            <Button
              size="lg"
              onClick={start}
              className="mt-6 gap-2 bg-gradient-to-r from-amber-400 to-rose-500 text-black hover:opacity-90 hover:text-black"
            >
              <Sparkles className="h-4 w-4" />
              Find My Movie
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
