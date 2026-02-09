/**
 * resolveNavigate — main within-zone navigation resolver.
 *
 * Pure function — delegates to strategy registry.
 */

import type { Direction } from "../../schema/focus/FocusDirection.ts";
import type { NavigateConfig } from "../../schema/focus/config/FocusNavigateConfig.ts";
import { resolveEntry } from "./entry.ts";
import {
    type NavigateResult,
    resolveWithStrategy,
} from "./strategies.ts";

export function resolveNavigate(
    currentId: string | null,
    direction: Direction,
    items: string[],
    config: NavigateConfig,
    spatial: {
        stickyX: number | null;
        stickyY: number | null;
        itemRects?: Map<string, DOMRect>;
    },
): NavigateResult {
    if (items.length === 0) {
        return { targetId: null, stickyX: null, stickyY: null };
    }

    if (!currentId) {
        const entryId = resolveEntry(items, config);
        return { targetId: entryId, stickyX: null, stickyY: null };
    }

    if (!items.includes(currentId)) {
        return { targetId: items[0], stickyX: null, stickyY: null };
    }

    const isVertical = direction === "up" || direction === "down";
    const isHorizontal = direction === "left" || direction === "right";

    if (direction === "home" || direction === "end") {
        return resolveWithStrategy(
            config.orientation,
            currentId,
            direction,
            items,
            config,
            spatial,
        );
    }

    if (config.orientation === "horizontal" && isVertical) {
        return {
            targetId: currentId,
            stickyX: spatial.stickyX,
            stickyY: spatial.stickyY,
        };
    }
    if (config.orientation === "vertical" && isHorizontal) {
        return {
            targetId: currentId,
            stickyX: spatial.stickyX,
            stickyY: spatial.stickyY,
        };
    }

    return resolveWithStrategy(
        config.orientation,
        currentId,
        direction,
        items,
        config,
        spatial,
    );
}
