/**
 * useTestBotRoutes — Hook for pages to register TestBot routes
 *
 * Returns `resetKey` — use as React `key` on page content to force
 * re-mount before each test run (fresh component state).
 *
 * @example
 * const resetKey = useTestBotRoutes("aria-showcase", defineAriaRoutes);
 * return <div key={resetKey}>...</div>;
 */

import { useEffect } from "react";
import type { TestBot } from "../entities/TestBot";
import { TestBotActions } from "./TestBotActions";
import { setActivePage, useTestBotStore } from "./TestBotStore";

export function useTestBotRoutes(
  pageId: string,
  definer: (bot: TestBot) => void,
): number {
  useEffect(() => {
    TestBotActions.register(pageId, definer);
    setActivePage(pageId); // Set this page as active

    return () => {
      setActivePage(null); // Clear active page on unmount
      TestBotActions.unregister(pageId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, definer]);

  return useTestBotStore((s) => s.resetKey);
}
