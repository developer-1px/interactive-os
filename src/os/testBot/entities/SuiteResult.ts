import type { StepResult } from "./StepResult";

export type SuiteStatus = "planned" | "running" | "done";

export interface SuiteResult {
  name: string;
  steps: StepResult[];
  passed: boolean;
  status: SuiteStatus;
}

export type OnProgress = (results: SuiteResult[]) => void;
export type OnStep = (suiteIndex: number, step: StepResult) => void;
