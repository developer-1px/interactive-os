/**
 * TestBot — Mock Action Factory (for dryRun)
 *
 * Produces a TestActions that records steps without actually
 * interacting with the DOM. Used for step-count preview.
 */

import type { StepResult } from "../../entities/StepResult";
import type { TestActions } from "../../entities/TestActions";
import { KEY_LABELS } from "./constants";

export function formatModLabel(
  key: string,
  modifiers?: {
    shift?: boolean;
    ctrl?: boolean;
    alt?: boolean;
    meta?: boolean;
  },
): string {
  const label = KEY_LABELS[key] ?? key;
  return (
    [
      modifiers?.ctrl ? "Ctrl+" : "",
      modifiers?.shift ? "Shift+" : "",
      modifiers?.alt ? "Alt+" : "",
      modifiers?.meta ? "Meta+" : "",
    ].join("") + label
  );
}

export function createMockActions(steps: StepResult[]): TestActions {
  return {
    click: async (target) => {
      steps.push({
        action: "click",
        detail: typeof target === "string" ? target : JSON.stringify(target),
        passed: true,
      });
    },
    press: async (key, modifiers) => {
      steps.push({
        action: "press",
        detail: formatModLabel(key, modifiers),
        passed: true,
      });
    },
    type: async (text) => {
      steps.push({ action: "type", detail: `"${text}"`, passed: true });
    },
    wait: async () => {},
    getByText: async (text) => `[text="${text}"]`,
    getAllByText: async (text) => [`[text="${text}"]`],
    getByRole: async (role, name) =>
      `[role="${role}"]${name ? `[name="${name}"]` : ""}`,
    expect: (selector) => ({
      focused: async () => {
        steps.push({
          action: "expect.focused",
          detail: selector,
          passed: true,
        });
      },
      toHaveAttr: async (attr, value) => {
        steps.push({
          action: "expect.attr",
          detail: `${selector} [${attr}="${value}"]`,
          passed: true,
        });
      },
      toNotHaveAttr: async (attr, value) => {
        steps.push({
          action: "expect.not_attr",
          detail: `${selector} [${attr}≠"${value}"]`,
          passed: true,
        });
      },
      toExist: async () => {
        steps.push({ action: "expect.exists", detail: selector, passed: true });
      },
      toNotExist: async () => {
        steps.push({
          action: "expect.not_exists",
          detail: selector,
          passed: true,
        });
      },
      toHaveValue: async (value) => {
        steps.push({
          action: "expect.value",
          detail: `${selector} value="${value}"`,
          passed: true,
        });
      },
      toHaveText: async (text) => {
        steps.push({
          action: "expect.text",
          detail: `${selector} text="${text}"`,
          passed: true,
        });
      },
      toBeVisible: async () => {
        steps.push({
          action: "expect.visible",
          detail: selector,
          passed: true,
        });
      },
      toBeDisabled: async () => {
        steps.push({
          action: "expect.disabled",
          detail: selector,
          passed: true,
        });
      },
      toHaveCount: async (n) => {
        steps.push({
          action: "expect.count",
          detail: `${selector} ×${n}`,
          passed: true,
        });
      },
    }),
  };
}
