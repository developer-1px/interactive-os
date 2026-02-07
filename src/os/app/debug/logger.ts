/**
 * Professional Logging System for Antigravity Core
 * Features: Layered Badges, Dev-only silencing, Grouped execution tracing.
 */

const IS_DEV = import.meta.env.DEV;

type LogLayer = "ENGINE" | "KEYMAP" | "CONTEXT" | "PRIMITIVE" | "SYSTEM" | "NAVIGATION" | "FOCUS" | "KEYBOARD";

const LayerColors: Record<LogLayer, string> = {
  ENGINE: "#6366f1", // Indigo
  KEYMAP: "#ec4899", // Pink
  CONTEXT: "#10b981", // Emerald
  PRIMITIVE: "#f59e0b", // Amber
  SYSTEM: "#64748b", // Slate
  NAVIGATION: "#3b82f6", // Blue
  FOCUS: "#8b5cf6", // Violet
  KEYBOARD: "#f97316", // Orange
};

class AntigravityLogger {
  private enabled = IS_DEV;
  private enabledLayers: Set<LogLayer> = new Set(['FOCUS']);
  private timers: Map<string, number> = new Map();

  constructor() {
    // Expose for runtime debugging
    if (typeof window !== "undefined") {
      (window as any).AntigravityLogger = this;
    }
  }

  setEnabled(value: boolean) {
    this.enabled = value;
  }

  /** Enable specific layer(s) for logging */
  enableLayer(...layers: LogLayer[]) {
    layers.forEach(l => this.enabledLayers.add(l));
    this.enabled = true;
  }

  /** Disable specific layer(s) */
  disableLayer(...layers: LogLayer[]) {
    layers.forEach(l => this.enabledLayers.delete(l));
  }

  /** Check if layer is enabled */
  private isLayerEnabled(layer: LogLayer): boolean {
    if (!IS_DEV || !this.enabled) return false;
    if (this.enabledLayers.size === 0) return true;
    return this.enabledLayers.has(layer);
  }

  private getBadge(layer: LogLayer) {
    return [
      `%c ${layer} `,
      `background: ${LayerColors[layer]}; color: white; border-radius: 3px; font-weight: bold; font-size: 9px;`,
    ];
  }

  debug(layer: LogLayer, message: string, ...args: any[]) {
    if (!this.isLayerEnabled(layer)) return;
    const [badge, style] = this.getBadge(layer);
    console.log(`${badge} %c${message}`, style, "color: #94a3b8;", ...args);
  }

  warn(layer: LogLayer, message: string, ...args: any[]) {
    if (!this.isLayerEnabled(layer)) return;
    const [badge, style] = this.getBadge(layer);
    console.warn(`${badge} %c${message}`, style, "font-weight: bold;", ...args);
  }

  error(layer: LogLayer, message: string, ...args: any[]) {
    const [badge, style] = this.getBadge(layer);
    console.error(`${badge} %c${message}`, style, "font-weight: bold;", ...args);
  }

  group(layer: LogLayer, label: string) {
    if (!this.isLayerEnabled(layer)) return;
    const [badge, style] = this.getBadge(layer);
    console.groupCollapsed(`${badge} %c${label}`, style, "font-weight: bold; color: white;");
  }

  groupEnd() {
    if (!IS_DEV || !this.enabled) return;
    console.groupEnd();
  }

  /** Start timing for performance measurement */
  time(label: string) {
    if (!IS_DEV || !this.enabled) return;
    this.timers.set(label, performance.now());
  }

  /** End timing and log result */
  timeEnd(layer: LogLayer, label: string) {
    if (!this.isLayerEnabled(layer)) return;
    const start = this.timers.get(label);
    if (start === undefined) return;
    const duration = performance.now() - start;
    this.timers.delete(label);
    const [badge, style] = this.getBadge(layer);
    console.log(`${badge} %c${label}: ${duration.toFixed(2)}ms`, style, "color: #10b981;");
  }

  /** Trace command execution */
  traceCommand(id: string, payload: unknown, prevState: unknown, nextState: unknown) {
    if (!this.isLayerEnabled("ENGINE")) return;
    this.group("ENGINE", `Action: ${id}`);
    console.log("%cPayload:", "color: #f59e0b; font-weight: bold;", payload);
    console.log("%cPrev State:", "color: #94a3b8;", prevState);
    console.log("%cNext State:", "color: #10b981;", nextState);
    this.groupEnd();
  }
}

export const logger = new AntigravityLogger();
