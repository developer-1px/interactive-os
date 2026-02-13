/**
 * useNavRoutes — Auto-generate GlobalNav items from TanStack Router route tree.
 *
 * ALL leaf routes appear in GlobalNav automatically.
 * Use staticData.location = "global-nav-bottom" to place in bottom section.
 * Default placement is top ("global-nav").
 *
 * Uses strict equality to map Lucide components back to IconNames from the registry.
 */

import { useRouter } from "@tanstack/react-router";
import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { type IconName, icons } from "@/lib/Icon";

export interface NavRoute {
    path: string;
    label: string;
    icon: IconName;
    order: number;
}

interface RouteStaticData {
    title?: string;
    icon?: LucideIcon;
    location?: "global-nav" | "global-nav-bottom";
    order?: number;
}

/**
 * Find the IconName for a given Lucide component by searching the registry.
 */
function findIconName(component: LucideIcon | undefined): IconName {
    if (!component) return "box";

    for (const [name, iconComponent] of Object.entries(icons)) {
        if (iconComponent === component) {
            return name as IconName;
        }
    }

    return "box";
}

/** Derive a human-readable label from a route path */
function pathToLabel(fullPath: string): string {
    const last = fullPath.split("/").filter(Boolean).pop() ?? "Home";
    return last
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export function useNavRoutes(): {
    topItems: NavRoute[];
    bottomItems: NavRoute[];
} {
    const router = useRouter();

    return useMemo(() => {
        const topItems: NavRoute[] = [];
        const bottomItems: NavRoute[] = [];
        const seenPaths = new Set<string>();

        /** Normalize path: strip trailing slash for dedup (except root "/") */
        function normPath(p: string): string {
            return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
        }

        // biome-ignore lint: any needed for internal route tree traversal
        function traverse(route: any) {
            const staticData = (route.options?.staticData ??
                route.staticData) as RouteStaticData | undefined;
            const fullPath: string | undefined = route.fullPath;
            const id: string | undefined = route._id ?? route.id;
            const hasChildren = route.children && Object.keys(route.children).length > 0;

            // Skip: root, pathless layout routes, splat routes, index sub-routes
            const isRoot = id === "__root__";
            const isLayoutOnly = id?.startsWith("/_") && !id.includes("/", 2);
            const isSplat = fullPath?.includes("$");
            const isChildIndex = hasChildren === false && fullPath?.endsWith("/") && fullPath !== "/";

            if (
                !isRoot &&
                !isLayoutOnly &&
                !isSplat &&
                !isChildIndex &&
                fullPath &&
                !seenPaths.has(normPath(fullPath))
            ) {
                // Only include leaf routes OR routes with explicit location
                // (parent routes like /docs that have children are included if they have staticData.location)
                const shouldInclude = !hasChildren || staticData?.location;

                if (shouldInclude) {
                    seenPaths.add(normPath(fullPath));

                    const location = staticData?.location ?? "global-nav";
                    const navRoute: NavRoute = {
                        path: normPath(fullPath),
                        label: staticData?.title ?? pathToLabel(fullPath),
                        icon: findIconName(staticData?.icon),
                        order: staticData?.order ?? 999,
                    };

                    if (location === "global-nav-bottom") {
                        bottomItems.push(navRoute);
                    } else {
                        topItems.push(navRoute);
                    }
                }
            }

            // Traverse children
            const children = route.children;
            if (children) {
                for (const child of Object.values(children)) {
                    // biome-ignore lint/suspicious/noExplicitAny: internal route tree traversal
                    traverse(child as any);
                }
            }
        }

        // biome-ignore lint/suspicious/noExplicitAny: internal route tree traversal
        traverse(router.routeTree as any);

        // Sort by order
        topItems.sort((a, b) => a.order - b.order);
        bottomItems.sort((a, b) => a.order - b.order);

        return { topItems, bottomItems };
    }, [router]);
}
