import { ChevronRight } from "lucide-react";

export function CollapsibleSection({
  title,
  icon,
  open,
  onToggle,
  count,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[#e0e0e0]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-1 px-2 py-1 bg-[#f8f8f8] hover:bg-[#f0f0f0] cursor-pointer border-none text-left"
      >
        <span
          className={`text-[#b0b0b0] transition-transform ${open ? "rotate-90" : ""}`}
        >
          <ChevronRight size={10} />
        </span>
        {icon && <span className="text-[#b0b0b0]">{icon}</span>}
        <span className="text-[8px] font-bold uppercase tracking-wider text-[#666]">
          {title}
        </span>
        {count !== undefined && (
          <span className="text-[8px] text-[#999] font-mono ml-auto">
            ({count})
          </span>
        )}
      </button>
      {open && children}
    </div>
  );
}
