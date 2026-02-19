/**
 * InputListener — Global DOM input event handler for contentEditable fields.
 *
 * Syncs contentEditable DOM text → FieldRegistry.value on every input.
 * Also dispatches the field's onChange command if registered.
 *
 * This bridges the gap between native contentEditable (which has no React onChange)
 * and the FieldRegistry + kernel command system.
 */

import { FieldRegistry } from "@os/6-components/field/FieldRegistry";
import { useEffect } from "react";
import { kernel } from "../../kernel";

export function InputListener() {
    useEffect(() => {
        const onInput = (e: Event) => {
            const target = e.target as HTMLElement;
            if (!target?.isContentEditable) return;

            const fieldId = target.id;
            if (!fieldId) return;

            const entry = FieldRegistry.getField(fieldId);
            if (!entry) return;

            const text = target.innerText ?? "";

            // Sync DOM → FieldRegistry
            FieldRegistry.updateValue(fieldId, text);

            // Dispatch onChange command if registered
            if (entry.config.onChange) {
                const cmd = entry.config.onChange({ text });
                kernel.dispatch(cmd);
            }
        };

        document.addEventListener("input", onInput, { capture: true });
        return () => document.removeEventListener("input", onInput, { capture: true });
    }, []);

    return null;
}

InputListener.displayName = "InputListener";
