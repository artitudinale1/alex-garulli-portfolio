export type PublicAgentDraft = {
  title: string;
  slug: string;
  summary: string;
  body: string;
  category: string;
  status: string;
};

export type PublicAgentRun = {
  requestedModel: string;
  models: string[];
  apiCalls: number;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  status: "completed" | "incomplete";
  incompleteReason: string | null;
  stoppedAtCallLimit: boolean;
  finalText: string;
  draft: PublicAgentDraft | null;
  validation: {
    article: { ok: true } | { ok: false; error: string } | null;
    images: { ok: true } | { ok: false; message: string } | null;
  };
  persistence: { persisted: boolean; message: string; uncertain: boolean };
};

export type LabExecution =
  | { phase: "idle" }
  | { phase: "running" }
  | { phase: "rejected"; message: string }
  | { phase: "network"; message: string }
  | { phase: "uncertain"; message: string }
  | { phase: "incomplete"; reason: string; persistence: string }
  | { phase: "validation"; message: string; modelFinished: boolean; persistence: string }
  | { phase: "finished"; modelFinished: boolean; persisted: boolean; persistence: string };

export function persistenceIsUncertain(message: string): boolean {
  return /may or may not|may remain/i.test(message);
}

export function publicErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "The run could not be completed.";
  if (/sk-|bearer\s+|api[_-]?secret|private[_-]?key|BEGIN /i.test(message)) return "The run could not be completed.";
  return message.slice(0, 500);
}

export function executionFromRun(run: PublicAgentRun): LabExecution {
  if (run.persistence.uncertain || persistenceIsUncertain(run.persistence.message)) {
    return { phase: "uncertain", message: run.persistence.message };
  }
  if (run.status !== "completed" || run.stoppedAtCallLimit) {
    return {
      phase: "incomplete",
      reason: run.incompleteReason ?? (run.stoppedAtCallLimit ? "The run reached the model-call limit." : "The model response was incomplete."),
      persistence: run.persistence.message,
    };
  }
  if (run.validation.article && !run.validation.article.ok) {
    return {
      phase: "validation",
      message: run.validation.article.error,
      modelFinished: true,
      persistence: run.persistence.message,
    };
  }
  if (run.validation.images && !run.validation.images.ok) {
    return {
      phase: "validation",
      message: run.validation.images.message,
      modelFinished: true,
      persistence: run.persistence.message,
    };
  }
  return {
    phase: "finished",
    modelFinished: true,
    persisted: run.persistence.persisted,
    persistence: run.persistence.message,
  };
}

export function submissionInProgress(phase: LabExecution["phase"]): boolean {
  return phase === "running";
}
