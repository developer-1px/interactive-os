import { useState } from "react";
import { FocusGroup } from "@/os/6-components/base/FocusGroup";
import { FocusItem } from "@/os/6-components/base/FocusItem";
import { Icon } from "@/components/Icon";

export function ToolbarPattern() {
    const [activeTools, setActiveTools] = useState<Record<string, boolean>>({
        bold: true,
    });

    const toggleTool = (id: string) => {
        setActiveTools(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Rich Editor Toolbar</h3>
            <p className="text-sm text-gray-500 mb-6">
                Focus trap behaves as a single tab stop. Use <kbd>Arrow Left/Right</kbd> to move.
            </p>

            <FocusGroup
                id="apg-toolbar"
                role="toolbar"
                navigate={{ orientation: "horizontal", loop: true }}
                tab={{ behavior: "trap" }}
                aria-label="Text Formatting"
                className="flex items-center gap-1 p-1 bg-gray-100 border border-gray-200 rounded shadow-sm w-fit"
            >
                {[
                    { id: "bold", icon: "bold" as const, label: "Bold" },
                    { id: "italic", icon: "italic" as const, label: "Italic" },
                    { id: "underline", icon: "underline" as const, label: "Underline" },
                ].map((tool) => (
                    <FocusItem
                        key={tool.id}
                        id={`tool-${tool.id}`}
                        role="button"
                        as="button"
                        aria-pressed={!!activeTools[tool.id]}
                        aria-label={tool.label}
                        onClick={() => toggleTool(tool.id)}
                        className="
              w-9 h-9 flex items-center justify-center rounded text-gray-700
              hover:bg-gray-200 transition-colors
              aria-pressed:bg-indigo-600 aria-pressed:text-white aria-pressed:shadow-inner
              data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:z-10
            "
                    >
                        {/* simple text fallback since we don't have these exact icons mapped yet */}
                        <span className="font-bold font-serif">{tool.id[0]?.toUpperCase()}</span>
                    </FocusItem>
                ))}

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <FocusItem
                    id="btn-link"
                    role="button"
                    as="button"
                    aria-label="Insert Link"
                    className="
            w-9 h-9 flex items-center justify-center rounded text-gray-700
            hover:bg-gray-200 transition-colors
            data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:z-10
          "
                >
                    <Icon name="link" size={16} />
                </FocusItem>

                <FocusItem
                    id="btn-image"
                    role="button"
                    as="button"
                    aria-label="Insert Image"
                    className="
            w-9 h-9 flex items-center justify-center rounded text-gray-700
            hover:bg-gray-200 transition-colors
            data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:z-10
          "
                >
                    <Icon name="file-image" size={16} />
                </FocusItem>

            </FocusGroup>
        </div>
    );
}
