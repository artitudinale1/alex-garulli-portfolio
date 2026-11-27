import { runPublishingAgent, type PublishingAgentResult, type PublishingEvent } from "agentic-publishing-lab";
import { handleAgentPost, publicRun, type AgentRunnerInput } from "@/lib/agent/http";
import { editorGate } from "@/lib/blog/editor-api";
import type { PublicAgentRun } from "@/lib/agent/outcome";

export const maxDuration = 300;

export async function POST(request: Request) {
  const gate = await editorGate();
  return handleAgentPost(request, {
    access: gate.state,
    run: (input) => runAgent(input),
  });
}

async function runAgent(input: AgentRunnerInput): Promise<PublicAgentRun> {
  const result = await runPublishingAgent({
    target: input.target,
    request: input.request,
    images: input.images,
    ...(input.cover ? { cover: input.cover } : {}),
    log: () => undefined,
    onEvent: (event: PublishingEvent) => input.onEvent(event as unknown as Record<string, unknown>),
  });
  return publicRun(toPublicRun(result));
}

function toPublicRun(result: PublishingAgentResult): PublicAgentRun {
  return {
    requestedModel: result.requestedModel,
    models: result.models,
    apiCalls: result.apiCalls,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    durationMs: result.durationMs,
    status: result.status,
    incompleteReason: result.incompleteReason,
    stoppedAtCallLimit: result.stoppedAtCallLimit,
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
      article: result.validation.article
        ? result.validation.article.ok
          ? { ok: true }
          : { ok: false, error: result.validation.article.error }
        : null,
      images: result.validation.images
        ? result.validation.images.ok
          ? { ok: true }
          : { ok: false, message: result.validation.images.message }
        : null,
    },
    persistence: {
      persisted: result.persistence.persisted,
      message: result.persistence.message,
      uncertain: false,
    },
  };
}
