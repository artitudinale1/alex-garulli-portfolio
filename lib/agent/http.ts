import { contentLengthError, submissionFromForm, type AgentImageInput, type AgentRequestInput, type AgentTarget } from "./form.ts";
import { persistenceIsUncertain, publicErrorMessage, type PublicAgentRun } from "./outcome.ts";

export type AgentAccess = "unconfigured" | "anonymous" | "forbidden" | "editor";

export type AgentRunnerInput = {
  target: AgentTarget;
  request: AgentRequestInput;
  cover?: AgentImageInput;
  images: AgentImageInput[];
  onEvent: (event: Record<string, unknown>) => void;
};

export type AgentRunner = (input: AgentRunnerInput) => Promise<PublicAgentRun>;

const DENIED: Record<Exclude<AgentAccess, "editor">, { status: 401 | 403; error: string }> = {
  forbidden: { status: 403, error: "This GitHub account cannot use the agent." },
  anonymous: { status: 401, error: "Sign in to use the agent." },
  unconfigured: { status: 401, error: "Sign in to use the agent." },
};

export async function handleAgentPost(
  request: Request,
  options: { access: AgentAccess; run: AgentRunner },
): Promise<Response> {
  if (options.access !== "editor") {
    const denied = DENIED[options.access];
    return json({ error: denied.error }, denied.status);
  }

  const tooLarge = contentLengthError(request.headers.get("content-length"));
  if (tooLarge) return json({ error: tooLarge }, 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "The request could not be read." }, 400);
  }

  const submission = await submissionFromForm(form);
  if (!submission.ok) return json({ error: submission.error }, 400);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        const result = await options.run({
          target: submission.value.target,
          request: submission.value.request,
          images: submission.value.images,
          ...(submission.value.cover ? { cover: submission.value.cover } : {}),
          onEvent: (event) => {
            const safe = sanitizeAgentEvent(event);
            if (safe) send(safe);
          },
        });
        send({ type: "done", result: publicRun(result) });
      } catch (error) {
        const message = publicErrorMessage(error);
        send({ type: "error", message, uncertain: persistenceIsUncertain(message) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function sanitizeAgentEvent(event: Record<string, unknown>): Record<string, unknown> | null {
  const type = event.type;
  if (type === "config") {
    return {
      type,
      requestedModel: text(event.requestedModel),
      target: text(event.target),
      ...(typeof event.mode === "string" ? { mode: event.mode } : {}),
      ...(typeof event.category === "string" ? { category: event.category } : {}),
    };
  }
  if (type === "model") {
    return {
      type,
      call: numberField(event.call),
      model: text(event.model),
      inputTokens: numberField(event.inputTokens),
      outputTokens: numberField(event.outputTokens),
    };
  }
  if (type === "tool") {
    return { type, phase: text(event.phase), name: text(event.name), callId: text(event.callId) };
  }
  if (type === "usage") {
    return {
      type,
      apiCalls: numberField(event.apiCalls),
      inputTokens: numberField(event.inputTokens),
      outputTokens: numberField(event.outputTokens),
    };
  }
  if (type === "incomplete") return { type, reason: text(event.reason) };
  if (type === "result") {
    return {
      type,
      status: event.status === "incomplete" ? "incomplete" : "completed",
      incompleteReason: typeof event.incompleteReason === "string" ? event.incompleteReason : null,
      stoppedAtCallLimit: event.stoppedAtCallLimit === true,
    };
  }
  if (type === "validation") return { type, article: event.article ?? null, images: event.images ?? null };
  if (type === "persistence") {
    return { type, persisted: event.persisted === true, message: text(event.message) };
  }
  if (type === "duration") return { type, milliseconds: numberField(event.milliseconds) };
  return null;
}

export function publicRun(result: PublicAgentRun): PublicAgentRun {
  const persistence = {
    persisted: result.persistence.persisted === true,
    message: result.persistence.message,
    uncertain: result.persistence.uncertain === true || persistenceIsUncertain(result.persistence.message),
  };
  return {
    requestedModel: result.requestedModel,
    models: result.models.filter((model) => typeof model === "string"),
    apiCalls: result.apiCalls,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    durationMs: result.durationMs,
    status: result.status === "incomplete" ? "incomplete" : "completed",
    incompleteReason: result.incompleteReason,
    stoppedAtCallLimit: result.stoppedAtCallLimit === true,
    finalText: result.finalText,
    draft: result.draft
      ? {
          title: result.draft.title,
          slug: result.draft.slug,
          summary: result.draft.summary,
          body: result.draft.body,
          category: result.draft.category,
          status: result.draft.status,
        }
      : null,
    validation: {
      article: result.validation.article,
      images: result.validation.images,
    },
    persistence,
  };
}

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberField(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
