import type { Block } from "./appState";

/**
 * reorderBlocks — 블록 배열의 순서를 변경하는 순수 함수.
 *
 * DT 참조: docs/6-products/builder/stories.md US-004 DT #4, #5
 * Zone onReorder 콜백에서 호출된다.
 *
 * 재귀적으로 중첩 블록(children)도 탐색한다.
 * 단, 같은 배열(같은 부모) 안에서만 이동 가능.
 */
export function reorderBlocks(
    blocks: Block[],
    info: { itemId: string; overItemId: string; position: "before" | "after" },
): Block[] {
    const { itemId, overItemId, position } = info;

    // 같은 위치에 드롭 → 변경 없음 (DT #6)
    if (itemId === overItemId) return blocks;

    // 이 레벨에서 둘 다 찾을 수 있는지 확인
    const dragIndex = blocks.findIndex((b) => b.id === itemId);
    const targetExists = blocks.some((b) => b.id === overItemId);

    if (dragIndex !== -1 && targetExists) {
        // 같은 레벨에 둘 다 있음 → 이 레벨에서 reorder
        const dragItem = blocks[dragIndex]!;
        const without = blocks.filter((_, i) => i !== dragIndex);
        const targetIndex = without.findIndex((b) => b.id === overItemId);
        if (targetIndex === -1) return blocks;

        const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
        const result = [...without];
        result.splice(insertIndex, 0, dragItem);
        return result;
    }

    // 이 레벨에 없으면 → children을 재귀 탐색
    let changed = false;
    const result = blocks.map((block) => {
        if (!block.children || block.children.length === 0) return block;
        const newChildren = reorderBlocks(block.children, info);
        if (newChildren !== block.children) {
            changed = true;
            return { ...block, children: newChildren };
        }
        return block;
    });

    return changed ? result : blocks;
}
