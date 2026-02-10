/**
 * Field — Kernel-based text input component (zero-dependency).
 * 
 * Replaces legacy os/app/export/primitives/Field.tsx.
 * Uses Kernel State (ZoneState.editingItemId).
 * Manages DOM directly via ref to avoid React contentEditable issues.
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import {
    FIELD_COMMIT,
    FIELD_START_EDIT,
} from "../3-commands/field";
import { useEditing } from "../5-hooks/useEditing";
import { kernel } from "../kernel";
import { Item, type ItemProps } from "./Item";
import { useZoneContext } from "./ZoneContext";

export interface FieldProps extends Omit<ItemProps, "children" | "onChange" | "id"> {
    id: string;
    value: string;
    mode?: "immediate" | "deferred";
    placeholder?: string;
    multiline?: boolean;

    // Callbacks
    onCommit?: (value: string) => void;
    onChange?: (value: string) => void; // Real-time change

    // Style overrides
    className?: string; // Additional className
}

export function Field({
    id,
    value,
    mode = "immediate",
    placeholder,
    multiline = false,
    onCommit,
    onChange,
    className,
    ...rest
}: FieldProps) {
    const { zoneId } = useZoneContext();
    const isEditing = useEditing(zoneId, id);
    const internalRef = useRef<HTMLElement>(null);

    // Sync prop -> DOM (only when NOT editing)
    useLayoutEffect(() => {
        if (!isEditing && internalRef.current) {
            // Avoid resetting cursor if value is effectively same (though usually we are not editing)
            if (internalRef.current.innerText !== value) {
                internalRef.current.innerText = value;
            }
        }
    }, [value, isEditing]);

    // Handle Commit/Cancel signals from Kernel
    const lastEventRef = useRef<{ type: string; id: string; tick: number } | null>(null);

    useEffect(() => {
        return kernel.subscribe(() => {
            const state = kernel.getState();
            const event = state.os.focus.zones[zoneId]?.fieldEvent;

            // Check if a new event occurred for this field
            if (event && event !== lastEventRef.current && event.id === id) {
                lastEventRef.current = event;
                if (event.type === "commit") {
                    onCommit?.(internalRef.current?.innerText || "");
                } else if (event.type === "cancel") {
                    // Revert to original prop value
                    if (internalRef.current) {
                        internalRef.current.innerText = value;
                    }
                }
            }
        });
    }, [id, zoneId, value, onCommit]);

    // Update logic (Propagate changes)
    const handleInput = (e: React.FormEvent<HTMLElement>) => {
        onChange?.(e.currentTarget.innerText);
    };

    // Focus handler: Auto-start editing in immediate mode
    const handleFocus = () => {
        if (mode === "immediate" && !isEditing) {
            kernel.dispatch(FIELD_START_EDIT());
        }
    };

    // Click handler: Start editing (triggers for Enter key via ACTIVATE->click)
    const handleClick = () => {
        if (!isEditing) {
            kernel.dispatch(FIELD_START_EDIT());
        }
    };

    // Blur handler: Auto-commit if editing
    const handleBlur = () => {
        if (isEditing) {
            kernel.dispatch(FIELD_COMMIT());
        }
    };

    const Component = multiline ? "div" : "span";

    return (
        <Item
            id={id}
            asChild
            {...rest}
        >
            <Component
                role="textbox"
                contentEditable={isEditing}
                suppressContentEditableWarning
                onFocus={handleFocus}
                onClick={handleClick}
                onBlur={handleBlur}
                onInput={handleInput}
                className={className}
                data-placeholder={(!isEditing && !value) ? placeholder : undefined}
                style={{
                    minHeight: "1lh",
                    display: "inline-block",
                    cursor: isEditing ? "text" : "default",
                    outline: "none",
                    whiteSpace: multiline ? "pre-wrap" : "nowrap",
                    overflow: multiline ? undefined : "hidden",
                    ...(rest as any).style
                }}
            // No children managed by React to prevent cursor jumps
            />
        </Item>
    );
}
