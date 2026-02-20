/**
 * BuilderTabs — Container structural primitive for tabbed content.
 *
 * Follows WAI-ARIA Tabs pattern:
 *   - TabList (role="tablist") — horizontal tab header navigation
 *   - Tab (role="tab") — individual tab button, label is inline-editable
 *   - TabPanel (role="tabpanel") — content area, visible when tab is active
 *
 * State: Active tab is local React state (runtime concern).
 *        Published pages bind active tab to URL hash.
 *
 * ZIFT mapping:
 *   Builder.Tabs      → wrapper div with builder annotations
 *   Tab headers       → OS.Item within a Zone (role="tablist")
 *   Tab panels        → conditionally rendered children
 *
 * Usage:
 *   <Builder.Tabs id="pricing-tabs" tabs={["Monthly", "Annual"]}>
 *     <Builder.TabPanel>
 *       ...monthly content (Builder primitives)...
 *     </Builder.TabPanel>
 *     <Builder.TabPanel>
 *       ...annual content (Builder primitives)...
 *     </Builder.TabPanel>
 *   </Builder.Tabs>
 */

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
    /** Tab labels — each becomes an inline-editable header */
    tabs: string[];
    /** Initially active tab index (default: 0) */
    defaultTab?: number;
    /** Tab panel children — one per tab, in order */
    children: ReactNode;
    /** Optional className for the outer wrapper */
    className?: string;
}

export function BuilderTabs({
    id,
    tabs,
    defaultTab = 0,
    children,
    className,
}: BuilderTabsProps) {
    const [activeIndex, setActiveIndex] = useState(defaultTab);
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
                options={{
                    navigate: { orientation: "horizontal" },
                    tab: { behavior: "flow" },
                }}
            >
                {tabs.map((label, idx) => (
                    <OSItem
                        key={`${id}-tab-${idx}`}
                        id={`${id}-tab-${idx}`}
                        aria-selected={idx === activeIndex}
                        aria-controls={`${id}-panel-${idx}`}
                    >
                        <button
                            type="button"
                            role="tab"
                            className={`
                px-4 py-2 text-sm font-medium transition-all outline-none
                border-b-2
                ${idx === activeIndex
                                    ? "border-indigo-500 text-indigo-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                }
                data-[focused]:ring-2 data-[focused]:ring-indigo-500/30 data-[focused]:rounded-t
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
