import { OS } from "@os/ui";
import { Move, Type, Image, Square, Circle, Triangle } from "lucide-react";

/**
 * CanvasBlock
 * 
 * 2D Spatial Grid로 Focus 이동을 테스트하는 캔버스.
 * 여러 개의 편집 가능한 블록들이 자유롭게 배치되어 있음.
 */
export function CanvasBlock() {
    return (
        <section className="py-12 px-8 max-w-6xl mx-auto">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">2D Canvas</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Arrow 키로 블록 간 이동. 선택 후 Delete, Cmd+C/V/D 테스트.
                </p>
            </div>

            <OS.Zone
                id="canvas-zone"
                role="grid"
                className="relative bg-slate-50 rounded-2xl border border-slate-200 p-8 min-h-[500px]"
            >
                {/* Row 1 */}
                <div className="flex gap-6 mb-6">
                    <CanvasCard id="block-text-1" icon={<Type size={20} />} label="Heading" color="indigo" />
                    <CanvasCard id="block-text-2" icon={<Type size={20} />} label="Paragraph" color="slate" wide />
                </div>

                {/* Row 2 - Mixed */}
                <div className="flex gap-6 mb-6 items-start">
                    <CanvasCard id="block-image-1" icon={<Image size={20} />} label="Hero Image" color="emerald" tall />
                    <div className="flex flex-col gap-6 flex-1">
                        <CanvasCard id="block-shape-1" icon={<Square size={20} />} label="Shape A" color="amber" />
                        <CanvasCard id="block-shape-2" icon={<Circle size={20} />} label="Shape B" color="pink" />
                    </div>
                    <CanvasCard id="block-image-2" icon={<Image size={20} />} label="Side Image" color="blue" tall />
                </div>

                {/* Row 3 */}
                <div className="flex gap-6">
                    <CanvasCard id="block-shape-3" icon={<Triangle size={20} />} label="Triangle" color="purple" />
                    <CanvasCard id="block-text-3" icon={<Type size={20} />} label="Caption" color="slate" />
                    <CanvasCard id="block-action" icon={<Move size={20} />} label="CTA Button" color="rose" />
                </div>
            </OS.Zone>
        </section>
    );
}

interface CanvasCardProps {
    id: string;
    icon: React.ReactNode;
    label: string;
    color: "indigo" | "slate" | "emerald" | "amber" | "pink" | "blue" | "purple" | "rose";
    wide?: boolean;
    tall?: boolean;
}

function CanvasCard({ id, icon, label, color, wide, tall }: CanvasCardProps) {
    const colorMap = {
        indigo: { bg: "bg-indigo-50", border: "border-indigo-200", focusBg: "bg-indigo-100", focusBorder: "border-indigo-500", icon: "text-indigo-500" },
        slate: { bg: "bg-slate-100", border: "border-slate-200", focusBg: "bg-slate-200", focusBorder: "border-slate-500", icon: "text-slate-500" },
        emerald: { bg: "bg-emerald-50", border: "border-emerald-200", focusBg: "bg-emerald-100", focusBorder: "border-emerald-500", icon: "text-emerald-500" },
        amber: { bg: "bg-amber-50", border: "border-amber-200", focusBg: "bg-amber-100", focusBorder: "border-amber-500", icon: "text-amber-500" },
        pink: { bg: "bg-pink-50", border: "border-pink-200", focusBg: "bg-pink-100", focusBorder: "border-pink-500", icon: "text-pink-500" },
        blue: { bg: "bg-blue-50", border: "border-blue-200", focusBg: "bg-blue-100", focusBorder: "border-blue-500", icon: "text-blue-500" },
        purple: { bg: "bg-purple-50", border: "border-purple-200", focusBg: "bg-purple-100", focusBorder: "border-purple-500", icon: "text-purple-500" },
        rose: { bg: "bg-rose-50", border: "border-rose-200", focusBg: "bg-rose-100", focusBorder: "border-rose-500", icon: "text-rose-500" },
    };

    const c = colorMap[color];

    return (
        <OS.Item id={id} className={`${wide ? "flex-[2]" : "flex-1"} ${tall ? "min-h-[200px]" : ""}`}>
            {({ isFocused }: { isFocused: boolean }) => (
                <div
                    className={`
            h-full min-h-[80px] rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer
            flex flex-col items-center justify-center gap-2
            ${isFocused
                            ? `${c.focusBg} ${c.focusBorder} shadow-lg ring-2 ring-offset-2 ring-${color}-500/30 scale-[1.02]`
                            : `${c.bg} ${c.border} hover:shadow-md`
                        }
          `}
                >
                    <div className={c.icon}>{icon}</div>
                    <span className={`text-sm font-medium ${isFocused ? "text-slate-800" : "text-slate-600"}`}>
                        {label}
                    </span>
                    {isFocused && (
                        <span className="text-[10px] text-slate-400 font-mono mt-1">focused</span>
                    )}
                </div>
            )}
        </OS.Item>
    );
}
