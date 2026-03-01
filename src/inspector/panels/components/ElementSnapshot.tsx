import { useState, useEffect } from "react";

export function AriaSnapshot({ elementId }: { elementId: string }) {
    const [snapshot, setSnapshot] = useState<Record<string, string | null> | null>(null);

    useEffect(() => {
        // Wait for DOM updates to flush after kernel transaction
        const raf = requestAnimationFrame(() => {
            // Small timeout to ensure async renders land
            setTimeout(() => {
                const el =
                    document.querySelector(`[data-id="${elementId}"]`) ||
                    document.querySelector(`[data-zone-id="${elementId}"]`) ||
                    document.getElementById(elementId);

                if (el) {
                    setSnapshot({
                        role: el.getAttribute("role"),
                        "aria-current": el.getAttribute("aria-current"),
                        "aria-selected": el.getAttribute("aria-selected"),
                        "aria-checked": el.getAttribute("aria-checked"),
                        "aria-expanded": el.getAttribute("aria-expanded"),
                        tabIndex: el.getAttribute("tabIndex"),
                    });
                } else {
                    setSnapshot({ error: "Element not found" });
                }
            }, 0);
        });
        return () => cancelAnimationFrame(raf);
    }, [elementId]);

    if (!snapshot)
        return <div className="text-[9px] text-[#94a3b8] italic px-1">Capturing...</div>;
    if (snapshot["error"])
        return <div className="text-[9px] text-[#ef4444] italic px-1">{snapshot["error"]}</div>;

    // Filter out nulls for cleaner display
    const filtered = Object.fromEntries(
        Object.entries(snapshot).filter(([, v]) => v !== null),
    );
    if (Object.keys(filtered).length === 0)
        return <div className="text-[9px] text-[#94a3b8] italic px-1">No ARIA attributes</div>;

    return (
        <div className="flex flex-col gap-[1px] w-full">
            <DiffValue value={filtered} type="changed-to" />
        </div>
    );
}

export function DiffValue({
    value,
    type,
}: {
    value: unknown;
    type: "removed" | "added" | "changed-from" | "changed-to";
}) {
    const str =
        typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
    const lines = str.split("\n");
    const isLarge = lines.length > 7 || str.length > 150;

    const DIFF_STYLES: Record<
        typeof type,
        { prefix: string; surfaceClass: string; textClass: string }
    > = {
        removed: {
            prefix: "-",
            surfaceClass: "bg-[#fef2f2]",
            textClass: "text-[#991b1b]",
        },
        added: {
            prefix: "+",
            surfaceClass: "bg-[#f0fdf4]",
            textClass: "text-[#166534]",
        },
        "changed-from": {
            prefix: "",
            surfaceClass: "bg-[#f8fafc]",
            textClass: "text-[#64748b] line-through",
        },
        "changed-to": {
            prefix: "→",
            surfaceClass: "bg-[#e2e8f0]/50",
            textClass: "text-[#0f172a] font-medium",
        },
    };

    const { prefix, surfaceClass, textClass } = DIFF_STYLES[type];

    const prefixNode = (
        <span className="inline-block w-5 shrink-0 text-center font-bold text-black/20 select-none">
            {prefix}
        </span>
    );

    if (!isLarge) {
        return (
            <div
                className={`py-0.5 px-0.5 rounded-sm whitespace-pre-wrap break-all flex ${surfaceClass} ${textClass}`}
            >
                {prefixNode}
                <span>{str}</span>
            </div>
        );
    }

    const summaryText =
        typeof value === "object" && value !== null
            ? Array.isArray(value)
                ? `Array(${value.length})`
                : `Object { ... }`
            : "Long String ...";

    return (
        <details
            className={`py-0.5 px-0.5 rounded-sm flex flex-col group ${surfaceClass} ${textClass}`}
        >
            <summary className="cursor-pointer outline-none flex items-center select-none list-none text-[9.5px]">
                <div className="flex items-center w-full opacity-80 hover:opacity-100">
                    {prefixNode}
                    <span className="group-open:hidden italic">{summaryText}</span>
                    <span className="hidden group-open:inline italic">Collapse</span>
                </div>
            </summary>
            <div className="whitespace-pre-wrap break-all text-[9.5px] mt-1 pl-5 pb-1">
                {str}
            </div>
        </details>
    );
}
