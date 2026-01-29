/**
 * Returns a YYYY-MM-DD string in the local timezone.
 */
export function getLocalDateString(date: Date = new Date()): string {
    return date.toLocaleDateString("sv"); // 'sv' locale uses YYYY-MM-DD format
}

/**
 * Returns a YYYY-MM-DD string for a given ISO UTC string, converted to local time.
 */
export function getLocalDateFromISO(isoString: string): string {
    return new Date(isoString).toLocaleDateString("sv");
}

/**
 * Returns the week number (1-53) for a given date.
 */
export function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Returns a formatted month string (e.g., "December 2025").
 */
export function getMonthYearString(date: Date): string {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
