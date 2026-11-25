const RUBY_MARKUP = /<ruby>([^<]*)<rt>([^<]*)<\/rt><\/ruby>/g;
const HAN = /\p{Script=Han}/u;

export type FuriganaPart =
  | { type: "text"; value: string }
  | { type: "ruby"; base: string; reading: string };

export function parseFurigana(value: string): FuriganaPart[] {
  const parts: FuriganaPart[] = [];
  let cursor = 0;
  for (const match of value.matchAll(RUBY_MARKUP)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ type: "text", value: value.slice(cursor, index) });
    parts.push({ type: "ruby", base: match[1] ?? "", reading: match[2] ?? "" });
    cursor = index + match[0].length;
  }
  if (cursor < value.length) parts.push({ type: "text", value: value.slice(cursor) });
  return parts;
}

/** Base text only. Annotation markup and the reading inside rt are both removed. */
export function rubyPlain(value: string): string {
  return parseFurigana(value)
    .map((part) => (part.type === "text" ? part.value : part.base))
    .join("");
}

export function uncoveredKanji(value: string): string[] {
  const found: string[] = [];
  for (const part of parseFurigana(value)) {
    if (part.type === "text") {
      for (const character of part.value) {
        if (HAN.test(character)) found.push(character);
      }
      continue;
    }
    if (!HAN.test(part.base) || part.reading.trim() === "") found.push(part.base || "(empty ruby)");
    for (const character of part.reading) {
      if (HAN.test(character)) found.push(character);
    }
  }
  return found;
}

export function annotateJapaneseDate(value: string): string {
  return value
    .replaceAll("年", "<ruby>年<rt>ねん</rt></ruby>")
    .replaceAll("月", "<ruby>月<rt>がつ</rt></ruby>")
    .replaceAll("現在", "<ruby>現在<rt>げんざい</rt></ruby>");
}
