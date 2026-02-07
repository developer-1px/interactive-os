/**
 * ARIA Showcase — TestBot Route Definitions
 *
 * Comprehensive test suite for all ARIA patterns.
 * Each pattern is separated into its own test file for maintainability.
 */

import type { TestBot } from "@os/testBot";
import { defineTabsTests } from "./TabsTest";
import { defineMenuTests } from "./MenuTest";
import { defineListboxTests } from "./ListboxTest";
import { defineRadiogroupTests } from "./RadiogroupTest";
import { defineToolbarTests } from "./ToolbarTest";
import { defineGridTests } from "./GridTest";
import { defineTreeTests } from "./TreeTest";
import {
    defineMenubarTests,
    defineComboboxTests,
    defineAccordionTests,
    defineDialogTests,
    defineAlertDialogTests,
    defineFeedTests,
} from "./ComplexPatternsTest";

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
