/**
 * Formats a decimal hour number into a human-readable string like "9h 13min"
 * @param h Decimal hours (e.g., 9.22)
 */
export function formatHours(h: number | null | undefined): string {
  if (h === null || h === undefined) return "—";
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h 0min`;
  return `${hours}h ${minutes}min`;
}

/**
 * Formats an ISO date string or Date object to a short time string (e.g., "9:02 AM")
 */
export function formatTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
