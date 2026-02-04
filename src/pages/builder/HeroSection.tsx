import { Layers, Keyboard, MousePointer2 } from "lucide-react";

export function HeroSection() {
    return (
        <header className="relative border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-6xl mx-auto px-8 py-16">
                <div className="flex items-start gap-6">
                    <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                        <Layers className="text-white" size={32} />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold tracking-wide">
                                OS SHOWCASE
                            </span>
                            <span className="text-xs text-slate-400 uppercase tracking-widest font-medium">
                                Interaction Primitives
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold text-slate-900">
                            Focus System Playground
                        </h1>
                        <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
                            2D 공간에서 <strong className="text-slate-700">Zone</strong>,{" "}
                            <strong className="text-slate-700">Item</strong>,{" "}
                            <strong className="text-slate-700">Field</strong>,{" "}
                            <strong className="text-slate-700">Trigger</strong> 프리미티브를 테스트합니다.
                        </p>
                    </div>
                </div>

                {/* Quick Info Cards */}
                <div className="mt-10 grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Keyboard size={18} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Arrow Keys</p>
                            <p className="text-xs text-slate-500">2D 공간 이동</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <MousePointer2 size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Click</p>
                            <p className="text-xs text-slate-500">포커스 이동</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Layers size={18} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Enter / Space</p>
                            <p className="text-xs text-slate-500">선택 & 편집</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
