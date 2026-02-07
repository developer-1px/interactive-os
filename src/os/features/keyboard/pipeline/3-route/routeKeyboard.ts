/**
 * routeKeyboard - Keyboard Pipeline Phase 3: ROUTE
 *
 * Responsibility: Route classified intent to the appropriate handler.
 * Returns true if the event was handled (should preventDefault).
 *
 * This is the main router - delegates to specific handlers.
 */

import { FieldRegistry } from "@os/features/keyboard/registry/FieldRegistry";
import type { KeyboardCategory, KeyboardIntent } from "../../types";
import { routeCommand } from "./routeCommand";
import { routeField } from "./routeField";

/**
 * Route a classified keyboard intent to the appropriate handler.
 * Returns true if the event was handled.
 */
export function routeKeyboard(
  intent: KeyboardIntent,
  category: KeyboardCategory,
): boolean {
  switch (category) {
    case "COMMAND": {
      // Special case: If from a Field in deferred mode that is NOT editing,
      // treat as non-input so keybindings are not blocked by allowInInput filter.
      let effectiveIntent = intent;
      if (intent.isFromField && intent.fieldId) {
        const fieldEntry = FieldRegistry.getField(intent.fieldId);
        if (fieldEntry) {
          const mode = fieldEntry.config.mode ?? "immediate";
          const isEditing = fieldEntry.state.isEditing;
          if (mode === "deferred" && !isEditing) {
            effectiveIntent = { ...intent, isFromField: false };
          }
        }
      }
      return routeCommand(effectiveIntent);
    }

    case "FIELD":
      return routeField(intent);

    case "PASSTHRU":
    default:
      return false;
  }
}
