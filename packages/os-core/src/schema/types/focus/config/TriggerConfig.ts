/**
 * TriggerConfig — Declarative trigger behavior configuration.
 *
 * Axis-separated, like FocusGroupConfig for Zones:
 *   - open:  which intents open the overlay (activate, click, arrow, hover)
 *   - focus: where focus goes on open/close
 *   - aria:  what ARIA attributes projected on the trigger element
 *
 * resolveKeyboard uses this via resolveTriggerKey (Field → Trigger → Item → Zone → Global).
 */

// ── Open axis ──

export interface TriggerOpenConfig {
    /** OS_ACTIVATE (Enter/Space) → open overlay? */
    onActivate: boolean;
    /** Click → toggle overlay? */
    onClick: boolean;
    /** OS_NAVIGATE(down) → open overlay? */
    onArrowDown: boolean;
    /** OS_NAVIGATE(up) → open overlay? */
    onArrowUp: boolean;
    /** Hover → open overlay? (tooltip pattern) */
    onHover: boolean;
}

export const DEFAULT_TRIGGER_OPEN: TriggerOpenConfig = {
    onActivate: true,
    onClick: true,
    onArrowDown: false,
    onArrowUp: false,
    onHover: false,
};

// ── Focus axis ──

export interface TriggerFocusConfig {
    /** Where focus goes when overlay opens */
    onOpen: "first" | "last" | "none";
    /** Where focus goes when overlay closes */
    onClose: "restore" | "none";
}

export const DEFAULT_TRIGGER_FOCUS: TriggerFocusConfig = {
    onOpen: "first",
    onClose: "restore",
};

// ── ARIA axis ──

export interface TriggerAriaConfig {
    /** aria-haspopup value. false = no projection */
    haspopup: string | false;
}

export const DEFAULT_TRIGGER_ARIA: TriggerAriaConfig = {
    haspopup: false,
};

// ── Composed ──

export interface TriggerConfig {
    open: TriggerOpenConfig;
    focus: TriggerFocusConfig;
    aria: TriggerAriaConfig;
}

export const DEFAULT_TRIGGER_CONFIG: TriggerConfig = {
    open: DEFAULT_TRIGGER_OPEN,
    focus: DEFAULT_TRIGGER_FOCUS,
    aria: DEFAULT_TRIGGER_ARIA,
};
