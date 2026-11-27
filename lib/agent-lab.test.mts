import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { assessAgentSubmission, contentLengthError, MAX_AGENT_BYTES, submissionFromForm } from "./agent/form.ts";
import { handleAgentPost, sanitizeAgentEvent, type AgentRunner } from "./agent/http.ts";
import { executionFromRun, publicErrorMessage, submissionInProgress, validationProgressMessage, type PublicAgentRun } from "./agent/outcome.ts";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

const text = {
  mode: "generate",
  instructions: "",
  body: "",
  prompt: "Write about Beta.",
  length: "short",
  context: "",
  category: "CATS",
  target: "",
  architecture: "function-calling",
};

function finishedRun(overrides: Partial<PublicAgentRun> = {}): PublicAgentRun {
  return {
    requestedModel: "gpt-test",
    models: ["gpt-test"],
    apiCalls: 2,
    inputTokens: 30,
    outputTokens: 80,
    durationMs: 1500,
    status: "completed",
    incompleteReason: null,
    stoppedAtCallLimit: false,
    finalText: "Draft stored.",
    draft: {
      title: "Beta",
      slug: "beta",
      summary: "A cat.",
      body: "Beta watches the keyboard.",
      category: "CATS",
      status: "draft",
    },
    validation: { article: { ok: true }, images: { ok: true } },
    persistence: { persisted: false, message: "Mock target kept the validated draft in memory.", uncertain: false },
    ...overrides,
  };
}

describe("agent form validation", () => {
  it("defaults to mock function calling and rejects Code Mode", () => {
    const accepted = assessAgentSubmission(text, { cover: null, images: [] });
    assert.equal(accepted.ok, true);
    if (!accepted.ok) return;
    assert.equal(accepted.value.target, "mock");
    assert.equal(accepted.value.architecture, "function-calling");
    assert.equal(accepted.value.request.mode, "generate");
    if (accepted.value.request.mode === "generate") assert.equal(accepted.value.request.length, "short");

    const rejected = assessAgentSubmission({ ...text, architecture: "code-mode" }, { cover: null, images: [] });
    assert.equal(rejected.ok, false);
  });

  it("requires the existing article and generate prompt", () => {
    const missingBody = assessAgentSubmission(
      { ...text, mode: "existing", instructions: "Propose a title.", body: "  " },
      { cover: null, images: [] },
    );
    assert.equal(missingBody.ok, false);
    const missingPrompt = assessAgentSubmission({ ...text, prompt: " " }, { cover: null, images: [] });
    assert.equal(missingPrompt.ok, false);
  });

  it("checks image type, descriptions, count, and the 4 MB request limit", async () => {
    const bad = assessAgentSubmission(text, {
      cover: null,
      images: [{ filename: "notes.txt", bytes: Uint8Array.from([1, 2, 3]) }],
    });
    assert.equal(bad.ok, false);

    const undescribed = assessAgentSubmission(text, {
      cover: null,
      images: [{ filename: "beta.jpg", bytes: jpeg }],
    });
    assert.equal(undescribed.ok, false);

    const tooMany = assessAgentSubmission(text, {
      cover: null,
      images: Array.from({ length: 6 }, () => ({ filename: "beta.jpg", bytes: jpeg, description: "Beta" })),
    });
    assert.equal(tooMany.ok, false);

    assert.equal(contentLengthError(String(MAX_AGENT_BYTES + 1)), "The article and images together must be 4 MB or smaller.");

    const form = new FormData();
    form.set("mode", "existing");
    form.set("instructions", "Propose a title.");
    form.set("body", "Beta\n");
    form.set("cover", new File([jpeg], "cover.jpeg", { type: "image/jpeg" }));
    const parsed = await submissionFromForm(form);
    assert.equal(parsed.ok, true);
    if (parsed.ok) assert.equal(parsed.value.cover?.filename, "cover.jpeg");
  });
});

describe("agent execution states", () => {
  it("separates a finished model run from remote persistence", () => {
    const mock = executionFromRun(finishedRun());
    assert.deepEqual(mock, {
      phase: "finished",
      modelFinished: true,
      persisted: false,
      persistence: "Mock target kept the validated draft in memory.",
    });

    const stored = executionFromRun(
      finishedRun({ persistence: { persisted: true, message: "Stored remote draft id=1 slug=beta status=DRAFT", uncertain: false } }),
    );
    assert.equal(stored.phase, "finished");
    if (stored.phase === "finished") assert.equal(stored.persisted, true);
  });

  it("reports incomplete runs, validation failures, and uncertain persistence", () => {
    const incomplete = executionFromRun(
      finishedRun({ status: "incomplete", incompleteReason: "max_output_tokens", persistence: { persisted: false, message: "The agent execution did not finish. The draft was not sent to the blog.", uncertain: false } }),
    );
    assert.equal(incomplete.phase, "incomplete");

    const invalid = executionFromRun(
      finishedRun({ validation: { article: { ok: false, error: "The article is too long." }, images: null } }),
    );
    assert.equal(invalid.phase, "validation");

    const uncertain = executionFromRun(
      finishedRun({
        persistence: {
          persisted: false,
          message: "createPost timed out. The draft may or may not exist remotely. The mutation was not retried.",
          uncertain: false,
        },
      }),
    );
    assert.equal(uncertain.phase, "uncertain");
    assert.equal(submissionInProgress("running"), true);
    assert.equal(submissionInProgress("finished"), false);
    assert.equal(publicErrorMessage(new Error("rejected sk-test-secret")), "The run could not be completed.");
    assert.equal(validationProgressMessage(null), "Validation skipped — no draft created");
    assert.equal(validationProgressMessage({ ok: false, error: "The article is too long." }), "Validation recorded.");
  });
});

describe("agent route", () => {
  it("blocks anonymous and forbidden accounts before running the engine", async () => {
    let calls = 0;
    const run: AgentRunner = async () => {
      calls += 1;
      return finishedRun();
    };
    const body = new FormData();
    body.set("mode", "generate");
    body.set("prompt", "Write about Beta.");
    const forbidden = await handleAgentPost(new Request("http://localhost/api/admin/agent", { method: "POST", body }), {
      access: "forbidden",
      run,
    });
    assert.equal(forbidden.status, 403);
    const anonymous = await handleAgentPost(new Request("http://localhost/api/admin/agent", { method: "POST", body: new FormData() }), {
      access: "anonymous",
      run,
    });
    assert.equal(anonymous.status, 401);
    assert.equal(calls, 0);
  });

  it("streams a mocked engine result without a publish action", async () => {
    const run: AgentRunner = async (input) => {
      assert.equal(input.target, "mock");
      input.onEvent({ type: "model", call: 1, model: "gpt-test", inputTokens: 10, outputTokens: 4, arguments: "secret-args", baseURL: "https://example.test" });
      input.onEvent({ type: "tool", phase: "result", name: "createDraft", callId: "call-1", arguments: "{\"body\":\"hidden\"}" });
      input.onEvent({ type: "persistence", persisted: false, message: "Mock target kept the validated draft in memory." });
      return finishedRun();
    };
    const form = new FormData();
    form.set("mode", "generate");
    form.set("prompt", "Write about Beta.");
    form.set("length", "medium");
    form.set("category", "CATS");
    const response = await handleAgentPost(new Request("http://localhost/api/admin/agent", { method: "POST", body: form }), {
      access: "editor",
      run,
    });
    assert.equal(response.headers.get("content-type"), "application/x-ndjson; charset=utf-8");
    const events = (await response.text()).trim().split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
    assert.equal(events.some((event) => "arguments" in event || "baseURL" in event), false);
    assert.equal(events.some((event) => event.type === "tool" && event.name === "createDraft"), true);
    const done = events.at(-1);
    assert.equal(done?.type, "done");
    const result = done?.result as PublicAgentRun;
    assert.equal(result.persistence.persisted, false);
    assert.equal(JSON.stringify(result).includes("publish"), false);
    assert.equal(sanitizeAgentEvent({ type: "config", requestedModel: "gpt-test", target: "mock", baseURL: "https://example.test" })?.baseURL, undefined);
  });

  it("turns an engine failure into a terminal error event", async () => {
    const response = await handleAgentPost(requestFor("generate"), {
      access: "editor",
      run: async () => {
        throw new Error("The blog API did not respond.");
      },
    });
    const events = (await response.text()).trim().split("\n").map((line) => JSON.parse(line) as { type: string; message?: string });
    assert.deepEqual(events.at(-1), { type: "error", message: "The blog API did not respond.", uncertain: false });
  });
});

describe("agent navigation", () => {
  it("shows the lab link only to an authenticated administrator", () => {
    const frame = readFileSync(new URL("../components/blog-editor-frame.tsx", import.meta.url), "utf8");
    const home = readFileSync(new URL("../components/home-page.tsx", import.meta.url), "utf8");
    const editor = readFileSync(new URL("../components/blog-editor.tsx", import.meta.url), "utf8");
    const lab = readFileSync(new URL("../components/agent-lab.tsx", import.meta.url), "utf8");
    assert.match(frame, /administrator/);
    assert.match(frame, /Agentic Lab/);
    assert.equal(home.includes("Agentic"), false);
    assert.equal(editor.includes("publishArticle"), true);
    assert.equal(lab.includes("publishArticle"), false);
    assert.equal(lab.includes("unpublish"), false);
    assert.match(lab, /\/admin\/blog/);
  });
});

function requestFor(mode: "generate"): Request {
  const form = new FormData();
  form.set("mode", mode);
  form.set("prompt", "Write about Beta.");
  return new Request("http://localhost/api/admin/agent", { method: "POST", body: form });
}
