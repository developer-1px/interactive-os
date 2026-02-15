import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ChevronDown,
  ChevronRight,
  Database,
  Layers,
  Shield,
  Terminal,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { kernel } from "@/os/kernel";

// -----------------------------------------------------------------------------
// Route Definition
// -----------------------------------------------------------------------------

export const Route = createFileRoute("/playground/poc-registry-monitor")({
  component: PocRegistryMonitor,
  staticData: {
    title: "Registry PoC",
    icon: Database,
  },
});

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ScopeNode {
  id: string;
  commands: string[];
  whenGuards: string[];
  middleware: string[];
  effects: string[];
  children: ScopeNode[];
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

function PocRegistryMonitor() {
  const registry = useMemo(() => kernel.inspector.getRegistry(), []);
  const lastTx = kernel.inspector.getLastTransaction();
  const transactions = kernel.inspector.getTransactions();

  // Build scope tree from flat parentMap
  const scopeTree = useMemo(() => {
    const {
      commands,
      whenGuards,
      scopeTree: tree,
      middleware,
      effects,
    } = registry;

    // Collect all known scopes
    const allScopes = new Set<string>();
    for (const scope of commands.keys()) allScopes.add(scope);
    for (const child of tree.keys()) {
      allScopes.add(child);
      allScopes.add(tree.get(child)!);
    }

    // Build nodes
    const nodeMap = new Map<string, ScopeNode>();
    for (const id of allScopes) {
      nodeMap.set(id, {
        id,
        commands: commands.get(id) ?? [],
        whenGuards: whenGuards.get(id) ?? [],
        middleware: middleware.get(id) ?? [],
        effects: effects.get(id) ?? [],
        children: [],
      });
    }

    // Wire parent-child
    const roots: ScopeNode[] = [];
    for (const [child, parent] of tree) {
      const parentNode = nodeMap.get(parent);
      const childNode = nodeMap.get(child);
      if (parentNode && childNode) {
        parentNode.children.push(childNode);
      }
    }

    // Find roots (nodes that aren't children of anyone)
    const childSet = new Set(tree.keys());
    for (const id of allScopes) {
      if (!childSet.has(id)) {
        const node = nodeMap.get(id);
        if (node) roots.push(node);
      }
    }

    return roots;
  }, [registry]);

  // Stats
  const totalCommands = useMemo(() => {
    let count = 0;
    for (const cmds of registry.commands.values()) count += cmds.length;
    return count;
  }, [registry]);

  const totalScopes = useMemo(() => {
    const all = new Set<string>();
    for (const s of registry.commands.keys()) all.add(s);
    for (const [c, p] of registry.scopeTree) {
      all.add(c);
      all.add(p);
    }
    return all.size;
  }, [registry]);

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#C9D1D9] font-mono selection:bg-indigo-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-[#161B22]/95 backdrop-blur-md border-b border-[#30363D]">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Database size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-[#E6EDF3] text-sm tracking-tight">
                Registry Monitor
              </h1>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#8B949E]">
                PoC — v5 Kernel Direct
              </p>
            </div>
          </div>

          {/* Stats Pills */}
          <div className="flex items-center gap-2">
            <StatPill
              icon={<Terminal size={10} />}
              label="Commands"
              value={totalCommands}
              color="emerald"
            />
            <StatPill
              icon={<Layers size={10} />}
              label="Scopes"
              value={totalScopes}
              color="cyan"
            />
            <StatPill
              icon={<Activity size={10} />}
              label="Txns"
              value={transactions.length}
              color="amber"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 flex gap-6">
        {/* Left: Scope Tree */}
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Scope Tree"
            subtitle="kernel.getRegistry()"
            icon={<Layers size={14} />}
          />
          <div className="mt-3 space-y-1">
            {scopeTree.map((node) => (
              <ScopeTreeNode
                key={node.id}
                node={node}
                depth={0}
                lastTxType={lastTx?.command?.type ?? null}
                evaluateGuard={kernel.inspector.evaluateWhenGuard}
              />
            ))}
          </div>
        </div>

        {/* Right: Live Info */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* Last Transaction */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-[#1C2128] border-b border-[#30363D] flex items-center gap-2">
              <Zap size={12} className="text-amber-400" />
              <span className="text-[11px] font-bold text-[#8B949E] uppercase tracking-wider">
                Last Dispatch
              </span>
            </div>
            <div className="p-4">
              {lastTx ? (
                <div className="space-y-2">
                  <div className="text-emerald-400 font-bold text-sm">
                    {lastTx.command.type}
                  </div>
                  <div className="text-[10px] text-[#8B949E]">
                    Scope:{" "}
                    <span className="text-cyan-400">{lastTx.handlerScope}</span>
                  </div>
                  <div className="text-[10px] text-[#8B949E]">
                    Bubble:{" "}
                    <span className="text-[#C9D1D9]">
                      {lastTx.bubblePath.join(" → ")}
                    </span>
                  </div>
                  {lastTx.command.payload && (
                    <pre className="text-[9px] bg-[#0D1117] border border-[#30363D] rounded p-2 text-amber-300 overflow-auto max-h-24">
                      {JSON.stringify(lastTx.command.payload, null, 2)}
                    </pre>
                  )}
                  {lastTx.changes.length > 0 && (
                    <div className="text-[10px] text-purple-400">
                      {lastTx.changes.length} state change
                      {lastTx.changes.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-[#484F58] italic">
                  No dispatches yet
                </div>
              )}
            </div>
          </div>

          {/* Raw Data */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-[#1C2128] border-b border-[#30363D] flex items-center gap-2">
              <Database size={12} className="text-cyan-400" />
              <span className="text-[11px] font-bold text-[#8B949E] uppercase tracking-wider">
                Raw Registry
              </span>
            </div>
            <pre className="p-4 text-[9px] text-[#8B949E] overflow-auto max-h-96 leading-relaxed">
              {JSON.stringify(
                {
                  commands: Object.fromEntries(registry.commands),
                  whenGuards: Object.fromEntries(registry.whenGuards),
                  scopeTree: Object.fromEntries(registry.scopeTree),
                  middleware: Object.fromEntries(registry.middleware),
                  effects: Object.fromEntries(registry.effects),
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${colors[color]}`}
    >
      {icon}
      <span className="opacity-60">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-emerald-400">{icon}</div>
      <div>
        <h2 className="text-sm font-bold text-[#E6EDF3]">{title}</h2>
        <p className="text-[9px] text-[#484F58] font-mono">{subtitle}</p>
      </div>
    </div>
  );
}

function ScopeTreeNode({
  node,
  depth,
  lastTxType,
  evaluateGuard,
}: {
  node: ScopeNode;
  depth: number;
  lastTxType: string | null;
  evaluateGuard: (scope: string, type: string) => boolean | null;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const isGlobal = node.id === "GLOBAL";

  const scopeColor = isGlobal
    ? "text-emerald-400"
    : depth === 1
      ? "text-cyan-400"
      : "text-purple-400";

  return (
    <div style={{ marginLeft: depth * 16 }}>
      {/* Scope Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[#1C2128] transition-colors group text-left"
      >
        <span className="text-[#484F58] w-4 flex-shrink-0">
          {hasChildren || node.commands.length > 0 ? (
            expanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )
          ) : (
            <span className="block w-1.5 h-1.5 rounded-full bg-[#30363D] ml-1" />
          )}
        </span>
        <span className={`text-[11px] font-bold ${scopeColor}`}>{node.id}</span>
        <span className="text-[9px] text-[#484F58] ml-auto flex items-center gap-2">
          {node.commands.length > 0 && (
            <span className="flex items-center gap-1">
              <Terminal size={8} />
              {node.commands.length}
            </span>
          )}
          {node.middleware.length > 0 && (
            <span className="flex items-center gap-1 text-amber-500/50">
              <Shield size={8} />
              {node.middleware.length}
            </span>
          )}
          {node.effects.length > 0 && (
            <span className="flex items-center gap-1 text-purple-500/50">
              <Zap size={8} />
              {node.effects.length}
            </span>
          )}
        </span>
      </button>

      {/* Commands */}
      {expanded && node.commands.length > 0 && (
        <div className="ml-6 space-y-px">
          {node.commands.map((cmd) => {
            const isLast = lastTxType === cmd;
            const hasGuard = node.whenGuards.includes(cmd);
            const guardResult = hasGuard ? evaluateGuard(node.id, cmd) : null;

            return (
              <div
                key={cmd}
                className={`flex items-center gap-2 px-3 py-1 rounded text-[10px] transition-all ${
                  isLast
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "hover:bg-[#1C2128]"
                }`}
              >
                {/* Status dot */}
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isLast
                      ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                      : hasGuard
                        ? guardResult === true
                          ? "bg-emerald-400/60"
                          : guardResult === false
                            ? "bg-red-400/60"
                            : "bg-[#30363D]"
                        : "bg-[#30363D]"
                  }`}
                />

                {/* Command name */}
                <span
                  className={`font-mono flex-1 ${
                    isLast ? "text-emerald-300 font-bold" : "text-[#C9D1D9]"
                  }`}
                >
                  {cmd}
                </span>

                {/* When guard badge */}
                {hasGuard && (
                  <span
                    className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      guardResult === true
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : guardResult === false
                          ? "bg-red-500/15 text-red-400 border border-red-500/30"
                          : "bg-[#30363D] text-[#484F58]"
                    }`}
                  >
                    when
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Children */}
      {expanded &&
        node.children.map((child) => (
          <ScopeTreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            lastTxType={lastTxType}
            evaluateGuard={evaluateGuard}
          />
        ))}
    </div>
  );
}
