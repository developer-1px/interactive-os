import { OS_COMMANDS } from "@os/core/command/osCommands";
import { createCommandFactory } from "@os/core/command/definition";
import { useFocusStore } from "@os/core/focus/focusStore";

const defineOSCommand = createCommandFactory<any>();

export const ToggleInspector = defineOSCommand({
    id: OS_COMMANDS.TOGGLE_INSPECTOR,

    run: (state) => {
        if (state.ui) {
            return {
                ...state,
                ui: {
                    ...state.ui,
                    isInspectorOpen: !state.ui.isInspectorOpen
                }
            };
        }
        return state;
    },
});

/**
 * SET_FOCUS: Fallback OS command for Field focus dispatch.
 * Delegates to FocusStore directly since focus is OS-level, not app-level.
 */
export const SetFocus = defineOSCommand({
    id: "SET_FOCUS",
    run: (state, payload: any) => {
        if (payload?.id) {
            useFocusStore.getState().setFocus(payload.id);
        }
        return state;
    },
});

/**
 * PATCH: Generic data patch command.
 * At OS level, this is a no-op (state passthrough).
 * Apps should register their own PATCH handler if they need it.
 */
export const Patch = defineOSCommand({
    id: "PATCH",
    run: (state) => state,
});

