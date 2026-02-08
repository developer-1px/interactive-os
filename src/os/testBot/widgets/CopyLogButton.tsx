/**
 * CopyLogButton — Copy test scenario log to clipboard
 */

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { SuiteResult } from "../entities/SuiteResult";

// ═══════════════════════════════════════════════════════════════════
// Log Generator
// ═══════════════════════════════════════════════════════════════════

export function generateSuiteLog(suite: SuiteResult): string {
  const status = suite.passed ? "PASS" : "FAIL";
  const steps = suite.steps
    .map((s, i) => {
      const icon = s.error ? "❌" : s.passed ? "✅" : "⬜";
      const action = s.action.toUpperCase();
      const detail = s.detail;
      const error = s.error ? `\n   Error: ${s.error}` : "";
      return `${i + 1}. ${icon} [${action}] ${detail}${error}`;
    })
    .join("\n");

  return `## Test Scenario: ${suite.name}
Status: ${status}
Steps: ${suite.steps.length}

### Execution Log
${steps}
`;
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function CopyLogButton({ suite }: { suite: SuiteResult }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const log = generateSuiteLog(suite);
    navigator.clipboard.writeText(log).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`shrink-0 p-1.5 rounded-full transition-all duration-200 ${
        copied
          ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
          : "text-slate-300 hover:text-blue-500 hover:bg-blue-50"
      }`}
      title="Copy Scenario Log"
    >
      {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />}
    </button>
  );
}
