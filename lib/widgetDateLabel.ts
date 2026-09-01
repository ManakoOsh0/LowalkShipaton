/** Cron-style widget date badge — short weekday + day number. */
export type WidgetDateParts = {
  weekday: string;
  day: string;
};

export function formatWidgetDateParts(referenceDate = new Date()): WidgetDateParts {
  const weekday = referenceDate.toLocaleDateString("en-US", { weekday: "short" });
  return {
    weekday,
    day: String(referenceDate.getDate()).padStart(2, "0"),
  };
}
