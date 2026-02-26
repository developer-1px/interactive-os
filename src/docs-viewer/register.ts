/**
 * Docs Viewer Registration
 *
 * Registers DOCS_SCROLL_PAGE command and middleware through the OS kernel.
 * Follows the Inspector/CommandPalette plugin model.
 *
 * Strategy: OS OS_NAVIGATE already claims ArrowLeft/Right. When there's no active
 * zone (docs page), OS_NAVIGATE returns undefined. We use kernel middleware to
 * intercept OS_NAVIGATE and redirect to DOCS_SCROLL_PAGE when the docs scroll
 * container is present.
 *
 * Side-effect import: `import "@/docs-viewer/register"`
 */

import type { Middleware, MiddlewareContext } from "@kernel";
import { os } from "@/os/kernel";

// ── Command ──────────────────────────────────────────────────────

interface ScrollPagePayload {
  direction: "forward" | "backward";
}

export const DOCS_SCROLL_PAGE = os.defineCommand(
  "DOCS_SCROLL_PAGE",
  (_ctx) =>
    (payload: ScrollPagePayload): undefined => {
      const el = document.querySelector("[data-docs-scroll]");
      if (!el) return undefined;

      // We use getBoundingClientRect for robust relative positioning
      const containerRect = el.getBoundingClientRect();
      const headers = Array.from(
        el.querySelectorAll("h1, h2, h3"),
      ) as HTMLElement[];

      // Snap padding: headers align at 24px from top
      const SNAP_PADDING = 24;

      if (payload.direction === "forward") {
        // Find first header that is clearly *below* the snap point (buffer 6px)
        // 24 (snap point) + 6 = 30px threshold.
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
          // No more headers below. Go to next file if at bottom.
          const atBottom =
            el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
          if (atBottom) {
            document
              .querySelector<HTMLAnchorElement>("[data-docs-nav-next]")
              ?.click();
          } else {
            el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
          }
        }
      } else {
        // Find last header that is *above* the snap threshold (or slightly below it)
        // "Back" should snap to start of current section if we are reading it,
        // or jump to previous section if we are already at start.
        // Threshold: < SNAP_PADDING - 6 (18px).
        // If we are at 24px (snapped), 24 < 18 is False. We skip current. We go to prev.
        // If we are at 100px (reading body), 100 < 18 is False.
        // Wait. If we are reading body of H1, H1 is at -200px.
        // -200 < 18 True. H1 is candidate.
        // We pick the *last* one passing the filter.
        // So if H1(-200) and H2(500).
        // H2(500 < 18) False.
        // H1(-200 < 18) True.
        // We pick H1.
        // So "Back" snaps to start of *current* section.
        // Exactly what "Back" usually does in players.
        // Double "Back" (now H1 is at 24px).
        // 24 < 18 is False. H1 skipped.
        // H0(-1000) picked.
        // Correct.

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
          // No headers above. Are we at top?
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
    },
);

// ── Middleware ────────────────────────────────────────────────────
// Intercepts OS_NAVIGATE when docs scroll container is active and
// no Zone has focus. Redirects ArrowLeft/Right to DOCS_SCROLL_PAGE.

const docsNavigateMiddleware: Middleware = {
  id: "docs-navigate-redirect",

  before: (ctx: MiddlewareContext): MiddlewareContext => {
    if (ctx.command.type !== "OS_NAVIGATE") return ctx;

    const el = document.querySelector("[data-docs-scroll]");
    if (!el) return ctx;

    const state = os.getState();
    const zoneId = state.os.focus.activeZoneId;
    if (zoneId) {
      // Only skip if the active zone actually has focusable items in the DOM.
      // After route changes, activeZoneId can be stale (pointing to an
      // unmounted zone). In that case, let docs handle navigation.
      const zoneEl = document.getElementById(zoneId);
      if (zoneEl?.querySelector("[data-item-id]")) return ctx;
    }

    const direction = (ctx.command.payload as unknown as { direction: string })
      ?.direction;
    if (direction === "left" || direction === "right") {
      return {
        ...ctx,
        command: DOCS_SCROLL_PAGE({
          direction: direction === "right" ? "forward" : "backward",
        }) as unknown as MiddlewareContext["command"],
      };
    }

    return ctx;
  },
};

os.use(docsNavigateMiddleware);
