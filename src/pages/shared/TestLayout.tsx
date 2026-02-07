import { useState } from "react";

interface TestBoxProps {
  title: string;
  children: React.ReactNode;
  description?: React.ReactNode;
}

export function TestBox({ title, children, description }: TestBoxProps) {
  const [showDocs, setShowDocs] = useState(true);

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col bg-white shadow-sm border-gray-200">
      {/* Header */}
      <div className="bg-gray-50 p-2 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDocs(!showDocs)}
            className={`text-[10px] px-2 py-0.5 rounded border ${
              showDocs
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
        <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 text-gray-600 text-xs leading-relaxed">
          {description}
        </div>
      )}

      {/* Test Content */}
      <div className="p-4 bg-white relative flex-1 min-h-[120px]">
        {children}
      </div>
    </div>
  );
}

export function TestGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {children}
    </div>
  );
}
