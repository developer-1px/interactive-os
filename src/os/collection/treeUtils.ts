/**
 * treeUtils — Pure tree traversal utilities for nested structures.
 *
 * Works on any `{ id: string; children?: T[] }` tree.
 * Designed to work on both readonly state and Immer drafts.
 *
 * All functions are pure (no side effects beyond direct mutation of the
 * input array/objects, which is expected in Immer draft context).
 */

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface TreeNode {
    id: string;
    children?: TreeNode[];
}

// ═══════════════════════════════════════════════════════════════════
// findInTree — DFS search by id
// ═══════════════════════════════════════════════════════════════════

/**
 * Find a node by id in a nested tree (depth-first search).
 * Returns the node or undefined if not found.
 */
export function findInTree<T extends TreeNode>(
    nodes: T[],
    id: string,
): T | undefined {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findInTree(node.children as T[], id);
            if (found) return found;
        }
    }
    return undefined;
}

// ═══════════════════════════════════════════════════════════════════
// findParentOf — find the parent node of a given id
// ═══════════════════════════════════════════════════════════════════

/**
 * Find the parent node of the node with the given id.
 * Returns undefined if the node is at root level or not found.
 */
export function findParentOf<T extends TreeNode>(
    nodes: T[],
    id: string,
): T | undefined {
    for (const node of nodes) {
        if (node.children) {
            for (const child of node.children) {
                if (child.id === id) return node;
            }
            const found = findParentOf(node.children as T[], id);
            if (found) return found;
        }
    }
    return undefined;
}

// ═══════════════════════════════════════════════════════════════════
// removeFromTree — remove a node by id (cascade)
// ═══════════════════════════════════════════════════════════════════

/**
 * Remove a node by id from the tree. Mutates the input array/objects.
 * Returns true if the node was found and removed, false otherwise.
 */
export function removeFromTree<T extends TreeNode>(
    nodes: T[],
    id: string,
): boolean {
    const idx = nodes.findIndex((n) => n.id === id);
    if (idx !== -1) {
        nodes.splice(idx, 1);
        return true;
    }
    for (const node of nodes) {
        if (node.children) {
            if (removeFromTree(node.children as T[], id)) return true;
        }
    }
    return false;
}

// ═══════════════════════════════════════════════════════════════════
// insertChild — insert a node as a child of a parent
// ═══════════════════════════════════════════════════════════════════

/**
 * Insert a node as a child of the parent with the given id.
 * If `afterId` is provided, inserts after that sibling.
 * Otherwise appends at the end.
 * Creates the children array if it doesn't exist.
 * Does nothing if parent is not found.
 */
export function insertChild<T extends TreeNode>(
    nodes: T[],
    parentId: string,
    item: T,
    afterId?: string,
): void {
    const parent = findInTree(nodes, parentId);
    if (!parent) return;

    if (!parent.children) {
        parent.children = [];
    }

    if (afterId) {
        const idx = parent.children.findIndex((c) => c.id === afterId);
        if (idx !== -1) {
            parent.children.splice(idx + 1, 0, item);
        } else {
            parent.children.push(item);
        }
    } else {
        parent.children.push(item);
    }
}
