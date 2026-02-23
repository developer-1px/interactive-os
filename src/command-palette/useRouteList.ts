/**
 * useRouteList — Extract navigable routes from TanStack Router.
 *
 * Traverses the route tree and returns flat list of leaf routes
 * with their full paths, filtering out layout-only routes.
 */

import { useRouter } from "@tanstack/react-router";
import { useMemo } from "react";

export interface RouteEntry {
  path: string;
  label: string;
}

export function useRouteList(): RouteEntry[] {
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    router = useRouter();
  } catch {
    // No RouterProvider available (e.g. DocsViewer standalone)
  }

  return useMemo(() => {
    if (!router) return [];
    const entries: RouteEntry[] = [];

    // biome-ignore lint: any needed for internal route tree traversal
    function traverse(route: any) {
      const fullPath: string | undefined = route.fullPath;

      // Only include routes with a real path (skip layout-only routes)
      if (fullPath && !fullPath.includes("$")) {
        // Skip layout routes that are just wrappers
        const isLayout = fullPath === "/" && route.id?.startsWith("/_");

        if (!isLayout) {
          // Deduplicate: check if path already added
          if (!entries.some((e) => e.path === fullPath)) {
            entries.push({
              path: fullPath,
              label: formatLabel(fullPath),
            });
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

    // Sort alphabetically
    entries.sort((a, b) => a.path.localeCompare(b.path));
    return entries;
  }, [router]);
}

/**
 * Format a route path into a human-readable label.
 * e.g. "/playground/kernel" → "Playground / Kernel"
 */
function formatLabel(path: string): string {
  if (path === "/") return "Home";
  return path
    .split("/")
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "))
    .join(" / ");
}
