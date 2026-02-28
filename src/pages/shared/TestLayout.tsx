import { useState } from "react";

interface TestBoxProps {
  title: string;
  children: React.ReactNode;
  description?: React.ReactNode;
  spec?: string;
}

export function TestBox({ title, children, description, spec }: TestBoxProps) {
  const [showDocs, setShowDocs] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col bg-white shadow-sm border-gray-200">
      {/* Header */}
      <div className="bg-gray-50 px-2 py-1.5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
          {spec && (
            <span className="text-[9px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
              {spec}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowDocs(!showDocs)}
            className={`text-[10px] px-2 py-0.5 rounded border ${showDocs
              ? "text-gray-700 border-gray-300 bg-gray-100"
              : "border-transparent text-gray-400"
              }`}
          >
            Docs
          </button>
        </div>
      </div>

      {/* Documentation / Description */}
      {showDocs && description && (
        <div className="px-3 py-2 bg-gray-50/80 border-b border-gray-100 text-gray-600 text-xs leading-relaxed">
          {description}
        </div>
      )}

      {/* Test Content */}
      <div className="p-3 bg-white relative flex-1 min-h-[80px]">
        {children}
      </div>
    </div>
  );
}

export function TestGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="gap-3 p-3"
      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
    >
      {children}
    </div>
  );
}
