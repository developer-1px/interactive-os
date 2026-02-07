/**
 * TestBotActions — Static action methods for TestBot control
 *
 * Callable from anywhere (pages, Inspector, console).
 * Manages route registration and test execution lifecycle.
 */

import type { RouteDefiner } from "./TestBotStore";
import { rebuildBot, swapBot, useTestBotStore } from "./TestBotStore";

// ═══════════════════════════════════════════════════════════════════
// Actions
// ═══════════════════════════════════════════════════════════════════

export const TestBotActions = {
  register(pageId: string, definer: RouteDefiner) {
    const next = new Map(useTestBotStore.getState().routeDefiners);
    next.set(pageId, definer);
    swapBot(next);
  },

  unregister(pageId: string) {
    const next = new Map(useTestBotStore.getState().routeDefiners);
    next.delete(pageId);
    swapBot(next);
  },

  async runAll() {
    const { bot, isRunning } = useTestBotStore.getState();
    if (isRunning) return;

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
    const { bot, routeDefiners } = useTestBotStore.getState();
    bot.destroy();
    const newBot = rebuildBot(routeDefiners);

    useTestBotStore.setState({
      bot: newBot,
      isRunning: false,
      currentSuiteIndex: -1,
    });
  },
};
