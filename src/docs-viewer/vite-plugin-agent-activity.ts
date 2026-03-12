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
  commitMessage?: string;
}

/**
 * Read and parse all JSONL files from the session-logs directory.
 * Returns entries sorted by timestamp (newest first), deduplicated by detail.
 */
function collectAgentActivity(
  logsDir: string,
  limit = 100,
): AgentActivityEntry[] {
  if (!fs.existsSync(logsDir)) return [];

  const files = fs
    .readdirSync(logsDir)
    .filter((f) => f.endsWith(".jsonl"))
    .sort()
    .reverse(); // newest day first

  const entries: AgentActivityEntry[] = [];

  for (const file of files) {
    if (entries.length >= limit) break;

    const content = fs.readFileSync(path.join(logsDir, file), "utf-8");
    const lines = content.trim().split("\n").reverse(); // newest first within file

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line) as AgentActivityEntry;
        entries.push(entry);
        if (entries.length >= limit) break;
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
  let projectRoot: string;

  return {
    name: "vite-plugin-agent-activity",

    configResolved(config) {
      projectRoot = config.root;
      logsDir = path.resolve(projectRoot, ".claude/session-logs");
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
    // API: serve raw project files for agent activity viewer
    configureServer(server) {
      // --- /api/file middleware: serve raw file content ---
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/file?")) return next();

        const url = new URL(req.url, "http://localhost");
        const filePath = url.searchParams.get("path");
        if (!filePath) {
          res.statusCode = 400;
          res.end("Missing ?path= parameter");
          return;
        }

        // Resolve to absolute, then enforce project root boundary
        const absolute = path.resolve(projectRoot, filePath);
        if (!absolute.startsWith(`${projectRoot}/`)) {
          res.statusCode = 403;
          res.end("Access denied: outside project root");
          return;
        }

        fs.readFile(absolute, "utf-8", (err, content) => {
          if (err) {
            res.statusCode = 404;
            res.end(`File not found: ${filePath}`);
            return;
          }
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(content);
        });
      });

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
