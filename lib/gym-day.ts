/** Returns a stable YYYY-MM-DD key for the current calendar date in a gym timezone. */
export function gymCalendarDay(date: Date, timezone: string | null | undefined): string {
  const zone = timezone || "UTC";
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(date);
    const get = (type: string) => parts.find((part) => part.type === type)?.value;
    const year = get("year"); const month = get("month"); const day = get("day");
    if (!year || !month || !day) throw new Error("Could not determine calendar date");
    return `${year}-${month}-${day}`;
  } catch {
    // Invalid configured timezones safely fall back to UTC.
    return date.toISOString().slice(0, 10);
  }
}
