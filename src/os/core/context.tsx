import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { logger } from "@os/debug/logger";
import type { ReactNode, FC } from "react";
import type { ContextState, ContextKey, ContextValue, LogicNode } from "@os/core/logic/types";
import { evalContext, compileWhen } from "@os/core/logic/evaluator";

// Re-export for module consumers
export { evalContext, compileWhen };
export type { ContextState, ContextKey, ContextValue, LogicNode };

// OS Sentinels for Command Payloads
export const OS = {
  FOCUS: "OS.FOCUS",
  SELECTION: "OS.SELECTION",
} as const;


// --- React Context Integration ---

const GlobalContext = createContext<{
  context: ContextState;
  setContext: (key: ContextKey, value: ContextValue) => void;
  updateContext: (updates: ContextState) => void;
}>({ context: {}, setContext: () => { }, updateContext: () => { } });

export const ContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [context, setCtx] = useState<ContextState>({});

  const pendingLogUpdates = useRef<ContextState>({});
  const logTimeoutRef = useRef<any>(null);

  const setContext = useCallback((key: ContextKey, value: ContextValue) => {
    setCtx((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const updateContext = useCallback((updates: ContextState) => {
    setCtx((prev) => {
      const keys = Object.keys(updates);
      const hasChanged = keys.some((k) => prev[k] !== updates[k]);

      if (!hasChanged) return prev;

      // Debounced Logging: Accumulate updates and log once every 500ms
      Object.assign(pendingLogUpdates.current, updates);

      if (logTimeoutRef.current) {
        clearTimeout(logTimeoutRef.current);
      }

      logTimeoutRef.current = setTimeout(() => {
        logger.debug("CONTEXT", "Sync (Debounced) ->", {
          ...pendingLogUpdates.current,
        });
        pendingLogUpdates.current = {}; // Reset after log
        logTimeoutRef.current = null;
      }, 500);

      return { ...prev, ...updates };
    });
  }, []);

  const value = useMemo(
    () => ({ context, setContext, updateContext }),
    [context, setContext, updateContext],
  );

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};

export const useContextService = () => useContext(GlobalContext);
