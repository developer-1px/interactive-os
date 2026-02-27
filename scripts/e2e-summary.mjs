#!/usr/bin/env node
/**
 * e2e-summary.mjs — Playwright JSON 결과를 한 눈에 보는 요약 출력
 *
 * Usage:
 *   node scripts/e2e-summary.mjs                          # default: test-results/e2e-results.json
 *   node scripts/e2e-summary.mjs path/to/results.json     # custom path
 *
 * Output: 테스트 이름, 상태(pass/fail), 실패 시 에러 메시지 1줄
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const file = process.argv[2] || "test-results/e2e-results.json";
const raw = JSON.parse(readFileSync(resolve(file), "utf-8"));

let passed = 0;
let failed = 0;
const failures = [];

for (const suite of raw.suites ?? []) {
    walkSuite(suite, []);
}

function walkSuite(suite, path) {
    const current = [...path, suite.title].filter(Boolean);
    for (const spec of suite.specs ?? []) {
        for (const test of spec.tests ?? []) {
            for (const result of test.results ?? []) {
                const title = [...current, spec.title].filter(Boolean).join(" › ");
                if (result.status === "passed") {
                    passed++;
                } else {
                    failed++;
                    const errMsg = result.error?.message?.split("\n")[0] ?? "unknown";
                    failures.push({ title, status: result.status, error: errMsg });
                }
            }
        }
    }
    for (const child of suite.suites ?? []) {
        walkSuite(child, current);
    }
}

console.log(`\n📊 E2E Summary: ${passed} passed, ${failed} failed\n`);

if (failures.length > 0) {
    console.log("❌ Failures:");
    for (const f of failures) {
        console.log(`  ${f.status.toUpperCase()} │ ${f.title}`);
        console.log(`       └─ ${f.error.slice(0, 120)}`);
    }
}

if (failures.length === 0) {
    console.log("✅ All tests passed!");
}

console.log("");
