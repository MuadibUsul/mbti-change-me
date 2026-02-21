"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { buildWeakHintText } from "@/components/jung16/WeakHint";
import { CompletionTransition } from "@/components/test-ui/CompletionTransition";
import { DimensionHint } from "@/components/test-ui/DimensionHint";
import { DualProgress } from "@/components/test-ui/DualProgress";
import { LikertAxis } from "@/components/test-ui/LikertAxis";
import { WeakFeedback } from "@/components/test-ui/WeakFeedback";
import { useVisualSystem } from "@/components/visual-system-provider";

type Choice = {
  label: string;
  value: number;
};

type Question = {
  id: string;
  text: string;
  dimension: "EI" | "SN" | "TF" | "JP";
  direction: number;
  reverseScoring: boolean;
  choices: Choice[];
};

type PersonaModel = {
  archetype: string;
  vulnerableDimension: "EI" | "SN" | "TF" | "JP";
  growthDimension: "EI" | "SN" | "TF" | "JP";
  stableDimension: "EI" | "SN" | "TF" | "JP";
  contradictionIndex: number;
  reflectionDepth: number;
  confidence: number;
  narrativeSeed: string;
};

type QuestionBankInfo = {
  source: string;
  itemCount: number;
  authorityMode: "self-built" | "open";
};

type AnswerState = {
  choice: number;
  elapsedMs?: number;
};

type Dimension = Question["dimension"];

const CHOICE_TO_VALUE: Record<number, number> = { 1: -2, 2: -1, 3: 0, 4: 1, 5: 2 };

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function clampDimension(value: number) {
  return Math.max(-1, Math.min(1, value));
}

function getDimensionScore(
  questions: Question[],
  answers: Record<string, AnswerState>,
  dimension: Dimension,
  normalizeByTotal = true,
) {
  let total = 0;
  let answered = 0;
  let score = 0;

  questions.forEach((question) => {
    if (question.dimension !== dimension) return;
    total += 1;
    const answer = answers[question.id];
    if (!answer) return;
    const base = CHOICE_TO_VALUE[answer.choice] ?? 0;
    const direction = question.direction * (question.reverseScoring ? -1 : 1);
    score += base * direction;
    answered += 1;
  });

  const divider = normalizeByTotal ? total : answered;
  if (!divider) return 0;
  return clampDimension(score / (divider * 2));
}

function getDimensionProgress(questions: Question[], answers: Record<string, AnswerState>, dimension: Dimension) {
  const total = questions.filter((question) => question.dimension === dimension).length;
  if (!total) return 0;
  const done = questions.filter((question) => question.dimension === dimension && answers[question.id]).length;
  return clamp01(done / total);
}

function deriveMbtiFromPreview(preview: Record<Dimension, number>) {
  return `${preview.EI >= 0 ? "E" : "I"}${preview.SN >= 0 ? "S" : "N"}${preview.TF >= 0 ? "T" : "F"}${preview.JP >= 0 ? "J" : "P"}`;
}

function buildWeakFeedback(dimension: Dimension, normalizedScore: number) {
  const pValue = clamp01((normalizedScore + 1) / 2);
  return buildWeakHintText(dimension, pValue);
}

export function TestRunner({ count = 36, guestMode = false }: { count?: number; guestMode?: boolean }) {
  const { profile } = useVisualSystem();
  const router = useRouter();
  const reducedMotion = profile.motionSystem.reducedMotion;
  const questionTransitionMs = reducedMotion ? 1 : 240;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [personaModel, setPersonaModel] = useState<PersonaModel | null>(null);
  const [questionBank, setQuestionBank] = useState<QuestionBankInfo | null>(null);
  const [isGuestSession, setIsGuestSession] = useState<boolean>(guestMode);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [audioReady, setAudioReady] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [pulseChoice, setPulseChoice] = useState<number | null>(null);
  const [axisChoice, setAxisChoice] = useState<number | null>(null);
  const [weakFeedback, setWeakFeedback] = useState<{ id: number; message: string | null }>({ id: 0, message: null });
  const [completionOpen, setCompletionOpen] = useState(false);

  const startedAtRef = useRef<Record<string, number>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextBeatTimeRef = useRef(0);
  const beatStepRef = useRef(0);
  const feedbackTimerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const completionTriggeredRef = useRef(false);
  const answerLockRef = useRef<string | null>(null);

  useEffect(() => {
    const boot = async () => {
      try {
        setLoading(true);
        setError(null);
        if (guestMode && typeof window !== "undefined") {
          const used = window.localStorage.getItem("persona_guest_test_used") === "1";
          if (used) {
            setError("Guest mode can be used once. Sign in to continue and save your timeline.");
            setLoading(false);
            return;
          }
        }

        const response = await fetch("/api/test/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ count }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Failed to initialize test");

        setSessionId(data.sessionId);
        setQuestions(data.questions);
        setPersonaModel(data.personaModel ?? null);
        setQuestionBank(data.questionBank ?? null);
        setIsGuestSession(Boolean(data.guest));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Failed to initialize test");
      } finally {
        setLoading(false);
      }
    };

    void boot();
  }, [count, guestMode]);

  useEffect(() => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;
    if (answers[currentQuestion.id]) return;
    startedAtRef.current[currentQuestion.id] = Date.now();
    answerLockRef.current = null;
    setAxisChoice(null);
  }, [answers, currentIndex, questions]);

  useEffect(() => {
    const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;
    if (!questions.length || allAnswered) return;

    const nextUnansweredIndex = questions.findIndex((question) => !answers[question.id]);
    if (nextUnansweredIndex < 0) return;

    if (nextUnansweredIndex !== currentIndex) {
      setCurrentIndex(nextUnansweredIndex);
    }

    const currentQuestionInList = questions[currentIndex];
    const currentAlreadyAnswered = currentQuestionInList ? Boolean(answers[currentQuestionInList.id]) : false;
    if (currentAlreadyAnswered || transitioning || !currentQuestionInList) {
      setTransitioning(false);
      answerLockRef.current = null;
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    }
  }, [answers, currentIndex, questions, transitioning]);

  useEffect(() => {
    return () => {
      if (schedulerRef.current) window.clearInterval(schedulerRef.current);
      if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      masterGainRef.current = null;
    };
  }, []);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const progressValue = useMemo(
    () => (questions.length ? answeredCount / questions.length : 0),
    [answeredCount, questions.length],
  );
  const isComplete = questions.length > 0 && answeredCount === questions.length;
  const currentQuestion = questions[currentIndex];
  const activeDimension = currentQuestion?.dimension ?? questions[Math.max(questions.length - 1, 0)]?.dimension ?? "EI";
  const dimensionProgress = useMemo(
    () => getDimensionProgress(questions, answers, activeDimension),
    [activeDimension, answers, questions],
  );

  const dimensionPreview = useMemo(
    () => ({
      EI: getDimensionScore(questions, answers, "EI"),
      SN: getDimensionScore(questions, answers, "SN"),
      TF: getDimensionScore(questions, answers, "TF"),
      JP: getDimensionScore(questions, answers, "JP"),
    }),
    [answers, questions],
  );
  const finalMbtiPreview = useMemo(() => deriveMbtiFromPreview(dimensionPreview), [dimensionPreview]);

  const playVoice = (
    ctx: AudioContext,
    output: AudioNode,
    frequency: number,
    startAt: number,
    duration: number,
    volume: number,
    type: OscillatorType,
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startAt);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2800, startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(volume, startAt + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(output);

    osc.start(startAt);
    osc.stop(startAt + duration + 0.04);
  };

  const startMusic = async () => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") await audioCtxRef.current.resume();
      setAudioReady(true);
      return;
    }

    const AudioContextClass =
      typeof window !== "undefined"
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const master = ctx.createGain();
    master.gain.value = 0.0;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -26;
    compressor.knee.value = 18;
    compressor.ratio.value = 2.6;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.28;

    const masterTone = ctx.createBiquadFilter();
    masterTone.type = "lowpass";
    masterTone.frequency.value = 3800;

    const delay = ctx.createDelay(1.2);
    delay.delayTime.value = 0.26;
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.28;
    const delayMix = ctx.createGain();
    delayMix.gain.value = 0.22;

    master.connect(compressor);
    compressor.connect(masterTone);
    masterTone.connect(ctx.destination);
    masterTone.connect(delay);
    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
    delay.connect(delayMix);
    delayMix.connect(ctx.destination);

    const padBus = ctx.createGain();
    padBus.gain.value = 0.55;
    padBus.connect(master);

    const leadBus = ctx.createGain();
    leadBus.gain.value = 0.4;
    leadBus.connect(master);

    const bassBus = ctx.createGain();
    bassBus.gain.value = 0.3;
    bassBus.connect(master);

    const progression = [
      [220.0, 261.63, 329.63],
      [196.0, 246.94, 293.66],
      [174.61, 220.0, 261.63],
      [196.0, 246.94, 329.63],
    ];
    const melodyPattern = [0, 1, 2, 1, 2, 1, 0, 1];
    const beatDur = 60 / 74;

    nextBeatTimeRef.current = ctx.currentTime + 0.08;
    beatStepRef.current = 0;

    const scheduler = () => {
      while (nextBeatTimeRef.current < ctx.currentTime + 0.7) {
        const step = beatStepRef.current;
        const bar = Math.floor(step / 8);
        const chord = progression[bar % progression.length];
        const melodyFreq = chord[melodyPattern[step % melodyPattern.length] % chord.length];
        const t = nextBeatTimeRef.current;

        if (step % 8 === 0) {
          chord.forEach((freq) => playVoice(ctx, padBus, freq, t, beatDur * 3.6, 0.032, "sine"));
          playVoice(ctx, bassBus, chord[0] / 2, t, beatDur * 2.8, 0.028, "triangle");
        }

        playVoice(ctx, leadBus, melodyFreq * (step % 4 === 3 ? 1 : 2), t, beatDur * 0.95, 0.018, "triangle");
        if (step % 2 === 1) {
          playVoice(ctx, leadBus, chord[1] * 2, t + beatDur * 0.16, beatDur * 0.55, 0.01, "sine");
        }

        beatStepRef.current += 1;
        nextBeatTimeRef.current += beatDur;
      }
    };

    scheduler();
    schedulerRef.current = window.setInterval(scheduler, 80);
    master.gain.setTargetAtTime(0.055, ctx.currentTime, 0.55);

    audioCtxRef.current = ctx;
    masterGainRef.current = master;
    setAudioReady(true);
  };

  const toggleMute = () => {
    const gain = masterGainRef.current;
    if (!gain) return;
    const next = !audioMuted;
    gain.gain.setTargetAtTime(next ? 0 : 0.055, gain.context.currentTime, 0.12);
    setAudioMuted(next);
  };

  const gotoNextQuestion = (nextAnswers?: Record<string, AnswerState>) => {
    const sourceAnswers = nextAnswers ?? answers;
    const nextUnansweredIndex = questions.findIndex((question) => !sourceAnswers[question.id]);

    setTransitioning(true);
    if (nextUnansweredIndex >= 0) {
      setCurrentIndex(nextUnansweredIndex);
    } else {
      setCurrentIndex(questions.length);
    }

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = window.setTimeout(() => {
      setTransitioning(false);
      transitionTimerRef.current = null;
    }, questionTransitionMs);
  };

  const onSelect = async (questionId: string, choice: number) => {
    if (transitioning) return;
    if (answers[questionId]) {
      const nextUnansweredIndex = questions.findIndex((question) => !answers[question.id]);
      if (nextUnansweredIndex >= 0 && nextUnansweredIndex !== currentIndex) {
        setCurrentIndex(nextUnansweredIndex);
      }
      setTransitioning(false);
      answerLockRef.current = null;
      return;
    }
    if (answerLockRef.current === questionId) return;
    answerLockRef.current = questionId;

    let releaseLock = true;

    try {
      if (!audioReady) await startMusic();

      const elapsedMs = Date.now() - (startedAtRef.current[questionId] ?? Date.now());
      const nextAnswers: Record<string, AnswerState> = {
        ...answers,
        [questionId]: { choice, elapsedMs },
      };

      setPulseChoice(choice);
      setAxisChoice(choice);
      window.setTimeout(() => setPulseChoice(null), 300);

      setAnswers(nextAnswers);

      const dimension = currentQuestion?.dimension;
      if (dimension) {
        const score = getDimensionScore(questions, nextAnswers, dimension, false);
        const message = buildWeakFeedback(dimension, score);
        const nextId = weakFeedback.id + 1;
        setWeakFeedback({ id: nextId, message });
        if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = window.setTimeout(() => {
          setWeakFeedback({ id: nextId, message: null });
        }, reducedMotion ? 80 : 1200);
      }

      gotoNextQuestion(nextAnswers);
      releaseLock = false;
    } finally {
      if (releaseLock) {
        answerLockRef.current = null;
      }
    }
  };

  const onSubmit = async () => {
    if (!isComplete || !sessionId) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questions: questions.map((question) => ({
            id: question.id,
            dimension: question.dimension,
            direction: question.direction,
            reverseScoring: question.reverseScoring,
          })),
          answers: Object.entries(answers).map(([questionId, item]) => ({
            questionId,
            choice: item.choice,
            elapsedMs: item.elapsedMs,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Submission failed");

      if (data.guest) {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("guest_test_result", JSON.stringify(data));
          window.localStorage.setItem("persona_guest_test_used", "1");
        }
        router.push("/test/guest/result");
        return;
      }

      router.push(`/test/${sessionId}/result`);
    } catch (reason) {
      setCompletionOpen(false);
      setError(reason instanceof Error ? reason.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isComplete || showIntro || completionTriggeredRef.current) return;
    completionTriggeredRef.current = true;
    setCompletionOpen(true);
  }, [isComplete, showIntro]);

  if (loading) {
    return (
        <Card className="p-6">
        <p className="text-sm text-[var(--color-surface)]/80">Generating a new adaptive question set from your history...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="rounded-[var(--radius-md)] border border-rose-300/40 bg-rose-500/10 p-3 text-sm text-rose-100">
          {error}
        </p>
        {error.includes("Guest mode can be used once") ? (
          <p className="mt-3 text-sm text-[var(--color-surface)]/78">
            <Link href="/auth/login" className="underline underline-offset-2">
              Sign in
            </Link>{" "}
            or{" "}
            <Link href="/auth/register" className="underline underline-offset-2">
              Create account
            </Link>
            to keep your personality timeline.
          </p>
        ) : null}
      </Card>
    );
  }

  return (
    <div className="space-y-5 test-page-enhanced">
      {showIntro ? (
        <Card className="p-6 md:p-7">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-surface)]/58">Immersive Session</p>
            <h2 className="text-2xl font-semibold text-[var(--color-surface)]">One Question at a Time - Continuous Music - Soft Dissolve</h2>
            <p className="text-sm text-[var(--color-surface)]/78">
              Each screen shows one question. After answering, the current card dissolves and the next one fades in seamlessly.
            </p>
            {questionBank ? (
              <p className="text-xs text-[var(--color-surface)]/66">
                Question bank: {questionBank.source} ({questionBank.itemCount} items)
              </p>
            ) : null}
            {personaModel ? (
              <p className="text-sm text-[var(--color-surface)]/78">
                Focus archetype: {personaModel.archetype}. {personaModel.narrativeSeed}
              </p>
            ) : null}
            {isGuestSession ? (
              <p className="text-xs text-amber-100/85">Guest session: results are visible once and are not persisted.</p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button
                magnetic
                onClick={async () => {
                  await startMusic();
                  setShowIntro(false);
                }}
              >
                Enter with music
              </Button>
              <Button variant="outline" onClick={() => setShowIntro(false)}>
                Enter muted
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <Card className="p-5 md:p-6" hoverable={false}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-surface)]/58">Deep MBTI Session</p>
                <p className="mt-1 text-sm text-[var(--color-surface)]/76">
                  Progress {answeredCount}/{questions.length}
                </p>
              </div>
              <Button variant="ghost" onClick={toggleMute}>
                {audioMuted ? "Unmute music" : "Mute music"}
              </Button>
            </div>
            <div className="mt-3">
              <DualProgress
                totalProgress={completionOpen ? 1 : progressValue}
                dimensionProgress={isComplete ? 1 : dimensionProgress}
                dimension={activeDimension}
              />
            </div>
          </Card>

          <div className="relative">
            <motion.div
              animate={completionOpen ? { opacity: 0.08, y: 8 } : { opacity: 1, y: 0 }}
              transition={reducedMotion ? { duration: 0.01 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {currentQuestion ? (
                  <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={
                      reducedMotion
                        ? { duration: 0.01 }
                        : {
                            duration: 0.24 / profile.motionSystem.speed,
                            ease: [0.22, 1, 0.36, 1],
                          }
                    }
                    className="relative"
                  >
                    <Card className="relative min-h-[74vh] p-6 md:min-h-[78vh] md:p-8" hoverable={false}>
                      <WeakFeedback id={weakFeedback.id} message={weakFeedback.message} />
                      <div className="flex h-full flex-col justify-between">
                        <div className="space-y-2">
                          <DimensionHint dimension={currentQuestion.dimension} />
                          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-surface)]/58">
                            Question {currentIndex + 1} / {questions.length} - Dimension {currentQuestion.dimension}
                          </p>
                          <h3 className="mt-4 text-2xl leading-relaxed text-[var(--color-surface)] md:text-3xl">
                            {currentQuestion.text}
                          </h3>
                        </div>

                        <div className="mt-10">
                          <div className="grid gap-3 md:grid-cols-5">
                            {currentQuestion.choices.map((choice) => (
                              <motion.button
                                key={choice.value}
                                type="button"
                                disabled={transitioning}
                                onClick={() => onSelect(currentQuestion.id, choice.value)}
                                className="relative overflow-hidden rounded-[var(--radius-md)] border px-3 py-3 text-sm text-[var(--color-surface)] transition disabled:cursor-not-allowed disabled:opacity-80"
                                style={{
                                  borderColor: "color-mix(in oklab, var(--color-surface) 28%, transparent)",
                                  background: "rgba(255,255,255,0.09)",
                                }}
                                whileHover={
                                  reducedMotion
                                    ? undefined
                                    : {
                                        y: -2,
                                        boxShadow: "0 0 0 1px color-mix(in oklab, var(--color-glow) 30%, transparent), 0 10px 22px rgba(0,0,0,0.2)",
                                      }
                                }
                                whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                                transition={reducedMotion ? { duration: 0.01 } : { duration: 0.08, ease: [0.22, 1, 0.36, 1] }}
                              >
                                {pulseChoice === choice.value ? (
                                  <motion.span
                                    className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                                    initial={{ opacity: 0.28, scale: 0 }}
                                    animate={{ opacity: 0, scale: 16 }}
                                    transition={{ duration: reducedMotion ? 0.01 : 0.28, ease: "easeOut" }}
                                    style={{ background: "color-mix(in oklab, var(--color-glow) 28%, transparent)" }}
                                  />
                                ) : null}
                                <span className="relative z-10">{choice.label}</span>
                              </motion.button>
                            ))}
                          </div>
                          <LikertAxis selectedChoice={axisChoice} />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ) : isComplete ? (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={reducedMotion ? { duration: 0.01 } : { duration: 0.24 / profile.motionSystem.speed }}
                  >
                    <Card className="p-6 md:p-8" hoverable={false}>
                      <h3 className="text-2xl font-semibold text-[var(--color-surface)]">All questions completed</h3>
                      <p className="mt-2 text-sm text-[var(--color-surface)]/78">
                        Preparing your result. If the network is slow, you can submit manually.
                      </p>
                      <div className="mt-5 grid gap-3 md:grid-cols-4">
                        <ProgressBar label="EI" value={dimensionPreview.EI} />
                        <ProgressBar label="SN" value={dimensionPreview.SN} />
                        <ProgressBar label="TF" value={dimensionPreview.TF} />
                        <ProgressBar label="JP" value={dimensionPreview.JP} />
                      </div>
                      <div className="mt-6">
                        <Button magnetic onClick={onSubmit} disabled={submitting}>
                          {submitting ? "Submitting..." : "Submit and generate persona"}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="recovering"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={reducedMotion ? { duration: 0.01 } : { duration: 0.2 }}
                  >
                    <Card className="p-6 md:p-8" hoverable={false}>
                      <h3 className="text-xl font-semibold text-[var(--color-surface)]">Recovering question state...</h3>
                      <p className="mt-2 text-sm text-[var(--color-surface)]/74">
                        Please wait a moment. We are restoring your remaining questions.
                      </p>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <CompletionTransition
              open={completionOpen}
              finalType={finalMbtiPreview}
              onDone={() => {
                setCompletionOpen(false);
                void onSubmit();
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
