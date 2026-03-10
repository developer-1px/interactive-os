/**
 * APG Alert Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/alert/examples/alert/
 *
 * W3C APG spec:
 * - role="alert" → implicit aria-live="assertive" + aria-atomic="true"
 * - No keyboard interaction required
 * - Does NOT move focus (non-interruptive)
 * - Dynamically inserted to trigger screen reader announcement
 *
 * OS pattern:
 *   Alerts are inline components. We use `defineApp` state to control
 *   visibility via OS commands, instead of `useState` or `onClick`.
 *   Triggers declared in bind() — single declaration point.
 */

import { defineApp } from "@os-sdk/app/defineApp";

// ─── App State ───

export const AlertApp = defineApp<{ alerts: { id: string }[] }>("apg-alert", {
  alerts: [],
});

const alertZone = AlertApp.createZone("alert-actions");

export const SHOW_ALERT = alertZone.command("SHOW_ALERT", (ctx) => ({
  state: {
    alerts: [
      ...ctx.state.alerts,
      { id: `alert-${Date.now()}-${Math.random()}` },
    ],
  },
}));

export const RESET_ALERTS = alertZone.command("RESET_ALERTS", () => ({
  state: { alerts: [] },
}));

// ─── Bind (triggers declared here) ───

const AlertUI = alertZone.bind("toolbar", {
  triggers: {
    ShowAlert: () => SHOW_ALERT(),
  },
});

// ─── Component ───

function AlertPattern() {
  const alerts = AlertApp.useComputed((s) => s.alerts);

  return (
    <div className="max-w-lg">
      <h3 className="text-lg font-semibold mb-3">Alert</h3>
      <p className="text-sm text-gray-500 mb-4">
        Activating the <strong>Trigger Alert</strong> button causes a message to
        appear below. The alert is announced by screen readers without moving
        focus.
      </p>

      <AlertUI.Zone className="flex gap-3 mb-4" aria-label="Alert actions">
        <AlertUI.Item id="alert-trigger">
          <button
            type="button"
            {...AlertUI.triggers.ShowAlert()}
            className="
              px-4 py-2 text-sm font-medium rounded-lg
              bg-indigo-600 text-white
              hover:bg-indigo-700 active:bg-indigo-800
              focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
              transition-colors
            "
          >
            Trigger Alert
          </button>
        </AlertUI.Item>
      </AlertUI.Zone>

      {/* Inline Alert Box(es) */}
      <div className="flex flex-col gap-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            role="alert"
            className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md"
          >
            <p className="text-sm">
              <strong>Hello!</strong> This is an inline alert message. It is
              triggered by an event and announced immediately.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export { AlertPattern };
