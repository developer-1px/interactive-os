import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

/**
 * Agent activity entry — one line from the JSONL log.
 */
export interface AgentActivityEntry {
  ts: string;
  session: string;
  tool: string;
  detail: string;
}

/**
 * Read and parse all JSONL files from the session-logs directory.
 * Returns entries sorted by timestamp (newest first), deduplicated by detail.
 */
function collectAgentActivity(
  logsDir: string,
  limit = 30,
): AgentActivityEntry[] {
  if (!fs.existsSync(logsDir)) return [];

  const files = fs
    .readdirSync(logsDir)
    .filter((f) => f.endsWith(".jsonl"))
    .sort()
    .reverse(); // newest day first

  const entries: AgentActivityEntry[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    if (entries.length >= limit) break;

    const content = fs.readFileSync(path.join(logsDir, file), "utf-8");
    const lines = content.trim().split("\n").reverse(); // newest first within file

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line) as AgentActivityEntry;
        // Deduplicate by detail (keep most recent occurrence)
        if (!seen.has(entry.detail)) {
          seen.add(entry.detail);
          entries.push(entry);
          if (entries.length >= limit) break;
        }
      } catch {
        // Skip malformed lines
      }
    }
  }

  return entries;
}

const VIRTUAL_ID = "virtual:agent-activity";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

export function agentActivityPlugin(): Plugin {
  let logsDir: string;

  return {
    name: "vite-plugin-agent-activity",

    configResolved(config) {
      logsDir = path.resolve(config.root, ".claude/session-logs");
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },

    load(id) {
      if (id !== RESOLVED_ID) return;
      const entries = collectAgentActivity(logsDir);
      return `export default ${JSON.stringify(entries)};`;
    },

    // HMR: watch session-logs directory and push updates via custom event
    configureServer(server) {
      // Ensure directory exists before watching
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const sendUpdate = () => {
        const entries = collectAgentActivity(logsDir);
        server.ws.send({
          type: "custom",
          event: "agent-activity-update",
          data: entries,
        });
      };

      server.watcher.add(logsDir);
      server.watcher.on("change", (filePath) => {
        if (filePath.startsWith(logsDir) && filePath.endsWith(".jsonl")) {
          sendUpdate();
        }
      });
      server.watcher.on("add", (filePath) => {
        if (filePath.startsWith(logsDir) && filePath.endsWith(".jsonl")) {
          sendUpdate();
        }
      });
    },
  };
}
