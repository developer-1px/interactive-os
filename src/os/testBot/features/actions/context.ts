/**
 * TestBot — Failure Context Dump
 *
 * Captures current DOM state (active element, role, text) when a test fails,
 * so LLM agents can self-diagnose without a screenshot.
 */

export function captureFailureContext(): string {
  const active = document.activeElement;
  let context = "\n\n[Failure Context]";

  if (active) {
    const id = active.id ? `#${active.id}` : "";
    const role = active.getAttribute("role") ?? "";
    const tag = active.tagName.toLowerCase();
    context += `\n→ Active: <${tag}${id}${role ? ` role="${role}"` : ""}>`;
    if (active.textContent) {
      const text = active.textContent.slice(0, 50).trim().replace(/\s+/g, " ");
      context += ` "${text}${active.textContent.length > 50 ? "..." : ""}"`;
    }
  } else {
    context += "\n→ Active: (none)";
  }

  return context;
}
