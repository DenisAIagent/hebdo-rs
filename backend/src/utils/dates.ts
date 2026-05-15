/**
 * Date helpers for the hebdo (weekly) publication cycle.
 *
 * Publication rule: a new issue ships every Friday and remains "current"
 * until the following Friday (00:00 UTC).
 *
 * All dates are stored as plain "YYYY-MM-DD" strings (no timezone), which
 * matches the existing `hebdo_config.start_date` / `end_date` columns.
 */

const FRIDAY = 5; // Date.getUTCDay() — 0 = Sunday, 5 = Friday

/** Format a Date as "YYYY-MM-DD" (UTC). */
export function formatDateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Today as "YYYY-MM-DD" (UTC). */
export function todayString(): string {
  return formatDateOnly(new Date());
}

/**
 * Return the next Friday strictly after `from` (so if `from` is itself
 * a Friday, this returns the Friday 7 days later — used as the rotation
 * trigger for a brand-new "current" issue).
 */
export function nextFridayString(from: Date = new Date()): string {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const day = d.getUTCDay();
  const daysUntil = day === FRIDAY ? 7 : (FRIDAY - day + 7) % 7;
  d.setUTCDate(d.getUTCDate() + daysUntil);
  return formatDateOnly(d);
}
