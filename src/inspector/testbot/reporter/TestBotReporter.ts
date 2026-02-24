/**
 * TestBot Reporter — Vitest custom reporter for TestBot v2
 *
 * Captures test lifecycle events (suite/test start/end, pass/fail)
 * and writes a structured JSON report to `testbot-report.json`.
 *
 * Usage in vitest.browser.config.ts:
 *   reporters: [new TestBotReporter()]
 *
 * Output: testbot-report.json in project root
 *   → TestBot Panel loads this file for visual replay
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Reporter, TestCase, TestModule, TestSuite } from "vitest/node";

// ═══════════════════════════════════════════════════════════════════
// Types (mirroring TestStep.ts but for Node.js reporter context)
// ═══════════════════════════════════════════════════════════════════

interface ReportTestEntry {
  name: string;
  status: "pass" | "fail" | "skip";
  duration: number;
  error?: string;
}

interface ReportSuiteEntry {
  name: string;
  tests: ReportTestEntry[];
  suites: ReportSuiteEntry[];
}

interface ReportFileEntry {
  file: string;
  duration: number;
  suites: ReportSuiteEntry[];
}

interface TestBotJsonReport {
  version: 2;
  createdAt: string;
  duration: number;
  summary: {
    files: number;
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  files: ReportFileEntry[];
}

// ═══════════════════════════════════════════════════════════════════
// Reporter
// ═══════════════════════════════════════════════════════════════════

export class TestBotReporter implements Reporter {
  private outputPath: string;

  constructor(outputPath?: string) {
    this.outputPath =
      outputPath ?? resolve(process.cwd(), "public", "testbot-report.json");
  }

  onTestRunEnd(testModules: ReadonlyArray<TestModule>) {
    const startTime = Date.now();
    const files: ReportFileEntry[] = [];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    for (const testModule of testModules) {
      const fileEntry: ReportFileEntry = {
        file: testModule.moduleId,
        duration: testModule.diagnostic()?.duration ?? 0,
        suites: [],
      };

      for (const child of testModule.children) {
        if (child.type === "suite") {
          const suiteEntry = this.processSuite(child as TestSuite);
          fileEntry.suites.push(suiteEntry);
        } else if (child.type === "test") {
          // Top-level test (no suite)
          const testEntry = this.processTest(child as TestCase);
          // Wrap in an implicit suite
          const existing = fileEntry.suites.find((s) => s.name === "(root)");
          if (existing) {
            existing.tests.push(testEntry);
          } else {
            fileEntry.suites.push({
              name: "(root)",
              tests: [testEntry],
              suites: [],
            });
          }
        }
      }

      files.push(fileEntry);
    }

    // Count totals
    for (const file of files) {
      const counts = this.countTests(file.suites);
      totalTests += counts.total;
      passedTests += counts.passed;
      failedTests += counts.failed;
      skippedTests += counts.skipped;
    }

    const report: TestBotJsonReport = {
      version: 2,
      createdAt: new Date().toISOString(),
      duration: Date.now() - startTime,
      summary: {
        files: files.length,
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        skipped: skippedTests,
      },
      files,
    };

    writeFileSync(this.outputPath, JSON.stringify(report, null, 2), "utf-8");
  }

  private processSuite(suite: TestSuite): ReportSuiteEntry {
    const entry: ReportSuiteEntry = {
      name: suite.name,
      tests: [],
      suites: [],
    };

    for (const child of suite.children) {
      if (child.type === "suite") {
        entry.suites.push(this.processSuite(child as TestSuite));
      } else if (child.type === "test") {
        entry.tests.push(this.processTest(child as TestCase));
      }
    }

    return entry;
  }

  private processTest(test: TestCase): ReportTestEntry {
    const result = test.result();
    const diagnostic = test.diagnostic();

    let status: "pass" | "fail" | "skip" = "skip";
    let error: string | undefined;

    if (result.state === "passed") {
      status = "pass";
    } else if (result.state === "failed") {
      status = "fail";
      const errors = result.errors;
      if (errors && errors.length > 0) {
        error = errors?.[0]?.message;
      }
    }

    return {
      name: test.name,
      status,
      duration: diagnostic?.duration ?? 0,
      ...(error && { error }),
    };
  }

  private countTests(suites: ReportSuiteEntry[]): {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  } {
    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    for (const suite of suites) {
      for (const test of suite.tests) {
        total++;
        if (test.status === "pass") passed++;
        else if (test.status === "fail") failed++;
        else skipped++;
      }

      const nested = this.countTests(suite.suites);
      total += nested.total;
      passed += nested.passed;
      failed += nested.failed;
      skipped += nested.skipped;
    }

    return { total, passed, failed, skipped };
  }
}
