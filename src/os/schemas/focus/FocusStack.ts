/**
 * Focus Stack Entry Schema
 * Represents a saved focus state to restore later (e.g., after modal close).
 */
export interface FocusStackEntry {
  zoneId: string;
  itemId: string | null;
  /** Item's index in the zone at push time — for neighbor resolution on pop */
  index?: number;
  /** Optional: Zone ID that triggered the push (for debugging) */
  triggeredBy?: string;
}
