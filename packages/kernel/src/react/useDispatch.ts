/**
 * useDispatch — React hook to get the dispatch function.
 *
 * Returns a stable reference to kernel's dispatch.
 * No re-renders when state changes.
 */

import { useCallback } from "react";
import { dispatch } from "../core/pipeline.ts";
import type { Command } from "../core/tokens.ts";

export function useDispatch(): (cmd: Command<string, unknown>) => void {
  return useCallback((cmd: Command<string, unknown>) => dispatch(cmd), []);
}
