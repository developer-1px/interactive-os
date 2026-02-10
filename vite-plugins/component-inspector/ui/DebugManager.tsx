import type React from "react";
import { useEffect, useState } from "react";
import {
  getAllOSComponents,
  getDebugSource,
  type OSComponentInfo,
} from "./utils";
import "./DebugManager.css";
import { InspectorOverlay } from "./InspectorOverlay";

const OS_COLORS: Record<string, string> = {
  Zone: "rgba(59, 130, 246, 0.6)",
  Item: "rgba(16, 185, 129, 0.6)",
  Field: "rgba(139, 92, 246, 0.6)",
  Trigger: "rgba(245, 158, 11, 0.6)",
};

export const DebugManager: React.FC = () => {
  const [isInspectorActive, setIsInspectorActive] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(
    null,
  );
  const [lockedElement, setLockedElement] = useState<HTMLElement | null>(null);
  const [traversalHistory, setTraversalHistory] = useState<HTMLElement[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [osComponents, setOsComponents] = useState<OSComponentInfo[]>([]);

  const copyElementSource = (element: HTMLElement) => {
    let current = element;
    let source: {
      fileName: string;
      lineNumber: number;
      columnNumber: number;
    } | null = null;

    while (current && current !== document.body) {
      source = getDebugSource(current);
      if (source) break;
      current = current.parentElement as HTMLElement;
    }

    if (source) {
      const { fileName, lineNumber, columnNumber } = source;
      const textToCopy = `${fileName}:${lineNumber}:${columnNumber}`;
      navigator.clipboard.writeText(textToCopy);
      setToastMessage(
        `Locked & Copied: ${fileName}:${lineNumber}:${columnNumber}`,
      );
    } else {
      setToastMessage("Locked (No source found)");
    }
  };

  // Track hovered element globally
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isInspectorActive) return;

      let target = document.elementFromPoint(
        e.clientX,
        e.clientY,
      ) as HTMLElement;
      if (
        !target ||
        target === document.body ||
        target.closest("#inspector-overlay-root") ||
        target.closest(".debug-toast")
      ) {
        setHoveredElement(null);
        return;
      }

      // Snap to SVG if inside one
      const svgRoot = target.closest("svg");
      if (svgRoot) {
        target = svgRoot as any;
      }

      setHoveredElement(target);
    };

    if (isInspectorActive) {
      window.addEventListener("mousemove", handleMouseMove, true);
    }
    return () => window.removeEventListener("mousemove", handleMouseMove, true);
  }, [isInspectorActive]);

  // Key Event Handling (Toggles + Traversal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+D: Toggle Inspector
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        setIsInspectorActive((prev) => {
          if (!prev) {
            setToastMessage("Inspector Mode ON");
          } else {
            setLockedElement(null);
            setTraversalHistory([]);
          }
          return !prev;
        });
        return;
      }

      if (!isInspectorActive) return;

      // Cmd+Up: Traverse to parent
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowUp") {
        e.preventDefault();
        const current = lockedElement || hoveredElement;
        if (current?.parentElement && current.parentElement !== document.body) {
          const parent = current.parentElement;
          setTraversalHistory((prev) => [...prev, current]);
          setLockedElement(parent);
          copyElementSource(parent);
        }
      }

      // Cmd+Down: Back to child
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowDown") {
        e.preventDefault();
        if (traversalHistory.length > 0) {
          const nextStack = [...traversalHistory];
          const lastChild = nextStack.pop();
          const target = lastChild || null;
          setLockedElement(target);
          setTraversalHistory(nextStack);
          if (target) copyElementSource(target);
        }
      }

      if (e.key === "Escape") {
        setLockedElement(null);
        setTraversalHistory([]);
        setIsInspectorActive(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isInspectorActive,
    lockedElement,
    hoveredElement,
    traversalHistory,
    copyElementSource,
  ]);

  // Manage Body Class and Click Interception
  useEffect(() => {
    if (isInspectorActive) {
      document.body.classList.add("debug-mode-active");
    } else {
      document.body.classList.remove("debug-mode-active");
    }

    const handleClick = (e: MouseEvent) => {
      if (!isInspectorActive) return;

      e.preventDefault();
      e.stopPropagation();

      // If we clicked a valid element (that is currently hovered)
      if (hoveredElement) {
        // Toggle lock if clicking the same element
        if (lockedElement === hoveredElement) {
          setLockedElement(null);
          setToastMessage("Unlocked");
        } else {
          // Lock new element
          setLockedElement(hoveredElement);
          setTraversalHistory([]); // Clear traversal history on fresh click
          copyElementSource(hoveredElement);
        }
      } else {
        // Clicked outside or on overlay -> Unlock
        setLockedElement(null);
        setToastMessage("Unlocked");
      }
    };

    if (isInspectorActive) {
      window.addEventListener("click", handleClick, true);
    }

    return () => {
      window.removeEventListener("click", handleClick, true);
    };
  }, [isInspectorActive, hoveredElement, lockedElement, copyElementSource]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Scan OS components when inspector is active
  useEffect(() => {
    if (!isInspectorActive) {
      setOsComponents([]);
      return;
    }

    const update = () => setOsComponents(getAllOSComponents());
    update();

    // Refresh on scroll/resize
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update, true);

    // Periodic refresh for dynamic content
    const interval = setInterval(update, 500);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update, true);
      clearInterval(interval);
    };
  }, [isInspectorActive]);

  const activeElement = lockedElement || hoveredElement;

  // ── Bridge to Inspector Panel via CustomEvent ──
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("inspector:element-selected", {
        detail: { element: activeElement },
      }),
    );
  }, [activeElement]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("inspector:active-changed", {
        detail: { active: isInspectorActive },
      }),
    );
  }, [isInspectorActive]);

  return (
    <>
      {/* OS Component Outlines */}
      {isInspectorActive &&
        osComponents.map((comp, i) => (
          <div
            key={`os-outline-${i}`}
            style={{
              position: "fixed",
              top: comp.rect.top,
              left: comp.rect.left,
              width: comp.rect.width,
              height: comp.rect.height,
              border: `1px dashed ${OS_COLORS[comp.type] || "rgba(255,255,255,0.5)"}`,
              pointerEvents: "none",
              zIndex: 99998,
              boxSizing: "border-box",
            }}
          />
        ))}
      {isInspectorActive && !lockedElement && (
        <InspectorOverlay activeElement={activeElement} />
      )}
      {toastMessage && (
        <div className="debug-toast">
          <span className="debug-toast-icon" />
          {toastMessage}
        </div>
      )}
    </>
  );
};
