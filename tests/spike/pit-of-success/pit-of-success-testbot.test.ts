/**
 * Pit of Success — TestBot runner (runScenarios).
 *
 * Bridges testbot-pit-of-success.ts scenarios to vitest.
 */

import { runScenarios } from "@os-testing/runScenarios";
import { PitApp } from "../../../src/spike/pit-of-success/app";
import { scenarios } from "../../../src/spike/pit-of-success/testbot-pit-of-success";

runScenarios(scenarios, PitApp);
