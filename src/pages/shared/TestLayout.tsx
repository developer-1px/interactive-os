import { useState } from "react";

interface TestBoxProps {
  title: string;
  status: "idle" | "running" | "pass" | "fail";
  logs: string[];
  onRun: () => void;
  children: React.ReactNode;
  description?: React.ReactNode;
}

export function TestBox({
  title,
  status,
  logs,
  onRun,
  children,
  description,
}: TestBoxProps) {
  const [showLogs, setShowLogs] = useState(false);
  const [showDocs, setShowDocs] = useState(true);

  return (
    <div
      className={`
            border rounded-lg overflow-hidden flex flex-col bg-white shadow-sm
            ${
              status === "running"
                ? "border-amber-400"
                : status === "pass"
                  ? "border-emerald-400"
                  : status === "fail"
                    ? "border-red-400"
                    : "border-gray-200"
            }
        `}
    >
      {/* Header */}
      <div className="bg-gray-50 p-2 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              status === "running"
                ? "bg-amber-500 animate-pulse"
                : status === "pass"
                  ? "bg-emerald-500"
                  : status === "fail"
                    ? "bg-red-500"
                    : "bg-gray-300"
            }`}
          />
          <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDocs(!showDocs)}
            className={`text-[10px] px-2 py-0.5 rounded border ${
              showDocs
                ? "text-gray-700 border-gray-300 bg-gray-100"
                : "border-transparent text-gray-400"
            }`}
          >
            Docs
          </button>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className={`text-[10px] px-2 py-0.5 rounded border ${
              logs.length > 0
                ? "border-gray-300 text-gray-600 hover:bg-gray-100"
                : "border-transparent text-gray-400"
            }`}
            disabled={logs.length === 0}
          >
            Logs ({logs.length})
          </button>
          <button
            onClick={onRun}
            disabled={status === "running"}
            data-test-run
            className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-3 py-0.5 rounded font-medium disabled:opacity-50"
          >
            RUN
          </button>
        </div>
      </div>

      {/* Documentation / Description */}
      {showDocs && description && (
        <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 text-gray-600 text-xs leading-relaxed">
          {description}
        </div>
      )}

      {/* Logs Area (Collapsible) */}
      {showLogs && logs.length > 0 && (
        <div className="bg-gray-100 p-2 border-b border-gray-200 max-h-32 overflow-y-auto">
          <div className="space-y-1 font-mono text-[10px]">
            {logs.map((log, i) => (
              <div
                key={i}
                className={`truncate ${
                  log.startsWith("✅")
                    ? "text-emerald-600"
                    : log.startsWith("❌")
                      ? "text-red-600"
                      : log.startsWith("→")
                        ? "text-blue-600"
                        : "text-gray-500"
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Content (The actual FocusGroup) */}
      <div className="p-4 bg-white relative flex-1 min-h-[120px]">
        {children}
      </div>
    </div>
  );
}

export function TestGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {children}
    </div>
  );
}

export function useTestState() {
  const [status, setStatus] = useState<TestBoxProps["status"]>("idle");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);
  const clearLogs = () => setLogs([]);

  return { status, setStatus, logs, addLog, clearLogs };
}
