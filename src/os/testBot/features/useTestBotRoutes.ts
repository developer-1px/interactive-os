/**
 * useTestBotRoutes — Hook for pages to register TestBot routes
 *
 * @example
 * useTestBotRoutes("aria-showcase", (bot) => {
 *   bot.describe("Tabs", async (t) => {
 *     await t.click("#tab-1");
 *     await t.expect("#tab-1").focused();
 *   });
 * });
 */

import { useEffect } from "react";
import type { TestBot } from "../entities/TestBot";
import { TestBotActions } from "./TestBotActions";

export function useTestBotRoutes(
  pageId: string,
  definer: (bot: TestBot) => void,
) {
  useEffect(() => {
    TestBotActions.register(pageId, definer);
    return () => TestBotActions.unregister(pageId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);
}
