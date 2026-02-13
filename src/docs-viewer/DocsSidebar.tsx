import clsx from "clsx";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { cleanLabel, type DocItem } from "./docsUtils";

export interface DocsSidebarProps {
  items: DocItem[];
  activePath: string | undefined;
  onSelect: (path: string) => void;
  className?: string; // New prop for styling
  header?: React.ReactNode; // New prop for custom header
}

// ... SidebarItem remains the same ...

export function DocsSidebar({ items, activePath, onSelect, className, header }: DocsSidebarProps) {
  return (
    <div className={clsx("w-72 border-r border-slate-100 flex flex-col bg-[#FBFBFB] h-full", className)}>
      {header ? header : (
        <div className="px-5 py-5 flex items-center gap-2 mb-2">
          <div className="p-1 bg-white border border-slate-200 rounded-md shadow-sm">
            <FileText size={14} className="text-slate-700" />
          </div>
          <span className="font-semibold text-slate-700 text-sm tracking-tight">
            Handbook
          </span>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 pb-10 custom-scrollbar">
        {items.map((item) => (
          <SidebarItem
            key={item.path}
            item={item}
            activePath={activePath}
            onSelect={onSelect}
          />
        ))}
      </nav>
    </div>
  );
}
