import { parseFurigana } from "@/lib/i18n/furigana";

export function Furigana({ text }: { text: string }) {
  return parseFurigana(text).map((part, index) =>
    part.type === "text" ? (
      part.value
    ) : (
      <ruby key={index}>
        {part.base}
        <rt>{part.reading}</rt>
      </ruby>
    ),
  );
}
