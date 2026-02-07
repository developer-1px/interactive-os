/**
 * ARIA Showcase — TestBot Route Definitions
 *
 * Comprehensive test suite for all ARIA patterns.
 * Each pattern is separated into its own test file for maintainability.
 */

import type { TestBot } from "@os/testBot";
import {
  defineAccordionTests,
  defineAlertDialogTests,
  defineComboboxTests,
  defineDialogTests,
  defineFeedTests,
  defineMenubarTests,
} from "./ComplexPatternsTest";
import { defineGridTests } from "./GridTest";
import { defineListboxTests } from "./ListboxTest";
import { defineMenuTests } from "./MenuTest";
import { defineRadiogroupTests } from "./RadiogroupTest";
import { defineTabsTests } from "./TabsTest";
import { defineToolbarTests } from "./ToolbarTest";
import { defineTreeTests } from "./TreeTest";

export function defineAriaRoutes(bot: TestBot) {
  // Register all ARIA pattern tests
  defineTabsTests(bot);
  defineMenuTests(bot);
  defineListboxTests(bot);
  defineRadiogroupTests(bot);
  defineToolbarTests(bot);
  defineGridTests(bot);
  defineTreeTests(bot);
  defineMenubarTests(bot);
  defineComboboxTests(bot);
  defineAccordionTests(bot);
  defineDialogTests(bot);
  defineAlertDialogTests(bot);
  defineFeedTests(bot);
}
