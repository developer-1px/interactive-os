/**
 * buildBubblePath — 키바인딩 버블링 경로 생성 (순수 함수)
 *
 * focusPath를 반전하여 가장 깊은 곳 → root → "global" 순서로 만든다.
 * resolveKeybinding이 이 경로를 따라 키바인딩을 탐색한다.
 */

/**
 * Build the bubble path from focus path.
 * Reverses the focus path (deepest first) and appends 'global'.
 */
export function buildBubblePath(
    focusPath: string[],
    fallbackGroupId?: string | null,
): string[] {
    const path =
        focusPath.length > 0
            ? [...focusPath].reverse()
            : fallbackGroupId
                ? [fallbackGroupId]
                : [];

    path.push("global");
    return path;
}
