/**
 * APG Showcase TestBot Scripts — Re-export bundle
 *
 * Each pattern has its own file for maintainability.
 * This index re-exports individual scripts and the combined bundle.
 */

import type { TestScript } from "../../types";

export { apgListboxSingleScript } from "./listbox-single";
export { apgListboxMultiScript } from "./listbox-multi";
export { apgTabsAutoScript } from "./tabs";
export { apgTreeScript } from "./tree";
export { apgToolbarScript } from "./toolbar";
export { apgAccordionScript } from "./accordion";
export { apgMenuScript } from "./menu";
export { apgGridScript } from "./grid";
export { apgSwitchScript } from "./switch";
export { apgSliderScript } from "./slider";
export { apgRadiogroupScript } from "./radiogroup";
export { apgCheckboxScript } from "./checkbox";
export { apgDisclosureScript } from "./disclosure";
export { apgTooltipScript } from "./tooltip";
export { apgButtonScript } from "./button";
export { apgFeedScript } from "./feed";
export { apgCarouselScript } from "./carousel";
export { apgMenuButtonScript } from "./menu-button";
export { apgMeterScript } from "./meter";
export { apgSpinbuttonScript } from "./spinbutton";
export { apgSliderMultiThumbScript } from "./slider-multithumb";
export { apgTreegridScript } from "./treegrid";
export { apgWindowSplitterScript } from "./window-splitter";

// Individual imports for bundle array
import { apgListboxSingleScript } from "./listbox-single";
import { apgListboxMultiScript } from "./listbox-multi";
import { apgTabsAutoScript } from "./tabs";
import { apgTreeScript } from "./tree";
import { apgToolbarScript } from "./toolbar";
import { apgAccordionScript } from "./accordion";
import { apgMenuScript } from "./menu";
import { apgGridScript } from "./grid";
import { apgSwitchScript } from "./switch";
import { apgSliderScript } from "./slider";
import { apgRadiogroupScript } from "./radiogroup";
import { apgCheckboxScript } from "./checkbox";
import { apgDisclosureScript } from "./disclosure";
import { apgTooltipScript } from "./tooltip";
import { apgButtonScript } from "./button";
import { apgFeedScript } from "./feed";
import { apgCarouselScript } from "./carousel";
import { apgMenuButtonScript } from "./menu-button";
import { apgMeterScript } from "./meter";
import { apgSpinbuttonScript } from "./spinbutton";
import { apgSliderMultiThumbScript } from "./slider-multithumb";
import { apgTreegridScript } from "./treegrid";
import { apgWindowSplitterScript } from "./window-splitter";

export const apgShowcaseScripts: TestScript[] = [
    apgListboxSingleScript,
    apgListboxMultiScript,
    apgTabsAutoScript,
    apgTreeScript,
    apgToolbarScript,
    apgAccordionScript,
    apgMenuScript,
    apgGridScript,
    apgSwitchScript,
    apgSliderScript,
    apgRadiogroupScript,
    apgCheckboxScript,
    apgDisclosureScript,
    apgTooltipScript,
    apgButtonScript,
    apgFeedScript,
    apgCarouselScript,
    apgMenuButtonScript,
    apgMeterScript,
    apgSpinbuttonScript,
    apgSliderMultiThumbScript,
    apgTreegridScript,
    apgWindowSplitterScript,
];
