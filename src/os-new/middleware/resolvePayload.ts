/**
 * resolvePayload — 순수 재귀 placeholder resolver
 *
 * Action payload에서 OS.FOCUS 같은 sentinel 값을
 * 실제 focusedItemId로 치환하는 순수 함수.
 *
 * 어떤 외부 상태에도 접근하지 않음 — 입력/출력만.
 */

const OS_FOCUS_SENTINEL = "OS.FOCUS";

/**
 * Recursively resolve OS.FOCUS in payload
 */
export function resolvePayload(
  payload: any,
  focusedItemId: string | null,
): any {
  if (payload === OS_FOCUS_SENTINEL) {
    return focusedItemId;
  }

  if (payload === null || typeof payload !== "object") {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => resolvePayload(item, focusedItemId));
  }

  const resolved: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload)) {
    resolved[key] = resolvePayload(value, focusedItemId);
  }
  return resolved;
}
