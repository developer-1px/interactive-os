import type { OnProgress, OnStep, SuiteResult } from "./SuiteResult";
import type { TestActions } from "./TestActions";

export interface TestBot {
  describe(name: string, fn: (t: TestActions) => Promise<void>): void;
  dryRun(): Promise<SuiteResult[]>;
  runAll(onProgress?: OnProgress, onStep?: OnStep): Promise<SuiteResult[]>;
  runSuite(index: number, onStep?: OnStep): Promise<SuiteResult>;
  destroy(): void;
}
