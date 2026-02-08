/**
 * TestBotActions — Static action methods for TestBot control
 *
 * Callable from anywhere (pages, Inspector, console).
 * Manages route registration and test execution lifecycle.
 */

import type { RouteDefiner } from "./TestBotStore";
import { rebuildBot, useTestBotStore } from "./TestBotStore";

// ═══════════════════════════════════════════════════════════════════
// Actions
// ═══════════════════════════════════════════════════════════════════

export const TestBotActions = {
  register(pageId: string, definer: RouteDefiner) {
    const next = new Map(useTestBotStore.getState().routeDefiners);
    next.set(pageId, definer);

    const { activePageId, bot } = useTestBotStore.getState();
    bot.destroy();

    // Rebuild bot with route filtering
    const newBot = rebuildBot(next, activePageId);

    useTestBotStore.setState({
      routeDefiners: next,
      bot: newBot,
      suites: [],
    });

    newBot.dryRun().then((plan) => {
      useTestBotStore.setState({ suites: plan });
    });
  },

  unregister(pageId: string) {
    const next = new Map(useTestBotStore.getState().routeDefiners);
    next.delete(pageId);

    const { activePageId, bot } = useTestBotStore.getState();
    bot.destroy();

    // Rebuild bot with remaining routes
    const newBot = rebuildBot(next, activePageId);

    useTestBotStore.setState({
      routeDefiners: next,
      bot: newBot,
      suites: [],
    });

    newBot.dryRun().then((plan) => {
      useTestBotStore.setState({ suites: plan });
    });
  },

  async runAll() {
    const { isRunning } = useTestBotStore.getState();
    if (isRunning) return;

    // Increment resetKey to force page re-mount (fresh component state)
    useTestBotStore.setState((s) => ({ resetKey: s.resetKey + 1 }));

    // Wait for React to re-render and re-mount the page component
    await new Promise((r) => setTimeout(r, 300));

    // Re-read bot after re-mount (page may have re-registered routes)
    const { bot } = useTestBotStore.getState();
    const startedSuites = new Set<number>();

    useTestBotStore.setState({ isRunning: true, currentSuiteIndex: 0 });

    const finalResults = await bot.runAll(
      // onProgress — Suite completed
      (progress) => {
        const index = progress.length - 1;
        useTestBotStore.setState((state) => {
          const nextSuites = [...state.suites];
          if (nextSuites[index]) nextSuites[index] = { ...progress[index] };
          return { suites: nextSuites, currentSuiteIndex: index + 1 };
        });
      },
      // onStep — Real-time step updates
      (suiteIndex, step) => {
        const isFirstStep = !startedSuites.has(suiteIndex);
        if (isFirstStep) startedSuites.add(suiteIndex);

        useTestBotStore.setState((state) => {
          const nextSuites = [...state.suites];
          const target = nextSuites[suiteIndex];
          if (!target) return state;

          nextSuites[suiteIndex] = {
            ...target,
            status: "running",
            steps: isFirstStep ? [step] : [...target.steps, step],
          };
          return { suites: nextSuites, currentSuiteIndex: suiteIndex };
        });
      },
    );

    useTestBotStore.setState({
      suites: finalResults,
      isRunning: false,
      currentSuiteIndex: -1,
    });
  },

  async runSuite(index: number) {
    const { bot, isRunning } = useTestBotStore.getState();
    if (isRunning) return;

    useTestBotStore.setState({ isRunning: true, currentSuiteIndex: index });

    // Mark as running
    useTestBotStore.setState((state) => {
      const nextSuites = [...state.suites];
      if (nextSuites[index])
        nextSuites[index] = {
          ...nextSuites[index],
          status: "running",
          steps: [],
        };
      return { suites: nextSuites };
    });

    const result = await bot.runSuite(
      index,
      // onStep
      (_suiteIndex, step) => {
        useTestBotStore.setState((state) => {
          const nextSuites = [...state.suites];
          const target = nextSuites[index];
          if (!target) return state;
          nextSuites[index] = { ...target, steps: [...target.steps, step] };
          return { suites: nextSuites };
        });
      },
    );

    useTestBotStore.setState((state) => {
      const nextSuites = [...state.suites];
      nextSuites[index] = result;
      return { suites: nextSuites, isRunning: false, currentSuiteIndex: -1 };
    });
  },

  stop() {
    const { bot, routeDefiners, activePageId } = useTestBotStore.getState();
    bot.destroy();
    const newBot = rebuildBot(routeDefiners, activePageId);

    useTestBotStore.setState({
      bot: newBot,
      isRunning: false,
      currentSuiteIndex: -1,
    });
  },
};
