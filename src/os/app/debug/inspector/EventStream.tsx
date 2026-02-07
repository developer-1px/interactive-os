import { Icon } from "@/lib/Icon";
import { type LogEntry, useInspectorLogStore } from "@os/features/inspector/InspectorLogStore";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

/**
 * EventStream - Unified Inspector Stream
 *
 * Design:
 * - Chronological Feed: Oldest at Top, Newest at Bottom
 * - Auto-scroll: To latest event when State changes
 * - Visuals: Clean, vertical stacking, distinct input groups
 */
export const EventStream = () => {
  const logs = useInspectorLogStore((s) => s.logs); // Store is [Newest, ... Oldest]
  const clear = useInspectorLogStore((s) => s.clear);
  const pageNumber = useInspectorLogStore((s) => s.pageNumber);
  const scrollTrigger = useInspectorLogStore((s) => s.scrollTrigger);
  const scrollTargetId = useInspectorLogStore((s) => s.scrollTargetId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // --- Transactional Grouping Logic ---
  const transactionGroups = useMemo(() => {
    // Sort Chronologically (Oldest -> Newest)
    const chronological = [...logs].reverse();

    const groups: { input: LogEntry | LogEntry[]; children: LogEntry[] }[] = [];
    let currentGroup: { input: LogEntry | LogEntry[]; children: LogEntry[] } | null = null;
    let pendingKeyboardInputs: LogEntry[] = [];

    const flushPendingInputs = () => {
      if (pendingKeyboardInputs.length > 0) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          input: pendingKeyboardInputs.length === 1 ? pendingKeyboardInputs[0] : [...pendingKeyboardInputs],
          children: []
        };
        pendingKeyboardInputs = [];
      }
    };

    chronological.forEach((log) => {
      if (log.type === "INPUT") {
        if (log.inputSource === "keyboard") {
          // Keyboard input might be coalesced
          if (currentGroup && currentGroup.children.length > 0) {
            groups.push(currentGroup);
            currentGroup = null;
          }
          pendingKeyboardInputs.push(log);
        } else {
          // Mouse Input -> Immediate new group
          flushPendingInputs();
          if (currentGroup) groups.push(currentGroup);

          currentGroup = { input: log, children: [] };
        }
      } else {
        // Command / State / Effect
        if (pendingKeyboardInputs.length > 0) {
          const inputs = pendingKeyboardInputs.length === 1 ? pendingKeyboardInputs[0] : [...pendingKeyboardInputs];
          if (currentGroup) groups.push(currentGroup);
          currentGroup = { input: inputs, children: [] };
          pendingKeyboardInputs = [];
        }

        if (!currentGroup) {
          // Orphan log (e.g. initial system state)
          currentGroup = { input: { id: -1, type: "INPUT", title: "System", timestamp: log.timestamp, icon: "cpu" } as LogEntry, children: [] };
        }

        currentGroup.children.push(log);
      }
    });

    flushPendingInputs();
    if (currentGroup) groups.push(currentGroup);

    return groups;
  }, [logs]);

  // Auto-scroll: fires when STATE is logged, scrolls to the transaction start Input
  useLayoutEffect(() => {
    if (scrollTrigger === 0 || scrollTargetId === null) return;

    // Find which group contains the target Input ID
    const targetGroupIndex = transactionGroups.findIndex(group => {
      if (Array.isArray(group.input)) {
        return group.input.some(inp => inp.id === scrollTargetId);
      }
      return group.input.id === scrollTargetId;
    });

    if (targetGroupIndex === -1) return;

    // Use rAF to ensure DOM layout is fully settled after render
    const raf = requestAnimationFrame(() => {
      const targetElement = groupRefs.current.get(targetGroupIndex);
      if (targetElement && scrollRef.current) {
        const container = scrollRef.current;
        const targetTop = targetElement.offsetTop - container.offsetTop;
        container.scrollTo({ top: targetTop, behavior: "instant" });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [scrollTrigger, scrollTargetId, transactionGroups]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white text-[#333] font-mono text-[10px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#f8f9fa] border-b border-[#e9ecef] shrink-0">
        <h3 className="font-bold uppercase tracking-wider text-[#5f6368] text-[10px] flex items-center gap-2">
          <Icon name="activity" size={12} className="text-[#1a73e8]" />
          Stream
        </h3>
        <div className="flex items-center gap-2">

          <span className="px-1.5 py-0.5 bg-[#e8f0fe] text-[#1967d2] rounded text-[9px] font-bold">
            Page {pageNumber}
          </span>
          <button
            onClick={() => {
              // Format logs in LLM-friendly format
              const formatted = transactionGroups.map((group, i) => {
                const lines: string[] = [];
                const groupNum = i + 1;

                // Header
                if (Array.isArray(group.input)) {
                  const keys = group.input.map(inp => inp.title).join(' ');
                  lines.push(`[${groupNum}] INPUT: Type "${keys}"`);
                } else if (group.input.title === "System") {
                  lines.push(`[${groupNum}] SYSTEM`);
                } else {
                  const inputType = group.input.inputSource === "mouse" ? "Click" : "Key";
                  lines.push(`[${groupNum}] INPUT: ${inputType} "${group.input.title}"`);
                }

                // Children
                group.children.forEach(child => {
                  const details = child.details
                    ? (typeof child.details === 'object' ? JSON.stringify(child.details) : String(child.details))
                    : '';
                  lines.push(`  → ${child.type}: ${child.title}${details ? ` ${details}` : ''}`);
                });

                return lines.join('\n');
              }).join('\n\n');

              navigator.clipboard.writeText(formatted);
            }}
            className="hover:text-[#1a73e8] text-[#9aa0a6] transition-colors p-1 rounded hover:bg-black/5"
            title="Copy Logs"
          >
            <Icon name="copy" size={12} />
          </button>
          <button
            onClick={clear}
            className="hover:text-[#d93025] text-[#9aa0a6] transition-colors p-1 rounded hover:bg-black/5"
            title="Clear Stream"
          >
            <Icon name="trash" size={12} />
          </button>
        </div>
      </div>

      {/* Stream List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 py-2 space-y-3 scroll-smooth"
      >
        {transactionGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#bdc1c6] gap-2">
            <Icon name="terminal" size={24} className="opacity-20" />
            <span className="text-[10px]">Ready to capture events...</span>
          </div>
        )}

        {transactionGroups.map((group, i) => {
          return (
            <div
              key={i}
              ref={(el) => {
                if (el) groupRefs.current.set(i, el);
                else groupRefs.current.delete(i);
              }}
              className="flex flex-col animate-in fade-in slide-in-from-bottom-1 duration-200"
            >
              {/* Input Header */}
              <div className="relative z-10">
                {Array.isArray(group.input) ? (
                  <CoalescedInputBlock logs={group.input} groupNumber={i + 1} />
                ) : (
                  <LogItem log={group.input} isHeader groupNumber={i + 1} />
                )}
              </div>

              {/* Children Events */}
              {group.children.length > 0 && (
                <div className="ml-[11px] pl-3 border-l-[1.5px] border-[#e8eaed] flex flex-col pt-1 pb-1 gap-1">
                  {group.children.map(child => (
                    <LogItem key={child.id} log={child} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {/* Bottom padding so the last group can scroll to the top */}
        <div className="min-h-[80vh] shrink-0" />
      </div>
    </div>
  );
};

// --- Styles ---

const TYPE_CONFIG: Record<string, { iconColor: string; bg: string; border: string }> = {
  INPUT: { iconColor: "text-[#188038]", bg: "bg-[#fce8e6]", border: "border-[#fce8e6]" }, // Input shouldn't use this default usually
  COMMAND: { iconColor: "text-[#1a73e8]", bg: "bg-white", border: "border-transparent" },
  STATE: { iconColor: "text-[#e37400]", bg: "bg-white", border: "border-transparent" },
  EFFECT: { iconColor: "text-[#a142f4]", bg: "bg-white", border: "border-transparent" },
};

const LogItem = ({ log, isHeader = false, groupNumber }: { log: LogEntry; isHeader?: boolean; groupNumber?: number }) => {
  // Input Specific Styles
  const isInput = log.type === "INPUT";
  const isMouse = isInput && log.inputSource === "mouse";
  const isSystem = log.title === "System";

  let styles = {
    container: "bg-white hover:bg-[#f8f9fa] border-transparent",
    icon: log.icon || "circle",
    iconColor: "text-[#5f6368]"
  };

  if (isInput) {
    if (isSystem) {
      styles = { container: "bg-[#f1f3f4] border border-[#dadce0] rounded-md", icon: "cpu", iconColor: "text-[#5f6368]" };
    } else if (isMouse) {
      styles = { container: "bg-[#fff0e3] border border-[#ffe0c2] rounded-md shadow-sm", icon: "cursor", iconColor: "text-[#e37400]" };
    } else {
      // Keyboard
      styles = { container: "bg-[#e8f0fe] border border-[#d2e3fc] rounded-md shadow-sm", icon: "keyboard", iconColor: "text-[#1967d2]" };
    }
  } else {
    // Command / State
    const conf = TYPE_CONFIG[log.type] || { iconColor: "text-[#5f6368]", bg: "bg-white", border: "border-transparent" };
    styles = {
      container: `${conf.bg} ${conf.border}`,
      icon: log.icon || "activity",
      iconColor: conf.iconColor
    };
  }

  const containerClass = `flex items-start gap-2 px-2 py-1.5 transition-colors ${isHeader ? styles.container : "hover:bg-[#f1f3f4] rounded"
    }`;

  return (
    <div className={containerClass}>
      {/* Number */}
      {isHeader && groupNumber != null && (
        <span className="text-[9px] text-[#9aa0a6] font-mono w-4 text-right shrink-0 mt-0.5">
          {groupNumber}
        </span>
      )}

      {/* Icon */}
      <div className={`mt-0.5 shrink-0 ${styles.iconColor}`}>
        <Icon name={styles.icon as any} size={isHeader ? 12 : 10} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-semibold ${isHeader ? "text-[10px]" : "text-[9px]"} text-[#202124] truncate`}>
            {log.title}
          </span>
          {isHeader && (
            <span className="text-[8px] font-bold text-[#5f6368] opacity-50 uppercase tracking-wider ml-1">
              {isMouse ? "Click" : (isInput && !isSystem ? "Key" : log.type)}
            </span>
          )}
          <span className="ml-auto text-[8px] text-[#9aa0a6] tabular-nums shrink-0">
            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>

        {/* Details */}
        {log.details && (
          <div className={`mt-0.5 text-[9px] text-[#5f6368] truncate font-mono opacity-80 ${isHeader ? "" : "pl-0"}`}>
            {renderDetails(log)}
          </div>
        )}
      </div>
    </div>
  );
};

const CoalescedInputBlock = ({ logs, groupNumber }: { logs: LogEntry[]; groupNumber?: number }) => {
  const lastLog = logs[logs.length - 1];

  return (
    <div className="flex items-start gap-2 px-2 py-1.5 bg-[#e8f0fe] border border-[#d2e3fc] rounded-md shadow-sm">
      {groupNumber != null && (
        <span className="text-[9px] text-[#9aa0a6] font-mono w-4 text-right shrink-0 mt-0.5">
          {groupNumber}
        </span>
      )}
      <div className="mt-0.5 shrink-0 text-[#1967d2]">
        <Icon name="keyboard" size={12} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-[10px] text-[#1967d2]">Type Input</span>
          <span className="ml-auto text-[8px] text-[#9aa0a6]">
            {new Date(lastLog.timestamp).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {logs.map((l) => (
            <span key={l.id} className="inline-flex px-1.5 py-0.5 bg-white border border-[#aecbfa] rounded text-[9px] font-mono text-[#1967d2] shadow-sm">
              {l.title}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

function renderDetails(log: LogEntry) {
  if (typeof log.details !== 'object') return String(log.details);

  if (log.type === "INPUT") {
    if (log.inputSource === "mouse") return `Target: ${log.details.target}`;
    return `Code: ${log.details.code}`;
  }

  return JSON.stringify(log.details).slice(0, 100);
}
