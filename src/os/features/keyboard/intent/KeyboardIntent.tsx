import { useCommandListener } from "@os/features/command/hooks/useCommandListener";
import { OS_COMMANDS } from "@os/features/command/definitions/commandsShell";
import { FieldRegistry } from "../registry/FieldRegistry";
import { FocusData } from "@os/features/focus/lib/focusData";

export const KeyboardIntent = () => {
    useCommandListener([
        {
            command: OS_COMMANDS.FIELD_START_EDIT,
            handler: ({ payload }) => {
                const p = payload as any;
                let targetId = p?.fieldId;

                // Auto-resolve from FocusData if not specified
                if (!targetId) {
                    const activeZone = FocusData.getActiveZone();
                    if (activeZone?.store) {
                        targetId = activeZone.store.getState().focusedItemId;
                    }
                }

                if (targetId) {
                    // Verify it's a registered field
                    const field = FieldRegistry.getField(targetId);
                    if (field) {
                        FieldRegistry.setEditing(targetId, true);
                    }
                }
            }
        },
        {
            command: OS_COMMANDS.FIELD_COMMIT,
            handler: ({ dispatch }) => {
                const { activeFieldId } = FieldRegistry.get();
                if (!activeFieldId) return;

                const field = FieldRegistry.getField(activeFieldId);
                if (!field) return;

                const { config, state } = field;
                const { localValue } = state;

                // 1. Local Callback
                config.onCommit?.(localValue);

                // 2. Command Dispatch
                if (config.commitCommand) {
                    const payload = { ...config.commitCommand.payload, text: localValue };
                    dispatch({ ...config.commitCommand, payload });
                } else if (config.updateType) {
                    // Legacy
                    dispatch({ type: config.updateType, payload: { text: localValue } });
                } else if (config.name) {
                    // Default Patch
                    dispatch({ type: "PATCH", payload: { [config.name]: localValue } });
                }

                // 3. Exit Edit Mode
                FieldRegistry.setEditing(activeFieldId, false);
            }
        },
        {
            command: OS_COMMANDS.FIELD_CANCEL,
            handler: ({ dispatch }) => {
                const { activeFieldId } = FieldRegistry.get();
                if (!activeFieldId) return;

                const field = FieldRegistry.getField(activeFieldId);

                // Dispatch cancel command if exists
                if (field?.config.cancelCommand) {
                    dispatch(field.config.cancelCommand);
                }

                FieldRegistry.setEditing(activeFieldId, false);
            }
        },
        {
            command: OS_COMMANDS.FIELD_SYNC,
            handler: ({ payload, dispatch }) => {
                const p = payload as any;
                const { fieldId, text } = p || {};
                console.log('[FIELD_SYNC] payload:', { fieldId, text });
                if (!fieldId || text === undefined) return;

                // Update Registry
                FieldRegistry.updateValue(fieldId, text);

                // Dispatch Sync Command if configured
                const field = FieldRegistry.getField(fieldId);
                console.log('[FIELD_SYNC] field:', field);
                console.log('[FIELD_SYNC] syncCommand:', field?.config.syncCommand);
                if (field?.config.syncCommand) {
                    const syncPayload = { ...field.config.syncCommand.payload, text };
                    // Preserve _def (non-enumerable) for Zero-Config Discovery
                    const cmd = Object.assign(
                        Object.create(Object.getPrototypeOf(field.config.syncCommand)),
                        field.config.syncCommand,
                        { payload: syncPayload }
                    );
                    console.log('[FIELD_SYNC] dispatch function:', dispatch);
                    console.log('[FIELD_SYNC] dispatching:', cmd);
                    console.log('[FIELD_SYNC] cmd._def:', (cmd as any)._def);
                    dispatch(cmd);
                    console.log('[FIELD_SYNC] dispatch called');
                }
            }
        },
        {
            command: OS_COMMANDS.FIELD_BLUR,
            handler: ({ payload, dispatch }) => {
                const p = payload as any;
                const { fieldId } = p || {};
                if (!fieldId) return;

                const field = FieldRegistry.getField(fieldId);
                if (!field) return;

                // Check if field was editing and should commit on blur
                const { state, config } = field;
                if (state.isEditing) {
                    // Commit on blur
                    const { localValue } = state;

                    // 1. Local Callback
                    config.onCommit?.(localValue);

                    // 2. Command Dispatch
                    if (config.commitCommand) {
                        const commitPayload = { ...config.commitCommand.payload, text: localValue };
                        dispatch({ ...config.commitCommand, payload: commitPayload });
                    } else if (config.updateType) {
                        dispatch({ type: config.updateType, payload: { text: localValue } });
                    } else if (config.name) {
                        dispatch({ type: "PATCH", payload: { [config.name]: localValue } });
                    }

                    // 3. Exit Edit Mode
                    FieldRegistry.setEditing(fieldId, false);
                }
            }
        }
    ]);

    return null;
};
