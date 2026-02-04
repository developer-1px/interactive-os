/**
 * Professional Logging System for Antigravity Core
 * Features: Layered Badges, Dev-only silencing, Grouped execution tracing.
 */

const IS_DEV = import.meta.env.DEV;

type LogLayer = "ENGINE" | "KEYMAP" | "CONTEXT" | "PRIMITIVE" | "SYSTEM" | "NAVIGATION";

const LayerColors: Record<LogLayer, string> = {
  ENGINE: "#6366f1", // Indigo
  KEYMAP: "#ec4899", // Pink
  CONTEXT: "#10b981", // Emerald
  PRIMITIVE: "#f59e0b", // Amber
  SYSTEM: "#64748b", // Slate
  NAVIGATION: "#3b82f6", // Blue
};

class AntigravityLogger {
  private enabled = false;

  constructor() {
    // Expose for runtime debugging
    if (typeof window !== "undefined") {
      (window as any).AntigravityLogger = this;
    }
  }

  setEnabled(value: boolean) {
    this.enabled = value;
  }

  private getBadge(layer: LogLayer) {
    return [
      `%c ${layer} `,
      `background: ${LayerColors[layer]}; color: white; border-radius: 3px; font-weight: bold; font-size: 9px;`,
    ];
  }

  debug(layer: LogLayer, message: string, ...args: any[]) {
    if (!IS_DEV || !this.enabled) return;
    const [badge, style] = this.getBadge(layer);
    console.log(`${badge} %c${message}`, style, "color: #94a3b8;", ...args);
  }

  warn(layer: LogLayer, message: string, ...args: any[]) {
    if (!IS_DEV || !this.enabled) return;
    const [badge, style] = this.getBadge(layer);
    console.warn(`${badge} %c${message}`, style, "font-weight: bold;", ...args);
  }

  error(layer: LogLayer, message: string, ...args: any[]) {
    // Errors are always logged
    const [badge, style] = this.getBadge(layer);
    console.error(
      `${badge} %c${message}`,
      style,
      "font-weight: bold;",
      ...args,
    );
  }

  group(layer: LogLayer, label: string) {
    if (!IS_DEV || !this.enabled) return;
    const [badge, style] = this.getBadge(layer);
    console.groupCollapsed(
      `${badge} %c${label}`,
      style,
      "font-weight: bold; color: white;",
    );
  }

  groupEnd() {
    if (!IS_DEV || !this.enabled) return;
    console.groupEnd();
  }

  /**
   * Special trace for Command Execution
   */
  traceCommand(id: string, payload: unknown, prevState: unknown, nextState: unknown) {
    if (!IS_DEV || !this.enabled) return;
    this.group("ENGINE", `Action: ${id}`);
    console.log("%cPayload:", "color: #f59e0b; font-weight: bold;", payload);
    console.log("%cPrev State:", "color: #94a3b8;", prevState);
    console.log("%cNext State:", "color: #10b981;", nextState);
    this.groupEnd();
  }
}

export const logger = new AntigravityLogger();
