"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { assessAgentSubmission, MAX_AGENT_IMAGES, type AgentTextFields } from "@/lib/agent/form";
import { executionFromRun, submissionInProgress, type LabExecution, type PublicAgentRun } from "@/lib/agent/outcome";
import { renderMarkdown } from "@/lib/blog/markdown";
import { blogCategories, categoryLabel } from "@/lib/blog/schema";

type ImageRow = { key: string; description: string };

const EMPTY_EXECUTION: LabExecution = { phase: "idle" };

export function AgentLab() {
  const [mode, setMode] = useState<"existing" | "generate">("existing");
  const [rows, setRows] = useState<ImageRow[]>([{ key: "image-0", description: "" }]);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [execution, setExecution] = useState<LabExecution>(EMPTY_EXECUTION);
  const [events, setEvents] = useState<string[]>([]);
  const [run, setRun] = useState<PublicAgentRun | null>(null);
  const running = useRef(false);
  const previews = useRef<string[]>([]);

  useEffect(() => {
    const owned = previews.current;
    return () => {
      for (const url of owned) URL.revokeObjectURL(url);
    };
  }, []);

  function rememberPreview(url: string) {
    previews.current.push(url);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (running.current) return;
    running.current = true;
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
    const text = textFields(data);
    const files = await fileFields(data, rows);
    const assessed = assessAgentSubmission(text, files);
    if (!assessed.ok) {
      setExecution({ phase: "rejected", message: assessed.error });
      setRun(null);
      return;
    }

    setExecution({ phase: "running" });
    setEvents([]);
    setRun(null);
    try {
      const response = await fetch("/api/admin/agent", { method: "POST", body: data });
      if (!response.ok || !response.body) {
        const message = await errorMessage(response);
        setExecution(response.status === 0 || response.status >= 500 ? { phase: "network", message } : { phase: "rejected", message });
        return;
      }
      const terminal = await readEvents(response.body, setEvents);
      if (!terminal) {
        setExecution({
          phase: "uncertain",
          message: "The connection ended before the run reported a result. A live draft may or may not have been stored.",
        });
        return;
      }
      if (terminal.type === "error") {
        setExecution(
          terminal.uncertain
            ? { phase: "uncertain", message: terminal.message }
            : { phase: "network", message: terminal.message },
        );
        return;
      }
      setRun(terminal.result);
      setExecution(executionFromRun(terminal.result));
    } catch {
      setExecution({ phase: "network", message: "The agent did not respond. The host may have stopped the request." });
    }
    } finally {
      running.current = false;
    }
  }

  const busy = submissionInProgress(execution.phase);

  return (
    <>
      <p className="eyebrow">Private</p>
      <h1>Agentic Lab</h1>
      <p>
        Prepare a draft with Traditional Function Calling. Review and publication stay in the{" "}
        <Link href="/admin/blog">blog editor</Link>. This page cannot publish.
      </p>
      <form className="editor-form agent-lab" onSubmit={onSubmit}>
        <fieldset className="agent-choices" disabled={busy}>
          <legend>Editorial mode</legend>
          <label>
            <input type="radio" name="mode" value="existing" checked={mode === "existing"} onChange={() => setMode("existing")} />
            Existing article
          </label>
          <label>
            <input type="radio" name="mode" value="generate" checked={mode === "generate"} onChange={() => setMode("generate")} />
            Generate article
          </label>
        </fieldset>

        {mode === "existing" ? (
          <>
            <label>
              Article Markdown
              <textarea name="body" rows={12} required disabled={busy} />
            </label>
            <label>
              Publishing instructions
              <textarea name="instructions" rows={4} required disabled={busy} />
            </label>
          </>
        ) : (
          <>
            <label>
              Editorial prompt
              <textarea name="prompt" rows={6} required disabled={busy} />
            </label>
            <label>
              Article length
              <select name="length" defaultValue="medium" disabled={busy}>
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </label>
          </>
        )}

        <label>
          Editorial context
          <textarea name="context" rows={3} disabled={busy} />
        </label>
        <label>
          Category
          <select name="category" defaultValue="" disabled={busy}>
            <option value="">No fixed category</option>
            {blogCategories.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Cover image
          <input
            name="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (coverPreview) URL.revokeObjectURL(coverPreview);
              if (!file) {
                setCoverPreview(null);
                return;
              }
              const url = URL.createObjectURL(file);
              rememberPreview(url);
              setCoverPreview(url);
            }}
          />
        </label>
        {coverPreview ? (
          // Local file chosen in this form. It is not a remote image that Next can optimize.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="agent-thumb" src={coverPreview} alt="Cover preview" />
        ) : null}

        <fieldset className="agent-images" disabled={busy}>
          <legend>Inline images</legend>
          {rows.map((row, index) => (
            <div key={row.key}>
              <label>
                Image {index + 1}
                <input
                  name={`image-${index}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setImagePreviews((current) => {
                      const next = { ...current };
                      if (next[row.key]) URL.revokeObjectURL(next[row.key]);
                      if (!file) delete next[row.key];
                      else {
                        const url = URL.createObjectURL(file);
                        rememberPreview(url);
                        next[row.key] = url;
                      }
                      return next;
                    });
                  }}
                />
              </label>
              {imagePreviews[row.key] ? (
                // Local file chosen in this form. It is not a remote image that Next can optimize.
                // eslint-disable-next-line @next/next/no-img-element
                <img className="agent-thumb" src={imagePreviews[row.key]} alt="Inline image preview" />
              ) : null}
              <label>
                Description
                <input
                  name={`image-description-${index}`}
                  value={row.description}
                  disabled={busy}
                  onChange={(event) => {
                    const description = event.target.value;
                    setRows((current) => current.map((item) => (item.key === row.key ? { ...item, description } : item)));
                  }}
                />
              </label>
            </div>
          ))}
          {rows.length < MAX_AGENT_IMAGES ? (
            <button
              type="button"
              data-secondary="true"
              onClick={() => setRows((current) => [...current, { key: `image-${current.length}-${Date.now()}`, description: "" }])}
            >
              Add an image
            </button>
          ) : null}
        </fieldset>

        <fieldset className="agent-choices">
          <legend>Target</legend>
          <label>
            <input type="radio" name="target" value="mock" defaultChecked disabled={busy} />
            Mock
          </label>
          <label>
            <input type="radio" name="target" value="live" disabled={busy} />
            Live
          </label>
        </fieldset>
        <p className="editor-hint">
          Mock keeps the draft in memory. Live can store a remote draft, but this host stops the request after about 300 seconds.
          If the connection ends early, that draft may or may not have been stored.
        </p>

        <fieldset className="agent-choices">
          <legend>Execution architecture</legend>
          <label>
            <input type="radio" name="architecture" value="function-calling" defaultChecked disabled={busy} />
            Traditional Function Calling
          </label>
          <label>
            <input type="radio" name="architecture" value="code-mode" disabled />
            Code Mode
            <span className="editor-hint">Not available yet.</span>
          </label>
        </fieldset>

        <div className="editor-actions">
          <button type="submit" disabled={busy}>
            {busy ? "Running" : "Run the agent"}
          </button>
        </div>
      </form>

      <ExecutionSummary execution={execution} />
      {events.length > 0 ? (
        <ol className="agent-log" aria-label="Agent progress">
          {events.map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ol>
      ) : null}
      {run ? <RunSummary run={run} /> : null}
      {run?.draft ? (
        <article className="agent-result">
          <h2>{run.draft.title}</h2>
          <p className="editor-hint">
            {run.draft.status} · {run.draft.category} · {run.draft.slug}
          </p>
          <p>{run.draft.summary}</p>
          <div className="blog-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(run.draft.body) }} />
          <p>
            <Link href="/admin/blog">Open the blog editor</Link>
          </p>
        </article>
      ) : null}
    </>
  );
}

function ExecutionSummary({ execution }: { execution: LabExecution }) {
  if (execution.phase === "idle") return null;
  if (execution.phase === "running") return <p role="status">The agent is running.</p>;
  if (execution.phase === "rejected") return <p className="editor-error" role="alert">{execution.message}</p>;
  if (execution.phase === "network") return <p className="editor-error" role="alert">{execution.message}</p>;
  if (execution.phase === "uncertain") return <p className="editor-error" role="alert">{execution.message}</p>;
  if (execution.phase === "incomplete") {
    return (
      <p className="editor-error" role="alert">
        The model did not finish: {execution.reason} {execution.persistence}
      </p>
    );
  }
  if (execution.phase === "validation") {
    return (
      <div role="alert">
        <p>The model finished this run.</p>
        <p className="editor-error">Validation failed: {execution.message}</p>
        <p>{execution.persistence}</p>
      </div>
    );
  }
  return (
    <div role="status">
      <p>The model finished this run.</p>
      <p>{execution.persisted ? "The remote draft was stored." : execution.persistence}</p>
    </div>
  );
}

function RunSummary({ run }: { run: PublicAgentRun }) {
  const models = [run.requestedModel, ...run.models.filter((model) => model !== run.requestedModel)].filter(Boolean);
  return (
    <dl className="agent-metrics">
      <div>
        <dt>Model</dt>
        <dd>{models.join(", ") || "Unavailable"}</dd>
      </div>
      <div>
        <dt>Model calls</dt>
        <dd>{run.apiCalls}</dd>
      </div>
      <div>
        <dt>Tokens</dt>
        <dd>
          {run.inputTokens} in / {run.outputTokens} out
        </dd>
      </div>
      <div>
        <dt>Duration</dt>
        <dd>{(run.durationMs / 1000).toFixed(1)}s</dd>
      </div>
    </dl>
  );
}

function textFields(form: FormData): AgentTextFields {
  return {
    mode: stringValue(form.get("mode")),
    instructions: stringValue(form.get("instructions")),
    body: stringValue(form.get("body")),
    prompt: stringValue(form.get("prompt")),
    length: stringValue(form.get("length")),
    context: stringValue(form.get("context")),
    category: stringValue(form.get("category")),
    target: stringValue(form.get("target")),
    architecture: stringValue(form.get("architecture")),
  };
}

async function fileFields(form: FormData, rows: ImageRow[]) {
  const coverFile = form.get("cover");
  const cover =
    coverFile instanceof File && coverFile.size > 0
      ? { filename: coverFile.name, bytes: new Uint8Array(await coverFile.arrayBuffer()) }
      : null;
  const images = [];
  for (let index = 0; index < rows.length; index += 1) {
    const file = form.get(`image-${index}`);
    if (!(file instanceof File) || file.size === 0) continue;
    images.push({
      filename: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
      description: rows[index]?.description ?? "",
    });
  }
  return { cover, images };
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    // The host can close the connection without a JSON body.
  }
  return "The agent did not respond. The host may have stopped the request.";
}

async function readEvents(
  body: ReadableStream<Uint8Array>,
  onLine: (update: (current: string[]) => string[]) => void,
): Promise<{ type: "done"; result: PublicAgentRun } | { type: "error"; message: string; uncertain?: boolean } | null> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let terminal: { type: "done"; result: PublicAgentRun } | { type: "error"; message: string; uncertain?: boolean } | null = null;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    const notes: string[] = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as Record<string, unknown>;
      const note = eventLine(event);
      if (note) notes.push(note);
      if (event.type === "done") terminal = { type: "done", result: event.result as PublicAgentRun };
      if (event.type === "error") {
        terminal = { type: "error", message: String(event.message ?? "The run could not be completed."), uncertain: event.uncertain === true };
      }
    }
    if (notes.length > 0) onLine((current) => [...current, ...notes]);
  }
  return terminal;
}

function eventLine(event: Record<string, unknown>): string | null {
  if (event.type === "config") return `Config: ${String(event.requestedModel)} · ${String(event.target)}`;
  if (event.type === "model") return `Model call ${String(event.call)}: ${String(event.model)} · ${String(event.inputTokens)} in / ${String(event.outputTokens)} out`;
  if (event.type === "tool") return `Tool ${String(event.phase)}: ${String(event.name)}`;
  if (event.type === "usage") return `Usage: ${String(event.apiCalls)} calls · ${String(event.inputTokens)} in / ${String(event.outputTokens)} out`;
  if (event.type === "validation") return "Validation recorded.";
  if (event.type === "persistence") return `Persistence: ${String(event.message)}`;
  if (event.type === "duration") return `Duration: ${(Number(event.milliseconds) / 1000).toFixed(1)}s`;
  if (event.type === "result") return `Model status: ${String(event.status)}`;
  if (event.type === "incomplete") return `Incomplete: ${String(event.reason)}`;
  return null;
}

function stringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}
