/**
 * BuilderTabs — Container structural primitive for tabbed content.
 *
 * Follows WAI-ARIA Tabs pattern:
 *   - TabList (role="tablist") — horizontal tab header navigation
 *   - Tab (role="tab") — individual tab button, label is inline-editable
 *   - TabPanel (role="tabpanel") — content area, visible when tab is active
 *
 * Data-driven: derives tab labels from Block.children[].label.
 * Supports both legacy `tabs: string[]` prop AND new `block: Block` prop.
 *
 * State: Active tab is local React state (runtime concern).
 *        Published pages bind active tab to URL hash.
 *
 * ZIFT mapping:
 *   Builder.Tabs      → wrapper div with builder annotations
 *   Tab headers       → OS.Item within a Zone (role="tablist")
 *   Tab panels        → conditionally rendered children
 */

import type { Block } from "@/apps/builder/model/appState";
import { Item as OSItem } from "@os/6-components/primitives/Item";
import { Zone } from "@os/6-components/primitives/Zone";
import {
    Children,
    type ReactElement,
    type ReactNode,
    useState,
} from "react";

// ═══════════════════════════════════════════════════════════════════
// BuilderTabs — Container primitive
// ═══════════════════════════════════════════════════════════════════

interface BuilderTabsProps {
    /** Unique builder ID for this tab container */
    id: string;
    /**
     * Tab labels — legacy prop for hardcoded tabs.
     * If `block` is provided, labels are derived from block.children.
     */
    tabs?: string[];
    /** Block data for data-driven rendering (preferred) */
    block?: Block | undefined;
    /** Initially active tab index (default: 0) */
    defaultTab?: number;
    /** Tab panel children — one per tab, in order */
    children: ReactNode;
    /** Optional className for the outer wrapper */
    className?: string;
}

export function BuilderTabs({
    id,
    tabs: legacyTabs,
    block,
    defaultTab = 0,
    children,
    className,
}: BuilderTabsProps) {
    const [activeIndex, setActiveIndex] = useState(defaultTab);

    // Derive tab labels: block.children takes precedence, then legacy tabs
    const tabLabels: string[] = block?.children
        ? block.children.map(c => c.label)
        : legacyTabs ?? [];

    const panels = Children.toArray(children) as ReactElement[];

    return (
        <div
            data-level="group"
            data-builder-id={id}
            data-builder-type="tabs"
            className={className}
        >
            {/* Tab List — horizontal navigation */}
            <Zone
                id={`${id}-tablist`}
                role="tablist"
                className="flex flex-wrap items-center gap-2 border-b border-slate-200"
                options={{
                    navigate: { orientation: "horizontal" },
                    tab: { behavior: "flow" },
                }}
            >
                {tabLabels.map((label, idx) => (
                    <OSItem
                        key={`${id}-tab-${idx}`}
                        id={`${id}-tab-${idx}`}
                        aria-selected={idx === activeIndex}
                        aria-controls={`${id}-panel-${idx}`}
                        asChild
                    >
                        <button
                            type="button"
                            role="tab"
                            className={`
                                relative px-5 py-3.5 text-base font-semibold transition-colors outline-none
                                border-b-2 -mb-[1px] whitespace-nowrap
                                ${idx === activeIndex
                                    ? "border-slate-900 text-slate-900"
                                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                                }
                                data-[focused]:ring-2 data-[focused]:ring-slate-400/50 data-[focused]:rounded-t-lg
                                data-[focused]:z-10
                            `}
                            onClick={() => setActiveIndex(idx)}
                            tabIndex={-1}
                        >
                            {label}
                        </button>
                    </OSItem>
                ))}
            </Zone>

            {/* Tab Panels — only active panel rendered */}
            {panels.map((panel, idx) => (
                <div
                    key={`${id}-panel-${idx}`}
                    id={`${id}-panel-${idx}`}
                    role="tabpanel"
                    aria-labelledby={`${id}-tab-${idx}`}
                    hidden={idx !== activeIndex}
                >
                    {idx === activeIndex ? panel : null}
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// BuilderTabPanel — Marker component for tab content
// ═══════════════════════════════════════════════════════════════════

interface BuilderTabPanelProps {
    /** Content of this tab panel — composed with Builder primitives */
    children: ReactNode;
}

export function BuilderTabPanel({ children }: BuilderTabPanelProps) {
    return <>{children}</>;
}

BuilderTabs.displayName = "Builder.Tabs";
BuilderTabPanel.displayName = "Builder.TabPanel";
