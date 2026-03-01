import { useEffect, useState } from "react";
import { InspectorApp, type InspectorState } from "../app";

export function HighlightOverlay() {
    const highlightedNodeId = InspectorApp.useComputed(
        (s: InspectorState) => s.highlightedNodeId,
    );

    const [rect, setRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!highlightedNodeId) {
            setRect(null);
            return;
        }

        const updateRect = () => {
            const el =
                document.querySelector(`[data-id="${highlightedNodeId}"]`) ||
                document.querySelector(`[data-zone-id="${highlightedNodeId}"]`) ||
                document.getElementById(highlightedNodeId);

            if (el && el instanceof HTMLElement) {
                setRect(el.getBoundingClientRect());
            } else {
                setRect(null);
            }
        };

        updateRect();

        // Optional: add resize/scroll listener to track it, but for a simple hover overlay, rAF or simple static rect is fine.
        // We'll just listen to scroll and resize for basic tracking.
        window.addEventListener("scroll", updateRect, true);
        window.addEventListener("resize", updateRect);

        return () => {
            window.removeEventListener("scroll", updateRect, true);
            window.removeEventListener("resize", updateRect);
        };
    }, [highlightedNodeId]);

    if (!rect) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                outline: "2px solid #f06595",
                outlineOffset: "2px",
                boxShadow: "0 0 0 4px rgba(240, 101, 149, 0.3)",
                pointerEvents: "none",
                zIndex: 99999,
                transition: "all 0.1s ease-out",
            }}
        />
    );
}
