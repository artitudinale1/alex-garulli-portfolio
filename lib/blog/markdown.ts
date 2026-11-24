const ESCAPE_HTML: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const RUBY = /<ruby>([^<]*)<rt>([^<]*)<\/rt><\/ruby>/gi;

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ESCAPE_HTML[character] ?? character);
}

function safeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:" && url.protocol !== "mailto:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function renderInline(source: string): string {
  const rubies: string[] = [];
  const withoutRuby = source.replace(RUBY, (_match, base: string, reading: string) => {
    const token = `\u0000RUBY${rubies.length}\u0000`;
    rubies.push(`<ruby>${escapeHtml(base)}<rt>${escapeHtml(reading)}</rt></ruby>`);
    return token;
  });
  const codes: string[] = [];
  const withoutCode = withoutRuby.replace(/`([^`\n]+)`/g, (_match, code: string) => {
    const token = `\u0000CODE${codes.length}\u0000`;
    codes.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  let html = escapeHtml(withoutCode);
  html = html.replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, (_match, label: string, href: string) => {
    const url = safeUrl(href);
    if (!url) return label;
    return `<a href="${escapeHtml(url)}" rel="noopener noreferrer">${label}</a>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,!?:;])/g, "$1<em>$2</em>");
  html = html.replace(/\u0000CODE(\d+)\u0000/g, (_match, index: string) => codes[Number(index)] ?? "");
  return html.replace(/\u0000RUBY(\d+)\u0000/g, (_match, index: string) => rubies[Number(index)] ?? "");
}

function isBlockStart(line: string): boolean {
  return (
    line.startsWith("```") ||
    /^#{1,3} /.test(line) ||
    /^[-*] /.test(line) ||
    /^\d+\. /.test(line) ||
    line.startsWith("> ")
  );
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (line.trim() === "") {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index] ?? "");
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = /^(#{1,3}) (.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length + 1;
      blocks.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*] /.test(lines[index] ?? "")) {
        items.push(`<li>${renderInline((lines[index] ?? "").slice(2))}</li>`);
        index += 1;
      }
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\. /.test(lines[index] ?? "")) {
        items.push(`<li>${renderInline((lines[index] ?? "").replace(/^\d+\. /, ""))}</li>`);
        index += 1;
      }
      blocks.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    if (line.startsWith("> ")) {
      const quotes: string[] = [];
      while (index < lines.length && (lines[index] ?? "").startsWith("> ")) {
        quotes.push(renderInline((lines[index] ?? "").slice(2)));
        index += 1;
      }
      blocks.push(`<blockquote><p>${quotes.join("<br>")}</p></blockquote>`);
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && (lines[index] ?? "").trim() !== "" && !isBlockStart(lines[index] ?? "")) {
      paragraph.push(lines[index] ?? "");
      index += 1;
    }
    blocks.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }

  return blocks.join("");
}
