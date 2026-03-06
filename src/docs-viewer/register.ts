/**
 * Docs Viewer Registration
 *
 * 1. DOCS_SCROLL_PAGE command (pure — returns scrollPage effect)
 * 2. scrollPage effect (DOM — heading snap scroll)
 * 3. Middleware: intercepts OS_NAVIGATE and dispatches DOCS_SCROLL_PAGE
 *
 * Side-effect import: `import "@/docs-viewer/register"`
 */

import type { Middleware, MiddlewareContext } from "@kernel";
import { NOOP, os } from "@os-sdk/os";
import { DocsApp } from "./app";

// ── Types ────────────────────────────────────────────────────────

interface ScrollPagePayload {
  direction: "forward" | "backward";
}

// ── Command (pure — returns scrollPage effect) ───────────────────

export const DOCS_SCROLL_PAGE = DocsApp.command(
  "DOCS_SCROLL_PAGE",
  (ctx, payload: ScrollPagePayload) => ({
    state: ctx.state,
    scrollPage: payload,
  }),
);

// ── Effect (DOM) ─────────────────────────────────────────────────

DocsApp.defineEffect<ScrollPagePayload>("scrollPage", (payload) => {
  const el = document.querySelector("[data-docs-scroll]");
  if (!el) return;

  const containerRect = el.getBoundingClientRect();
  const headers = Array.from(
    el.querySelectorAll("h1, h2, h3"),
  ) as HTMLElement[];

  const SNAP_PADDING = 24;

  if (payload.direction === "forward") {
    const nextHeader = headers.find((h) => {
      const rect = h.getBoundingClientRect();
      return rect.top - containerRect.top > SNAP_PADDING + 6;
    });

    if (nextHeader) {
      const rect = nextHeader.getBoundingClientRect();
      const relativeOffset = rect.top - containerRect.top;
      el.scrollBy({
        top: relativeOffset - SNAP_PADDING,
        behavior: "instant",
      });
    } else {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
      if (atBottom) {
        document
          .querySelector<HTMLAnchorElement>("[data-docs-nav-next]")
          ?.click();
      } else {
        el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
      }
    }
  } else {
    const prevHeaders = headers.filter((h) => {
      const rect = h.getBoundingClientRect();
      return rect.top - containerRect.top < SNAP_PADDING - 6;
    });
    const targetHeader = prevHeaders[prevHeaders.length - 1];

    if (targetHeader) {
      const rect = targetHeader.getBoundingClientRect();
      const relativeOffset = rect.top - containerRect.top;
      el.scrollBy({
        top: relativeOffset - SNAP_PADDING,
        behavior: "instant",
      });
    } else {
      const atTop = el.scrollTop <= 2;
      if (atTop) {
        document
          .querySelector<HTMLAnchorElement>("[data-docs-nav-prev]")
          ?.click();
      } else {
        el.scrollTo({ top: 0, behavior: "instant" });
      }
    }
  }
});

// ── Middleware ────────────────────────────────────────────────────
// Intercepts OS_NAVIGATE when docs scroll container is active and
// no Zone has focus. Dispatches DOCS_SCROLL_PAGE (app scope) instead.
// Returns null command to suppress OS_NAVIGATE handler.

const docsNavigateMiddleware: Middleware = {
  id: "docs-navigate-redirect",

  before: (ctx: MiddlewareContext): MiddlewareContext => {
    if (ctx.command.type !== "OS_NAVIGATE") return ctx;

    const el = document.querySelector("[data-docs-scroll]");
    if (!el) return ctx;

    const state = os.getState();
    const zoneId = state.os.focus.activeZoneId;
    if (zoneId) {
      const zoneEl = document.getElementById(zoneId);
      if (zoneEl?.querySelector("[data-item]")) return ctx;
    }

    const direction = (ctx.command.payload as unknown as { direction: string })
      ?.direction;
    if (direction === "left" || direction === "right") {
      // Dispatch app-scoped command separately (different scope chain)
      os.dispatch(
        DOCS_SCROLL_PAGE({
          direction: direction === "right" ? "forward" : "backward",
        }),
      );
      // Suppress OS_NAVIGATE — command already dispatched above
      return {
        ...ctx,
        command: NOOP as unknown as MiddlewareContext["command"],
      };
    }

    return ctx;
  },
};

os.use(docsNavigateMiddleware);
