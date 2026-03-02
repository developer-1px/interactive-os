import type { Transaction } from "@kernel/core/transaction";
import { inferSignal } from "./inferSignal";

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
}

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch((err) => {
    console.error("Failed to copy context: ", err);
  });
}

export function copyAllToClipboard(transactions: Transaction[]) {
  const lines = transactions.map((tx) => {
    const signal = inferSignal(tx);
    return formatAiContext(tx, signal);
  });
  const text = lines.join("\n\n---\n\n");
  copyToClipboard(text);
}

/** Truncate large JSON values for LLM readability */
export function truncateValue(value: unknown, path: string): string {
  // History snapshots are noise — summarize
  if (/history\.(past|future)\[\d+\]$/.test(path)) {
    return "[history entry]";
  }
  if (/\.snapshot$/.test(path) || /\.snapshot\./.test(path)) {
    return "[snapshot]";
  }
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  const json = JSON.stringify(value);
  if (!json) return "undefined";
  if (json.length > 200) {
    return json.slice(0, 120) + "…[truncated, " + json.length + " chars]";
  }
  return json;
}

export function formatAiContext(
  tx: Transaction,
  signal: ReturnType<typeof inferSignal>,
): string {
  const trigger = `**Action**: ${signal.trigger.kind} (Raw: ${signal.trigger.raw}${signal.trigger.elementId ? `, Element: ${signal.trigger.elementId}` : ""})`;
  const command = `**Command**: \`${signal.command.type}\``;
  const payload = `**Payload**: \`${truncateValue(signal.command.payload, "payload")}\``;

  let diffStr = "**Diff**: None";
  if (signal.diff.length > 0) {
    // Filter out noisy history snapshot diffs entirely
    const meaningful = signal.diff.filter(
      (d) =>
        !/history\.(past|future)\[\d+\]\.(snapshot|timestamp)/.test(d.path),
    );
    if (meaningful.length > 0) {
      diffStr =
        "**Diff**:\n" +
        meaningful
          .map(
            (d) =>
              `  - \`${d.path}\`: \`${truncateValue(d.from, d.path)}\` -> \`${truncateValue(d.to, d.path)}\``,
          )
          .join("\n");
    } else {
      diffStr = "**Diff**: [history only]";
    }
  }

  let effectStr = "";
  if (signal.effects.length > 0) {
    effectStr =
      `\n**Effects**: \n` +
      signal.effects.map((e) => `  - \`${e}\``).join("\n");
  }

  return `**[Inspector Captured Event - ${formatTime(tx.timestamp)}]**\n- ${trigger}\n- ${command}\n- ${payload}\n${diffStr}${effectStr}`;
}
