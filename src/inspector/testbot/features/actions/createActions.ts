/**
 * TestBot — Action Factory
 *
 * Creates the real TestActions implementation that dispatches
 * browser events and records step results.
 */

import type { BotCursor } from "../../entities/BotCursor";
import type { StepResult } from "../../entities/StepResult";
import type { OnStep } from "../../entities/SuiteResult";
import type { Selector, TestActions } from "../../entities/TestActions";

import { BotError, getElementCenter, KEY_LABELS, wait } from "./constants";
import { captureFailureContext } from "./context";
import {
  findAllByText,
  findByRole,
  findByText,
  getUniqueSelector,
  resolveElement,
  selectorLabel,
} from "./selectors";

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

export interface ActionContext {
  cursor: BotCursor;
  speed: number;
  onStep?: OnStep;
  suiteIndex: number;
}

export function createActions(
  steps: StepResult[],
  ctx: ActionContext,
): TestActions {
  const { cursor, speed } = ctx;

  const moveTime = () => Math.round(300 / speed);
  const pauseTime = () => Math.round(120 / speed);

  const emitStep = () => {
    ctx.onStep?.(ctx.suiteIndex, steps[steps.length - 1]!);
  };

  // ─────────────────────────────────────────────────────────────────
  // Semantic Selectors
  // ─────────────────────────────────────────────────────────────────

  const getByText = async (text: string): Promise<string> => {
    const el = findByText(text);
    if (!el) {
      const error = `Element with text "${text}" not found${captureFailureContext()}`;
      steps.push({
        action: "query",
        detail: `getByText("${text}")`,
        passed: false,
        error,
      });
      emitStep();
      throw new BotError(error);
    }
    return getUniqueSelector(el);
  };

  const getAllByText = async (text: string): Promise<string[]> => {
    return findAllByText(text).map((el) => getUniqueSelector(el));
  };

  const getByRole = async (role: string, name?: string): Promise<string> => {
    const el = findByRole(role, name);
    if (!el) {
      const label = `getByRole("${role}"${name ? `, "${name}"` : ""})`;
      const error = `Element with role="${role}"${name ? ` name="${name}"` : ""} not found${captureFailureContext()}`;
      steps.push({ action: "query", detail: label, passed: false, error });
      emitStep();
      throw new BotError(error);
    }
    return getUniqueSelector(el);
  };

  // ─────────────────────────────────────────────────────────────────
  // Click (CSS string or { text, role } query)
  // ─────────────────────────────────────────────────────────────────

  const click = async (
    target: Selector,
    modifiers?: {
      shift?: boolean;
      ctrl?: boolean;
      alt?: boolean;
      meta?: boolean;
    },
  ) => {
    const label = selectorLabel(target);

    const el = resolveElement(target);
    if (!el) {
      const context = captureFailureContext();
      steps.push({
        action: "click",
        detail: label,
        passed: false,
        error: `Element not found: ${label}${context}`,
      });
      emitStep();
      throw new BotError(`Element not found: ${label}`);
    }

    cursor.hideOffScreenPtr();
    const { x, y } = getElementCenter(el);
    const rect = el.getBoundingClientRect();
    const outOfView =
      rect.top < 0 ||
      rect.bottom > window.innerHeight ||
      rect.left < 0 ||
      rect.right > window.innerWidth;

    await cursor.moveTo(x, y, moveTime());
    cursor.trackElement(el);
    cursor.clearBubbles();
    const modLabel = modifiers
      ? `${[
          modifiers.ctrl ? "Ctrl+" : "",
          modifiers.shift ? "Shift+" : "",
          modifiers.meta ? "⌘+" : "",
        ].join("")}Click`
      : "Click";
    cursor.showBubble(modLabel, "click");
    cursor.ripple();

    const eventOpts: MouseEventInit = {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0,
      shiftKey: modifiers?.shift ?? false,
      ctrlKey: modifiers?.ctrl ?? false,
      altKey: modifiers?.alt ?? false,
      metaKey: modifiers?.meta ?? false,
    };
    el.dispatchEvent(new MouseEvent("mousedown", eventOpts));

    if (el instanceof HTMLElement) {
      el.focus();
    }

    await wait(50 / speed);
    el.dispatchEvent(new MouseEvent("mouseup", eventOpts));
    el.dispatchEvent(new MouseEvent("click", eventOpts));

    if (outOfView) {
      await wait(300 / speed);
      const newPos = getElementCenter(el);
      const newRect = el.getBoundingClientRect();
      const stillOutOfView =
        newRect.top < 0 ||
        newRect.bottom > window.innerHeight ||
        newRect.left < 0 ||
        newRect.right > window.innerWidth;

      if (stillOutOfView) {
        cursor.showOffScreenPtr(newPos.x, newPos.y);
      } else {
        await cursor.moveTo(newPos.x, newPos.y, 200);
      }
    }

    steps.push({ action: "click", detail: label, passed: true });
    emitStep();
    await wait(pauseTime());
  };

  // ─────────────────────────────────────────────────────────────────
  // Press
  // ─────────────────────────────────────────────────────────────────

  const press = async (
    key: string,
    modifiers?: {
      shift?: boolean;
      ctrl?: boolean;
      alt?: boolean;
      meta?: boolean;
    },
  ) => {
    const label = KEY_LABELS[key] ?? key;
    const modLabel =
      [
        modifiers?.ctrl ? "Ctrl+" : "",
        modifiers?.shift ? "Shift+" : "",
        modifiers?.alt ? "Alt+" : "",
        modifiers?.meta ? "Meta+" : "",
      ].join("") + label;

    cursor.showBubble(modLabel, "default");
    const target = document.activeElement || document.body;
    const eventInit: KeyboardEventInit = {
      key,
      bubbles: true,
      cancelable: true,
      shiftKey: modifiers?.shift ?? false,
      ctrlKey: modifiers?.ctrl ?? false,
      altKey: modifiers?.alt ?? false,
      metaKey: modifiers?.meta ?? false,
    };
    target.dispatchEvent(new KeyboardEvent("keydown", eventInit));
    target.dispatchEvent(new KeyboardEvent("keyup", eventInit));

    steps.push({ action: "press", detail: modLabel, passed: true });
    emitStep();
    await wait(pauseTime());
  };

  // ─────────────────────────────────────────────────────────────────
  // Type (character-by-character input)
  // ─────────────────────────────────────────────────────────────────

  const typeText = async (text: string) => {
    cursor.showBubble(
      `Type "${text.length > 10 ? `${text.slice(0, 10)}...` : text}"`,
      "default",
    );

    for (const char of text) {
      const key = char === " " ? " " : char;
      const target = document.activeElement || document.body;
      const eventInit: KeyboardEventInit = {
        key,
        bubbles: true,
        cancelable: true,
      };
      target.dispatchEvent(new KeyboardEvent("keydown", eventInit));
      target.dispatchEvent(new KeyboardEvent("keyup", eventInit));

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        target.value += char;
        target.dispatchEvent(new Event("input", { bubbles: true }));
      }

      await wait(20 / speed);
    }

    steps.push({ action: "type", detail: `"${text}"`, passed: true });
    emitStep();
    await wait(pauseTime());
  };

  // ─────────────────────────────────────────────────────────────────
  // Expect (Rich Assertions)
  // ─────────────────────────────────────────────────────────────────

  const assertStep = (
    action: string,
    detail: string,
    passed: boolean,
    errorMsg?: string,
    selector?: string,
  ) => {
    const el = selector ? document.querySelector(selector) : null;
    cursor.showStatus(passed ? "pass" : "fail", selector, el ?? undefined);

    let finalError = errorMsg;
    if (!passed && errorMsg) {
      finalError += captureFailureContext();
    }

    steps.push({
      action,
      detail,
      passed,
      ...(passed ? {} : { error: finalError }),
    } as StepResult);
    emitStep();
    if (!passed) throw new BotError(errorMsg ?? "Assertion failed");
  };

  const expect = (selector: string) => ({
    toBeFocused: async () => {
      await wait(60);
      const el = document.querySelector(selector);
      const activeEl = document.activeElement;
      const isFocused = el && activeEl === el;
      const activeId = activeEl?.id;
      const targetId = selector.startsWith("#") ? selector.slice(1) : null;
      const idMatch = targetId && activeId === targetId;
      const passed = !!(isFocused || idMatch);

      assertStep(
        "expect.focused",
        selector,
        passed,
        `Expected ${selector} focused, got ${activeId ? `#${activeId}` : (activeEl?.tagName ?? "(none)")}`,
        selector,
      );
    },

    toHaveAttribute: async (attr: string, value: string) => {
      await wait(150);
      const el = document.querySelector(selector);
      const actual = el?.getAttribute(attr);
      assertStep(
        "expect.attr",
        `${selector} [${attr}="${value}"]`,
        actual === value,
        `Expected ${attr}="${value}", got "${actual}"`,
        selector,
      );
    },

    toNotHaveAttribute: async (attr: string, value: string) => {
      await wait(150);
      const el = document.querySelector(selector);
      const actual = el?.getAttribute(attr);
      assertStep(
        "expect.not_attr",
        `${selector} [${attr}≠"${value}"]`,
        actual !== value,
        `Expected ${attr} to NOT be "${value}", but it was`,
        selector,
      );
    },

    toExist: async () => {
      await wait(150);
      const passed = !!document.querySelector(selector);
      assertStep(
        "expect.exists",
        selector,
        passed,
        `Expected ${selector} to exist in DOM`,
        selector,
      );
    },

    toNotExist: async () => {
      await wait(150);
      const passed = !document.querySelector(selector);
      assertStep(
        "expect.not_exists",
        selector,
        passed,
        `Expected ${selector} to NOT exist in DOM`,
        selector,
      );
    },

    toHaveValue: async (value: string) => {
      await wait(150);
      const el = document.querySelector(selector) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;
      const actual = el?.value ?? null;
      assertStep(
        "expect.value",
        `${selector} value="${value}"`,
        actual === value,
        `Expected value="${value}", got "${actual}"`,
        selector,
      );
    },

    toHaveText: async (text: string) => {
      await wait(150);
      const el = document.querySelector(selector);
      const actual = el?.textContent?.trim() ?? null;
      assertStep(
        "expect.text",
        `${selector} text="${text}"`,
        actual === text,
        `Expected text="${text}", got "${actual}"`,
        selector,
      );
    },

    toBeVisible: async () => {
      await wait(150);
      const el = document.querySelector(selector) as HTMLElement | null;
      let visible = false;
      if (el) {
        const style = getComputedStyle(el);
        visible =
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          parseFloat(style.opacity) > 0;
      }
      assertStep(
        "expect.visible",
        selector,
        visible,
        `Expected ${selector} to be visible`,
        selector,
      );
    },

    toBeDisabled: async () => {
      await wait(150);
      const el = document.querySelector(selector) as
        | HTMLButtonElement
        | HTMLInputElement
        | null;
      const disabled =
        el?.disabled === true || el?.getAttribute("aria-disabled") === "true";
      assertStep(
        "expect.disabled",
        selector,
        disabled,
        `Expected ${selector} to be disabled`,
        selector,
      );
    },

    toHaveCount: async (n: number) => {
      await wait(150);
      const count = document.querySelectorAll(selector).length;
      assertStep(
        "expect.count",
        `${selector} ×${n}`,
        count === n,
        `Expected ${n} elements matching ${selector}, got ${count}`,
        selector,
      );
    },
  });

  return {
    click,
    press,
    type: typeText,
    expect,
    getByText,
    getAllByText,
    getByRole,
    wait: (ms: number) => wait(ms),
  };
}
