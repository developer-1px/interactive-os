import type { StateDiff, Transaction } from "@kernel/core/transaction";

export interface InspectorSignal {
  type: "OS" | "STATE_MUTATION" | "NO_OP";
  /** The kernel scope (group name) that handled this command. Source: tx.handlerScope */
  group: string;
  trigger: {
    kind: "KEYBOARD" | "MOUSE" | "OS_FOCUS";
    raw: string;
    elementId?: string;
  };
  command: {
    type: string;
    payload: unknown;
  };
  diff: Array<{ path: string; from: unknown; to: unknown }>;
  effects: string[];
  pipeline?: {
    sensed?: unknown;
    resolved?: unknown;
  };
}

export function inferSignal(tx: Transaction): InspectorSignal {
  // 1. Extract raw trigger info
  const inputMeta = (tx.meta as Record<string, unknown> | undefined)?.[
    "input"
  ] as
    | { type?: string; key?: string; code?: string; elementId?: string }
    | undefined;

  const kind =
    inputMeta?.type === "MOUSE"
      ? "MOUSE"
      : inputMeta?.type === "OS_FOCUS"
        ? "OS_FOCUS"
        : "KEYBOARD";

  const hasPayloadKey =
    tx.command?.payload &&
    typeof tx.command.payload === "object" &&
    "key" in tx.command.payload;

  const rawTrigger =
    inputMeta?.key ??
    (hasPayloadKey ? (tx.command.payload as { key: string }).key : undefined) ??
    tx.command?.type ??
    "";

  const elementId = inputMeta?.elementId;

  // 2. Extract command and result info
  const cmdType = tx.command?.type ?? "NO_COMMAND";
  const cmdPayload = tx.command?.payload ?? {};
  const changes = tx.changes ?? [];
  const effectsObj = tx.effects ?? {};
  const effectKeys = Object.keys(effectsObj);

  const hasMutation = changes.length > 0 || effectKeys.length > 0;

  // 3. Classify Signal type
  let type: InspectorSignal["type"] = "NO_OP";

  if (kind === "OS_FOCUS") {
    type = hasMutation ? "STATE_MUTATION" : "OS";
  } else if (hasMutation) {
    type = "STATE_MUTATION";
  } else if (
    cmdType === "COM_NO_OP" ||
    (!hasMutation && ["KEYBOARD", "MOUSE"].includes(kind))
  ) {
    type = "NO_OP";
  }

  // 4. Group = handlerScope (kernel's authoritative group name)
  const group = tx.handlerScope ?? "unknown";

  return {
    type,
    group,
    trigger: {
      kind,
      raw: rawTrigger,
      ...(elementId ? { elementId } : {}),
    },
    command: {
      type: cmdType,
      payload: cmdPayload,
    },
    diff: changes.map((c: StateDiff) => ({
      path: c.path,
      from: c.from,
      to: c.to,
    })),
    effects: effectKeys,
    ...((tx.meta as any)?.pipeline
      ? { pipeline: (tx.meta as any).pipeline }
      : {}),
  };
}
