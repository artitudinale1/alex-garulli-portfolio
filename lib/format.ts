export function formatMonthYear(value: string, locale = "en-GB"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateRange(
  startDate: string,
  endDate: string | null,
  present = "Present",
  locale = "en-GB",
): string {
  const start = formatMonthYear(startDate, locale);
  return endDate ? `${start} – ${formatMonthYear(endDate, locale)}` : `${start} – ${present}`;
}

export function paragraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

export function safeEmail(value: string): string | null {
  const email = value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}
