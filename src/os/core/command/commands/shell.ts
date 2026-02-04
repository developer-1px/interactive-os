import { OS_COMMANDS } from "@os/core/command/osCommands";
import { createCommandFactory } from "@os/core/command/definition";

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
