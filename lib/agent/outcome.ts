export type PublicAgentDraft = {
  title: string;
  slug: string;
  summary: string;
  body: string;
  category: string;
  status: string;
};

export type PublicValidationIssue = {
  code: string;
  message: string;
  length?: number;
  maxLength?: number;
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
    article: { ok: true } | { ok: false; error: string; issues?: PublicValidationIssue[] } | null;
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
  | { phase: "finished"; modelFinished: boolean; persisted: boolean; persistence: string; validation: "passed" | "skipped" };

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
  const failure = validationFailureDetail(run.validation.article, run.validation.images);
  if (failure) {
    return {
      phase: "validation",
      message: failure,
      modelFinished: true,
      persistence: run.persistence.message,
    };
  }
  return {
    phase: "finished",
    modelFinished: true,
    persisted: run.persistence.persisted,
    persistence: run.persistence.message,
    validation: run.validation.article == null ? "skipped" : "passed",
  };
}

export function submissionInProgress(phase: LabExecution["phase"]): boolean {
  return phase === "running";
}

export function validationProgressMessage(article: unknown, images?: unknown): string {
  if (article == null) return "Validation skipped — no draft created";
  const failure = validationFailureDetail(article, images);
  return failure ? `Validation failed: ${failure}` : "Validation passed.";
}

function validationFailureDetail(article: unknown, images: unknown): string | null {
  const parts: string[] = [];
  const articleMessage = articleFailure(article);
  if (articleMessage) parts.push(articleMessage);
  const imageMessage = imageFailure(images);
  if (imageMessage) parts.push(imageMessage);
  return parts.length > 0 ? parts.join(" ") : null;
}

function articleFailure(article: unknown): string | null {
  if (!isRecord(article) || article.ok !== false) return null;
  const issues = Array.isArray(article.issues)
    ? article.issues.flatMap((issue) => {
        if (!isRecord(issue) || typeof issue.message !== "string" || issue.message.trim() === "") return [];
        return [issue.message];
      })
    : [];
  if (issues.length > 0) return issues.join(" ");
  return typeof article.error === "string" && article.error.trim() !== "" ? article.error : "Article failed validation.";
}

function imageFailure(images: unknown): string | null {
  if (!isRecord(images) || images.ok !== false) return null;
  return typeof images.message === "string" && images.message.trim() !== "" ? images.message : "Image validation failed.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
