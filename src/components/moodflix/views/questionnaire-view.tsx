"use client";
/**
 * MoodFlix — multi-step Questionnaire view.
 *
 * 9 steps matching the product brief, with a progress indicator, jump-to
 * step dots, back/skip navigation, and inline validation hints. On the final
 * step it submits the answers to /api/recommendations and hands off to the
 * Results view.
 */
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMoodflix } from "@/lib/store/moodflix-store";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  MOOD_QUESTION_OPTIONS,
  EXPERIENCE_QUESTION_OPTIONS,
  RUNTIME_OPTIONS,
  ERA_OPTIONS,
  AUDIENCE_OPTIONS,
  GENRE_OPTIONS,
  LANGUAGE_OPTIONS,
  AFTER_FEEL_QUESTION_OPTIONS,
} from "@/lib/data/options";
import { MOOD_MAP } from "@/lib/recommendation/mood-map";
import type { MoodKey, ExperienceKey, RuntimePref, EraPref, AudiencePref, AfterFeelKey } from "@/lib/recommendation/types";

const TOTAL_STEPS = 9;

export function QuestionnaireView() {
  const { answers, setAnswer, patchAnswers, resetAnswers, setResults, setView, setLoading, setError, clearExclusions } =
    useMoodflix();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { status } = useSession();

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const submit = async () => {
    setSubmitting(true);
    setLoading(true);
    setError(null);
    try {
      clearExclusions();
      const res = await api.recommend({
        answers,
        save: status === "authenticated",
      });
      setResults(res);
      setView("results");
      if (res.recommendations.length === 0) {
        toast.info("No matches — try relaxing a filter or two.");
      } else {
        toast.success(`Found ${res.recommendations.length} matches for you.`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else submit();
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const canProceed = useMemo(() => {
    // Q1 moods can be empty (skippable). Everything else has defaults.
    if (step === 0) return true;
    if (step === 5) return true; // genres optional
    return true;
  }, [step]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header + progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Let's find your movie</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Step {step + 1} of {TOTAL_STEPS} · skip anything you don't care about.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetAnswers();
              setStep(0);
            }}
            className="gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
        <Progress value={progress} className="mt-4 h-1.5" />
        {/* step dots */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-7 bg-amber-400" : i < step ? "w-4 bg-amber-500/50" : "w-4 bg-border"
              )}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[20rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <StepContent step={step} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={back} disabled={step === 0} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {step < TOTAL_STEPS - 1 && (
            <Button variant="outline" onClick={next} disabled={!canProceed} className="gap-1.5">
              Skip
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={next}
            disabled={!canProceed || submitting}
            className="gap-2 bg-gradient-to-r from-amber-400 to-rose-500 text-black hover:opacity-90 hover:text-black"
          >
            {step === TOTAL_STEPS - 1 ? (
              <>
                <Sparkles className="h-4 w-4" />
                {submitting ? "Matching…" : "Get my recommendations"}
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- step content --------------------------- */

function StepContent({ step }: { step: number }) {
  const { answers, setAnswer, patchAnswers } = useMoodflix();

  switch (step) {
    case 0:
      return (
        <Step
          title="What's your mood right now?"
          subtitle="Pick one or more — we'll match films to how you feel."
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            {MOOD_QUESTION_OPTIONS.map((opt) => {
              const selected = answers.moods.includes(opt.key as MoodKey);
              return (
                <OptionCard
                  key={opt.key}
                  selected={selected}
                  onClick={() => {
                    const next = selected
                      ? answers.moods.filter((m) => m !== opt.key)
                      : [...answers.moods, opt.key as MoodKey];
                    setAnswer("moods", next);
                  }}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {MOOD_MAP[opt.key].genres.slice(0, 2).join(" · ") || "Surprise mix"}
                  </span>
                </OptionCard>
              );
            })}
          </div>
          {answers.moods.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              No mood selected — that's fine, we'll lean on your genre &amp; experience choices.
            </p>
          )}
        </Step>
      );

    case 1:
      return (
        <Step
          title="What kind of movie experience do you want?"
          subtitle="Choose the vibe you're chasing tonight."
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            {EXPERIENCE_QUESTION_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.key}
                selected={answers.experience === opt.key}
                onClick={() => setAnswer("experience", opt.key as ExperienceKey)}
              >
                <span className="font-medium">{opt.label}</span>
              </OptionCard>
            ))}
          </div>
        </Step>
      );

    case 2:
      return (
        <Step title="How much time do you have?" subtitle="We'll use real runtimes to filter.">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {RUNTIME_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.key}
                selected={answers.runtime === opt.key}
                onClick={() => setAnswer("runtime", opt.key as RuntimePref)}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.hint}</span>
              </OptionCard>
            ))}
          </div>
        </Step>
      );

    case 3:
      return (
        <Step title="When would you like the movie to have been released?" subtitle="Pick an era — or any year.">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {ERA_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.key}
                selected={answers.era === opt.key}
                onClick={() => setAnswer("era", opt.key as EraPref)}
              >
                <span className="font-medium">{opt.label}</span>
              </OptionCard>
            ))}
          </div>
        </Step>
      );

    case 4:
      return (
        <Step
          title="Who is watching?"
          subtitle="We apply age-suitability filters conservatively. We never assume every rated movie suits every viewer."
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            {AUDIENCE_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.key}
                selected={answers.audience === opt.key}
                onClick={() => setAnswer("audience", opt.key as AudiencePref)}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.hint}</span>
              </OptionCard>
            ))}
          </div>
          {answers.audience !== "no_preference" && (
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/80">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Strict age filtering is enforced — movies with missing or
              unsuitable certifications are excluded for children &amp; family.
            </p>
          )}
        </Step>
      );

    case 5:
      return (
        <Step title="Preferred genres" subtitle="Select any that appeal — or leave empty for “any genre”.">
          <div className="flex flex-wrap gap-2">
            {GENRE_OPTIONS.map((g) => {
              const selected = answers.genres.includes(g);
              return (
                <button
                  key={g}
                  onClick={() => {
                    const next = selected
                      ? answers.genres.filter((x) => x !== g)
                      : [...answers.genres, g];
                    setAnswer("genres", next);
                  }}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    selected
                      ? "border-amber-400 bg-amber-400/15 text-amber-200"
                      : "border-border bg-card/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {selected && <Check className="mr-1 inline h-3 w-3" />}
                  {g}
                </button>
              );
            })}
          </div>
          {answers.genres.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">No genre selected — we'll consider all genres.</p>
          )}
        </Step>
      );

    case 6:
      return (
        <Step title="Preferred language" subtitle="From English to Korean, Japanese, and Indian cinema.">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {LANGUAGE_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.key}
                selected={answers.language === opt.key}
                onClick={() => setAnswer("language", opt.key)}
              >
                <span className="font-medium">{opt.label}</span>
                {opt.code !== "any" && opt.code !== "other" && (
                  <span className="text-xs uppercase text-muted-foreground">{opt.code}</span>
                )}
              </OptionCard>
            ))}
          </div>
        </Step>
      );

    case 7:
      return (
        <Step title="How do you want the movie to make you feel afterward?" subtitle="The after-feel is a bonus signal in our scoring.">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {AFTER_FEEL_QUESTION_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.key}
                selected={answers.afterFeel === opt.key}
                onClick={() => setAnswer("afterFeel", opt.key as AfterFeelKey)}
              >
                <span className="font-medium">{opt.label}</span>
              </OptionCard>
            ))}
          </div>
        </Step>
      );

    case 8:
      return (
        <Step title="Any additional preferences?" subtitle="All optional — fine-tune the match.">
          <div className="space-y-6">
            {/* Min rating */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Minimum rating</label>
                <Badge variant="secondary">{answers.minRating.toFixed(1)}+</Badge>
              </div>
              <Slider
                value={[answers.minRating]}
                min={0}
                max={9}
                step={0.5}
                onValueChange={(v) => setAnswer("minRating", v[0])}
                className="mt-3"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Filters out movies below this score. Hard filter, never ignored.
              </p>
            </div>

            {/* Exclude genres */}
            <div>
              <label className="text-sm font-medium">Exclude genres</label>
              <p className="text-xs text-muted-foreground">Never suggest these, even if other filters match.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {GENRE_OPTIONS.map((g) => {
                  const selected = answers.excludeGenres.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => {
                        const next = selected
                          ? answers.excludeGenres.filter((x) => x !== g)
                          : [...answers.excludeGenres, g];
                        setAnswer("excludeGenres", next);
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        selected
                          ? "border-rose-400 bg-rose-400/15 text-rose-200"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {selected && "✕ "}
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleRow
                label="Exclude movies I've watched"
                description="Skip films already in your watched list."
                checked={answers.excludeWatched}
                onCheckedChange={(v) => patchAnswers({ excludeWatched: v })}
              />
              <ToggleRow
                label="Include sequels"
                description="Allow franchise follow-ups in results."
                checked={answers.includeSequels}
                onCheckedChange={(v) => patchAnswers({ includeSequels: v })}
              />
            </div>

            {/* Free text */}
            <div>
              <label className="text-sm font-medium">Something specific?</label>
              <p className="text-xs text-muted-foreground">
                e.g. “a movie like Interstellar but shorter”. We boost similar titles and respect a “shorter” cap.
              </p>
              <Textarea
                value={answers.freeText}
                onChange={(e) => setAnswer("freeText", e.target.value.slice(0, 300))}
                placeholder="Optional…"
                className="mt-2 resize-none"
                rows={2}
              />
            </div>
          </div>
        </Step>
      );

    default:
      return null;
  }
}

/* --------------------------- shared bits --------------------------- */

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all",
        selected
          ? "border-amber-400/70 bg-amber-400/10 mf-glow"
          : "border-border bg-card/40 hover:border-border hover:bg-card/70"
      )}
    >
      <span className="flex flex-col gap-0.5">{children}</span>
      <span
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors",
          selected ? "border-amber-400 bg-amber-400 text-black" : "border-border"
        )}
      >
        {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card/40 p-3.5">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
