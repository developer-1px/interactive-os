/**
 * createDryRunPage — Mock Page that records actions without executing.
 *
 * Runs a TestScript.run() to extract step metadata (press/click/expect)
 * before actual execution. Used by TestBot panel to show step previews.
 *
 * The mock page implements the Page interface but does nothing:
 * - click/press → records BrowserStep
 * - locator → returns recording locator
 * - expect → records assert step
 * - keyboard → records press step
 *
 * Items parameter workaround: scripts that use `items[N]` receive
 * dummy IDs ("$1", "$2", ...) so selectors read as "#$1" in previews.
 */

import type { BrowserStep } from "@os-devtool/testing";
import type { ExpectLocator, TestScript } from "@os-testing/scripts";
import type { Locator, LocatorAssertions, Page } from "@os-testing/types";

/** Max dummy items to generate for scripts that use items parameter */
const DUMMY_ITEM_COUNT = 20;

/** Generate dummy item IDs: ["$1", "$2", ..., "$N"] */
function createDummyItems(): string[] {
  return Array.from({ length: DUMMY_ITEM_COUNT }, (_, i) => `$${i + 1}`);
}

/** Create a recording locator that captures actions as BrowserStep */
function createRecordingLocator(
  selector: string,
  steps: BrowserStep[],
): Locator {
  const noop: LocatorAssertions = {
    toHaveAttribute(_name: string, _value?: string | RegExp) {
      steps.push({
        action: "assert",
        detail: `${selector} → attr`,
        timestamp: 0,
      });
    },
    toBeFocused() {
      steps.push({
        action: "assert",
        detail: `${selector} → focused`,
        timestamp: 0,
      });
    },
    toBeChecked() {
      steps.push({
        action: "assert",
        detail: `${selector} → checked`,
        timestamp: 0,
      });
    },
    toBeDisabled() {
      steps.push({
        action: "assert",
        detail: `${selector} → disabled`,
        timestamp: 0,
      });
    },
    not: null as unknown as LocatorAssertions,
  };

  // Negated assertions also record (as "not X")
  const negated: LocatorAssertions = {
    toHaveAttribute(_name: string, _value?: string | RegExp) {
      steps.push({
        action: "assert",
        detail: `${selector} → not attr`,
        timestamp: 0,
      });
    },
    toBeFocused() {
      steps.push({
        action: "assert",
        detail: `${selector} → not focused`,
        timestamp: 0,
      });
    },
    toBeChecked() {
      steps.push({
        action: "assert",
        detail: `${selector} → not checked`,
        timestamp: 0,
      });
    },
    toBeDisabled() {
      steps.push({
        action: "assert",
        detail: `${selector} → not disabled`,
        timestamp: 0,
      });
    },
    not: noop,
  };

  noop.not = negated;

  return {
    click(opts?: { modifiers?: ("Meta" | "Shift" | "Control")[] }) {
      const mods = opts?.modifiers?.length
        ? ` [${opts.modifiers.join("+")}]`
        : "";
      steps.push({
        action: "click",
        detail: `${selector}${mods}`,
        timestamp: 0,
      });
    },
    getAttribute(_name: string) {
      return null;
    },
    inputValue() {
      return "";
    },
    ...noop,
  };
}

/** Create a mock Page that records all actions as BrowserStep[] */
function createDryRunPage(): { page: Page; steps: BrowserStep[] } {
  const steps: BrowserStep[] = [];

  const page: Page = {
    goto(_url: string) {
      // no-op in dry run
    },

    locator(selector: string) {
      return createRecordingLocator(selector, steps);
    },

    click(selector: string, opts?) {
      const mods = opts?.modifiers?.length
        ? ` [${opts.modifiers.join("+")}]`
        : "";
      steps.push({
        action: "click",
        detail: `${selector}${mods}`,
        timestamp: 0,
      });
    },

    content() {
      return "";
    },

    keyboard: {
      press(key: string) {
        steps.push({
          action: "press",
          detail: key,
          timestamp: 0,
        });
      },
      type(text: string) {
        steps.push({
          action: "press",
          detail: `type "${text}"`,
          timestamp: 0,
        });
      },
    },
  };

  return { page, steps };
}

/** Recording expect — captures assertions without checking */
const dryRunExpect: ExpectLocator = (locator: Locator) => locator;

/**
 * Run a TestScript in dry-run mode and extract its step list.
 *
 * Returns BrowserStep[] describing what the script would do.
 * If the script throws (e.g., runtime error), returns whatever
 * steps were recorded before the error.
 */
export async function dryRunScript(script: TestScript): Promise<BrowserStep[]> {
  const { page, steps } = createDryRunPage();
  const dummyItems = createDummyItems();

  try {
    await script.run(page, dryRunExpect, dummyItems);
  } catch {
    // Script may fail in dry-run (e.g., conditional logic on getAttribute).
    // Return whatever steps were recorded before the error.
  }

  return steps;
}

/**
 * Dry-run all scripts and return a map of script name → steps.
 */
export async function dryRunAll(
  scripts: TestScript[],
): Promise<Map<string, BrowserStep[]>> {
  const result = new Map<string, BrowserStep[]>();

  for (const script of scripts) {
    const steps = await dryRunScript(script);
    result.set(script.name, steps);
  }

  return result;
}
