import { OS } from "@os/ui";
import { MockBadge } from "@apps/todo/mocks/MockPrimitives";
import { MousePointer2, Grid3X3, Layout as LayoutIcon, Type, Package, Terminal } from "lucide-react";

export default function BuilderPage() {
    return (
        <div className="flex-1 h-full bg-[#050608] overflow-y-auto custom-scrollbar p-12 relative">
            {/* Background Ambient Decor */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[140px] pointer-events-none" />

            <header className="mb-16 border-b border-white/5 pb-10">
                <div className="flex items-center gap-6 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-xl shadow-cyan-500/20">
                        <LayoutIcon size={28} className="text-white" />
                    </div>
                    <div>
                        <MockText variant="h1" className="text-4xl font-black tracking-tight text-white">Spatial Web Builder</MockText>
                        <p className="text-slate-400 mt-2 font-medium">Demonstrating 2D Spatial Navigation and Complex Nesting</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <MockBadge label="Spatial Grid" color="info" />
                    <MockBadge label="Layered Focus" color="success" />
                </div>
            </header>

            {/* Scenario 3: Complex Web Builder (TV-Style Spatial) */}
            <section className="space-y-6 max-w-7xl mx-auto">

                <OS.Zone
                    id="builder-showcase"
                    role="grid"
                    className="relative bg-slate-900/50 rounded-[40px] border border-white/5 p-12 min-h-[700px] overflow-hidden shadow-2xl"
                >
                    {/* Header Section */}
                    <div className="flex justify-between items-start mb-12">
                        <OS.Item id="builder-logo" className="group">
                            {({ isFocused }: { isFocused: boolean }) => (
                                <div className={`px-6 py-3 rounded-full border transition-all ${isFocused ? 'bg-white text-black border-white' : 'border-white/20 text-white'}`}>
                                    <span className="font-black uppercase tracking-tighter text-lg italic">Antigravity.Core</span>
                                </div>
                            )}
                        </OS.Item>

                        <div className="flex gap-4">
                            {["Draft", "Publish"].map(btn => (
                                <OS.Item key={btn} id={`btn-${btn}`}>
                                    {({ isFocused }: { isFocused: boolean }) => (
                                        <button className={`px-8 py-3 rounded-xl font-bold transition-all ${isFocused ? 'bg-cyan-500 text-white scale-110 shadow-lg shadow-cyan-500/40' : 'bg-white/10 text-slate-400'}`}>
                                            {btn}
                                        </button>
                                    )}
                                </OS.Item>
                            ))}
                        </div>
                    </div>

                    {/* Main Canvas Area */}
                    <div className="grid grid-cols-12 gap-8 items-start">

                        {/* Left Content Column */}
                        <div className="col-span-12 xl:col-span-7 space-y-8">
                            <OS.Item id="hero-title">
                                {({ isFocused }: { isFocused: boolean }) => (
                                    <div className={`p-8 rounded-3xl border transition-all ${isFocused ? 'bg-white/10 border-cyan-500/50' : 'border-transparent'}`}>
                                        <h1 className="text-6xl font-black text-white leading-tight">Build at the speed of <br /><span className="text-cyan-400">Thought.</span></h1>
                                    </div>
                                )}
                            </OS.Item>

                            <div className="grid grid-cols-2 gap-6">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <OS.Item key={i} id={`card-small-${i}`}>
                                        {({ isFocused }: { isFocused: boolean }) => (
                                            <div className={`h-48 rounded-3xl p-6 border transition-all ${isFocused ? 'bg-indigo-600 scale-105 shadow-xl' : 'bg-white/5 border-white/5'}`}>
                                                <div className="w-10 h-10 rounded-lg bg-white/20 mb-4" />
                                                <div className="h-4 bg-white/20 rounded w-3/4 mb-2" />
                                                <div className="h-4 bg-white/10 rounded w-1/2" />
                                            </div>
                                        )}
                                    </OS.Item>
                                ))}
                            </div>
                        </div>

                        {/* Right Floating Media Column */}
                        <div className="col-span-12 xl:col-span-5 relative mt-12 xl:mt-0">
                            <OS.Item id="floating-image" className="z-20 relative">
                                {({ isFocused }: { isFocused: boolean }) => (
                                    <div className={`aspect-[4/5] rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 p-1 transition-all duration-500 ${isFocused ? 'scale-110 rotate-2' : 'rotate-[-2deg]'}`}>
                                        <div className="w-full h-full rounded-[1.8rem] bg-slate-900 flex items-center justify-center">
                                            <MockBadge label="PRO VISION" color="info" />
                                        </div>
                                    </div>
                                )}
                            </OS.Item>

                            {/* Overlapping Widget Card - Tests Z-Index Navigation Physics */}
                            <div className="absolute -left-10 bottom-10 z-30">
                                <OS.Item id="widget-card">
                                    {({ isFocused }: { isFocused: boolean }) => (
                                        <div className={`w-64 p-6 rounded-2xl bg-white text-black shadow-2xl transition-all duration-300 ${isFocused ? 'scale-125 -translate-y-4' : ''}`}>
                                            <p className="text-xs font-black uppercase text-slate-400 mb-2">Engagement Rate</p>
                                            <h2 className="text-3xl font-black tracking-tighter">98.4%</h2>
                                            <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-600 w-4/5" />
                                            </div>
                                        </div>
                                    )}
                                </OS.Item>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Toolbelt - Tests Edge Handling */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl z-40">
                        {['Move', 'Text', 'Draw', 'Frame', 'Comment'].map((tool) => (
                            <OS.Item key={tool} id={`tool-${tool}`}>
                                {({ isFocused }: { isFocused: boolean }) => (
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isFocused ? 'bg-cyan-500 text-white' : 'text-slate-500 hover:text-white'}`}>
                                        <MockIcon name={tool} />
                                    </div>
                                )}
                            </OS.Item>
                        ))}
                    </div>

                </OS.Zone>
            </section>
        </div>
    );
}

function MockIcon({ name }: { name: string }) {
    switch (name) {
        case 'Move': return <MousePointer2 size={18} />;
        case 'Text': return <Type size={18} />;
        case 'Draw': return <Grid3X3 size={18} />;
        case 'Code': return <Terminal size={18} />;
        default: return <Package size={18} />;
    }
}

// Simple local mock text to avoid extra imports if possible, or correct import
function MockText({ children, className, variant }: any) {
    return <div className={className}>{children}</div>
}
