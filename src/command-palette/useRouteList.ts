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

/** Minimal shape of a TanStack Router route tree node for traversal */
interface RouteTreeNode {
  fullPath?: string;
  id?: string;
  children?: Record<string, RouteTreeNode>;
}

export function useRouteList(): RouteEntry[] {
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- useRouter throws when no RouterProvider; safe catch
    router = useRouter();
  } catch {
    // No RouterProvider available (e.g. DocsViewer standalone)
  }

  return useMemo(() => {
    if (!router) return [];
    const entries: RouteEntry[] = [];

    function traverse(route: RouteTreeNode) {
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
          traverse(child);
        }
      }
    }

    traverse(router.routeTree as RouteTreeNode);

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
