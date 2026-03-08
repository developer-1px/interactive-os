/**
 * useDispatch — Dispatch bridge for React components.
 *
 * Returns a stable dispatch function so .tsx files don't need to import
 * the `os` singleton. Prefer Zone callbacks / Trigger prop-getters when
 * possible — this is for edge cases where imperative dispatch is needed
 * (e.g., toast actions, command palette, properties panel).
 */

import type { BaseCommand } from "@kernel/core/tokens";
import { os } from "@os-core/engine/kernel";

export function useDispatch(): (command: BaseCommand) => void {
  return os.dispatch;
}
