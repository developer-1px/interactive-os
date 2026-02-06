
export function getDebugSource(el: HTMLElement | null): { fileName: string; lineNumber: number; columnNumber: number; loc?: number } | null {
    if (!el) return null;

    // 1. Check for explicit data attribute (fastest)
    const inspectorLine = el.getAttribute('data-inspector-line')
    const locAttr = el.getAttribute('data-inspector-loc')

    if (inspectorLine) {
        const [fileName, line, col] = inspectorLine.split(':')
        return {
            fileName,
            lineNumber: parseInt(line, 10),
            columnNumber: parseInt(col, 10),
            loc: locAttr ? parseInt(locAttr, 10) : undefined
        }
    }

    // 2. Fallback to Fiber traversal
    let key: string | undefined;
    for (const k in el) {
        if (k.startsWith('__reactFiber$')) {
            key = k;
            break;
        }
    }

    if (!key) {
        return null;
    }

    // @ts-ignore
    let fiber = el[key];

    while (fiber) {
        if (fiber._debugSource) {
            // Fiber doesn't have locAttr easily, but we can return fiber._debugSource
            return fiber._debugSource;
        }
        if (fiber._debugInfo) return fiber._debugInfo;

        fiber = fiber.return;
    }
    return null;
}

export function getComponentStack(el: HTMLElement | null): string[] {
    if (!el) return [];

    let key: string | undefined;
    for (const k in el) {
        if (k.startsWith('__reactFiber$')) {
            key = k;
            break;
        }
    }

    if (!key) return [];

    // @ts-ignore
    let fiber = el[key];
    const stack: string[] = [];

    while (fiber) {
        const type = fiber.type;
        let name = '';

        if (typeof type === 'function') {
            name = type.displayName || type.name || 'Anonymous';
        } else if (typeof type === 'string') {
            // Skip host components (div, span, etc) if we only want React Components
            // but keep primitives like 'Box' or 'Flex' if they have data attributes
        } else if (type && typeof type === 'object' && type.$$typeof) {
            // Handle Memo, ForwardRef, etc.
            const wrappedType = type.type || type.render;
            if (wrappedType) {
                name = wrappedType.displayName || wrappedType.name || '';
            }
        }

        if (name && name !== 'Anonymous' && !stack.includes(name)) {
            stack.unshift(name);
        }

        fiber = fiber.return;
    }

    return stack;
}

const OS_COMPONENT_PATTERNS: Record<string, string> = {
    'Zone': 'Zone',
    'FocusGroup': 'Zone',
    'Item': 'Item',
    'FocusItem': 'Item',
    'Field': 'Field',
    'Trigger': 'Trigger',
};

export function getOSComponentType(el: HTMLElement | null): string | null {
    if (!el) return null;

    let key: string | undefined;
    for (const k in el) {
        if (k.startsWith('__reactFiber$')) {
            key = k;
            break;
        }
    }

    if (!key) return null;

    // @ts-ignore
    let fiber = el[key];

    while (fiber) {
        const type = fiber.type;
        let name = '';

        if (typeof type === 'function') {
            name = type.displayName || type.name || '';
        } else if (type && typeof type === 'object' && type.$$typeof) {
            const wrappedType = type.type || type.render;
            if (wrappedType) {
                name = wrappedType.displayName || wrappedType.name || '';
            }
        }

        // Check if this component name matches any OS pattern
        for (const [pattern, osType] of Object.entries(OS_COMPONENT_PATTERNS)) {
            if (name === pattern || name.includes(pattern)) {
                return osType;
            }
        }

        fiber = fiber.return;
    }

    return null;
}

export interface OSComponentInfo {
    type: string;
    rect: DOMRect;
}

export function getAllOSComponents(): OSComponentInfo[] {
    const results: OSComponentInfo[] = [];
    const seen = new Set<HTMLElement>();

    const walkDOM = (node: HTMLElement) => {
        if (!node || node === document.body) return;

        // Skip inspector overlay
        if (node.id === 'inspector-overlay-root' || node.id === 'vite-plugin-component-inspector-root') return;

        // Check if this element has a React Fiber with OS component
        let fiberKey: string | undefined;
        for (const k in node) {
            if (k.startsWith('__reactFiber$')) {
                fiberKey = k;
                break;
            }
        }

        if (fiberKey) {
            // @ts-ignore
            let fiber = node[fiberKey];

            // Only check immediate fiber (not ancestors)
            if (fiber) {
                const type = fiber.type;
                let name = '';

                if (typeof type === 'function') {
                    name = type.displayName || type.name || '';
                } else if (type && typeof type === 'object' && type.$$typeof) {
                    const wrappedType = type.type || type.render;
                    if (wrappedType) {
                        name = wrappedType.displayName || wrappedType.name || '';
                    }
                }

                for (const [pattern, osType] of Object.entries(OS_COMPONENT_PATTERNS)) {
                    if (name === pattern && !seen.has(node)) {
                        seen.add(node);
                        const rect = getElementRect(node);
                        if (rect.width > 0 && rect.height > 0) {
                            results.push({ type: osType, rect });
                        }
                        break;
                    }
                }
            }
        }

        // Recurse children
        for (const child of Array.from(node.children) as HTMLElement[]) {
            walkDOM(child);
        }
    };

    walkDOM(document.body);
    return results;
}

function getElementRect(element: HTMLElement): DOMRect {
    const styles = window.getComputedStyle(element);
    let rect = element.getBoundingClientRect();

    // Handle display: contents - aggregate children rects
    if (styles.display === 'contents') {
        const children = Array.from(element.children) as HTMLElement[];
        if (children.length > 0) {
            let minTop = Infinity, minLeft = Infinity, maxBottom = -Infinity, maxRight = -Infinity;
            children.forEach(child => {
                const r = child.getBoundingClientRect();
                if (r.width === 0 && r.height === 0) return;
                minTop = Math.min(minTop, r.top);
                minLeft = Math.min(minLeft, r.left);
                maxBottom = Math.max(maxBottom, r.bottom);
                maxRight = Math.max(maxRight, r.right);
            });

            if (minTop !== Infinity) {
                rect = new DOMRect(minLeft, minTop, maxRight - minLeft, maxBottom - minTop);
            }
        }
    }

    return rect;
}
