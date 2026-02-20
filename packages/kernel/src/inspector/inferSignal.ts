import type { Transaction } from "../core/transaction";

export interface InspectorSignal {
  type: "OS" | "STATE_MUTATION" | "NO_OP";
  trigger: {
    kind: "KEYBOARD" | "MOUSE" | "FOCUS";
    raw: string;
    elementId?: string;
  };
  command: {
    type: string;
    payload: unknown;
  };
  diff: Array<{ path: string; from: unknown; to: unknown }>;
  effects: string[];
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
      : inputMeta?.type === "FOCUS"
        ? "FOCUS"
        : "KEYBOARD";

  const rawTrigger =
    inputMeta?.key ??
    (tx.command?.payload as any)?.key ??
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

  // 3. Classify Signal
  let type: InspectorSignal["type"] = "NO_OP";

  if (kind === "FOCUS") {
    // Focus always gets classified as OS, unless it had a direct state mutation
    // Typically Focus itself doesn't mutate app domain state.
    // If it did, we could promote it to STATE_MUTATION, but the requirement specifically treats Focus as OS-level.
    type = hasMutation ? "STATE_MUTATION" : "OS";
  } else if (hasMutation) {
    type = "STATE_MUTATION";
  } else if (
    cmdType === "COM_NO_OP" ||
    (!hasMutation && ["KEYBOARD", "MOUSE"].includes(kind))
  ) {
    type = "NO_OP";
  }

  // Rare case: A mouse/keyboard event with NO mutation and NO specific command might just be NO_OP.

  return {
    type,
    trigger: {
      kind,
      raw: rawTrigger,
      ...(elementId ? { elementId } : {}),
    },
    command: {
      type: cmdType,
      payload: cmdPayload,
    },
    diff: changes.map((c: any) => ({
      path: c.path,
      from: c.from,
      to: c.to,
    })),
    effects: effectKeys,
  };
}
