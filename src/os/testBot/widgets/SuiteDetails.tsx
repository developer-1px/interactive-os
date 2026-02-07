/**
 * SuiteDetails — Step timeline view for a test suite
 */

import { AlertTriangle, Eye, Keyboard, MousePointerClick } from "lucide-react";
import type { StepResult } from "../entities/StepResult";

// ═══════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════

const FLASH_STYLE = `
@keyframes flash-bg {
    0% { background-color: rgba(59, 130, 246, 0.2); }
    100% { background-color: transparent; }
}
.animate-flash {
    animation: flash-bg 1s ease-out forwards;
}
`;

// ═══════════════════════════════════════════════════════════════════
// StepIcon
// ═══════════════════════════════════════════════════════════════════

function StepIcon({ step, isActive }: { step: StepResult; isActive: boolean }) {
  if (isActive)
    return (
      <div className="w-3 h-3 flex items-center justify-center bg-white rounded-full ring-2 ring-blue-500 z-10 relative">
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
      </div>
    );
  const bgWrap = "bg-white z-10 relative rounded-full";
  if (step.action === "error" || step.error)
    return <AlertTriangle size={14} className={`text-red-500 ${bgWrap}`} />;
  if (step.action === "click")
    return (
      <MousePointerClick size={14} className={`text-blue-500 ${bgWrap}`} />
    );
  if (step.action === "press")
    return <Keyboard size={14} className={`text-slate-500 ${bgWrap}`} />;
  if (step.action.startsWith("expect"))
    return (
      <Eye
        size={14}
        className={`${step.passed ? "text-emerald-500" : "text-slate-400"} ${bgWrap}`}
      />
    );
  return <div className={`w-2 h-2 rounded-full bg-slate-200 ${bgWrap}`} />;
}

// ═══════════════════════════════════════════════════════════════════
// SuiteDetails
// ═══════════════════════════════════════════════════════════════════

export function SuiteDetails({
  steps,
  isRunning,
  activeStepIndex,
}: {
  steps: StepResult[];
  isRunning?: boolean;
  activeStepIndex?: number;
}) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="relative pb-2">
      <style>{FLASH_STYLE}</style>

      {/* Timeline Line */}
      <div className="absolute left-[24px] top-[-8px] bottom-6 w-px bg-slate-200 z-0" />

      {steps.map((step, i) => {
        const isActive = isRunning && i === activeStepIndex;
        const isPending =
          isRunning && activeStepIndex !== undefined && i > activeStepIndex;
        const isExpect = step.action.startsWith("expect");
        const isLast = i === steps.length - 1;

        return (
          <div
            key={i}
            ref={(el) => {
              if (isActive && el)
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            data-testbot-step={i}
            data-testbot-action={step.action}
            data-testbot-step-result={
              step.passed ? "pass" : step.error ? "fail" : "pending"
            }
            className={`group flex items-start pl-3 pr-2 py-1.5 transition-colors relative ${
              isActive
                ? "bg-blue-50/50"
                : isPending
                  ? "opacity-50"
                  : "hover:bg-slate-50"
            } ${isLast && !isPending && !isActive ? "animate-flash" : ""}`}
          >
            {/* Icon (Centered on timeline) */}
            <div className="shrink-0 w-6 flex justify-center mr-2 pt-0.5">
              <StepIcon step={step} isActive={!!isActive} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 text-[11px] leading-relaxed pt-0.5">
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`font-mono text-[9px] select-none font-bold ${isActive ? "text-blue-600" : "text-slate-500"}`}
                >
                  #{i + 1}
                </span>

                <span
                  className={`font-semibold tracking-wide uppercase text-[9px] ${
                    isActive
                      ? "text-blue-700"
                      : step.action === "click"
                        ? "text-blue-600"
                        : step.action === "press"
                          ? "text-slate-500"
                          : isExpect
                            ? isPending
                              ? "text-slate-400"
                              : step.passed
                                ? "text-emerald-600"
                                : "text-red-600"
                            : "text-slate-500"
                  }`}
                >
                  {isExpect ? "Expect" : step.action}
                </span>

                <span
                  className={`font-mono truncate ${
                    isActive
                      ? "text-blue-900"
                      : isPending
                        ? "text-slate-400"
                        : step.passed
                          ? "text-slate-700"
                          : "text-red-700 font-medium"
                  }`}
                >
                  {isExpect
                    ? step.detail.replace(/^(Expect )/, "")
                    : step.detail}
                </span>
              </div>

              {step.error && (
                <div
                  data-testbot-error
                  className="mt-1 px-2 py-1.5 bg-red-50/50 text-red-600 rounded border border-red-100/50 font-mono text-[10px] break-all"
                >
                  {step.error}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
