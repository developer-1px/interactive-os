import { OS } from "@os/ui";
import { MockText, MockBadge } from "@apps/todo/mocks/MockPrimitives";
import { Layers, MousePointer2, Grid3X3, Monitor, Layout as LayoutIcon, Type, Package } from "lucide-react";

export default function ShowcasePage() {
  return (
    <div className="flex-1 h-full bg-[#050608] overflow-y-auto custom-scrollbar p-12 relative">
      {/* Background Ambient Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[140px] pointer-events-none" />

      <header className="mb-16 border-b border-white/5 pb-10">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center shadow-xl shadow-indigo-500/20">
            <Monitor size={28} className="text-white" />
          </div>
          <div>
            <MockText variant="h1" className="text-4xl font-black tracking-tight text-white">Focus Engine Showcase</MockText>
            <p className="text-slate-400 mt-2 font-medium">Demonstrating Hierarchical Bubbling & Spatial Physics</p>
          </div>
        </div>
        <div className="flex gap-3">
          <MockBadge label="Spatial v2.0" color="success" />
          <MockBadge label="TV-Grade Physics" color="info" />
          <MockBadge label="Seamless Preset" color="neutral" />
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">

        {/* Scenario 1: Basic Roving List (The Sidebar Pattern) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="text-indigo-400" size={20} />
            <h2 className="text-xl font-bold text-white uppercase tracking-widest text-sm">01. Roving List</h2>
          </div>
          <OS.Zone
            id="roving-showcase"
            role="menu"
            className="bg-white/5 rounded-3xl border border-white/10 p-4 space-y-2 overflow-hidden"
          >
            {["Identity", "Security", "Infrastructure", "Telemetry", "Audit Log"].map((label, i) => (
              <OS.Item key={label} id={`roving-${i}`} payload={{ label }}>
                {({ isFocused }: { isFocused: boolean }) => (
                  <div className={`p-4 rounded-xl transition-all duration-200 flex items-center gap-4 cursor-pointer
                    ${isFocused ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 translate-x-2" : "text-slate-400 hover:bg-white/5"}
                  `}>
                    <div className={`w-2 h-2 rounded-full ${isFocused ? "bg-white" : "bg-slate-700"}`} />
                    <span className="font-semibold">{label}</span>
                  </div>
                )}
              </OS.Item>
            ))}
          </OS.Zone>
        </section>

        {/* Scenario 2: Standard Grid (The Gallery Pattern) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Grid3X3 className="text-pink-400" size={20} />
            <h2 className="text-xl font-bold text-white uppercase tracking-widest text-sm">02. Uniform Grid</h2>
          </div>
          <OS.Zone
            id="grid-showcase"
            role="grid"
            className="grid grid-cols-3 gap-4"
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <OS.Item key={i} id={`grid-item-${i}`} className="aspect-square">
                {({ isFocused }: { isFocused: boolean }) => (
                  <div className={`w-full h-full rounded-2xl border transition-all duration-300 flex items-center justify-center overflow-hidden relative
                    ${isFocused ? "border-pink-500 ring-4 ring-pink-500/20 scale-105 z-10" : "border-white/10 bg-white/5"}
                  `}>
                    <div className={`absolute inset-0 bg-gradient-to-br from-pink-500/20 to-transparent transition-opacity ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
                    <span className={`text-2xl font-black ${isFocused ? 'text-white' : 'text-slate-700'}`}>{i + 1}</span>
                  </div>
                )}
              </OS.Item>
            ))}
          </OS.Zone>
        </section>

        {/* Scenario 3: Complex Web Builder (TV-Style Spatial) */}
        <section className="xl:col-span-2 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <LayoutIcon className="text-cyan-400" size={20} />
            <h2 className="text-xl font-bold text-white uppercase tracking-widest text-sm">03. Web Builder Complexity (Physics Test)</h2>
          </div>

          <OS.Zone
            id="builder-showcase"
            role="grid"
            className="relative bg-slate-900/50 rounded-[40px] border border-white/5 p-12 min-h-[600px] overflow-hidden"
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
              <div className="col-span-7 space-y-8">
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
              <div className="col-span-5 relative mt-12">
                <OS.Item id="floating-image" className="z-20 relative">
                  {({ isFocused }: { isFocused: boolean }) => (
                    <div className={`aspect-[4/5] rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 p-1 transition-all duration-500 ${isFocused ? 'scale-110 rotate-2' : 'rotate-[-2deg]'}`}>
                      <div className="w-full h-full rounded-[1.8rem] bg-slate-900 flex items-center justify-center">
                        <MockBadge label="PRO VISION" color="info" />
                      </div>
                    </div>
                  )}
                </OS.Item>

                {/* Overlapping Widget Card */}
                <div className="absolute -left-20 -bottom-10 z-30">
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

            {/* Bottom Toolbelt */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
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

        {/* Scenario 4: Focus Trapping (The Modal Pattern) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <MousePointer2 className="text-orange-400" size={20} />
            <h2 className="text-xl font-bold text-white uppercase tracking-widest text-sm">04. Modal Jurisdictions</h2>
          </div>
          <div className="h-64 bg-white/5 rounded-3xl border border-white/10 p-8 flex items-center justify-center relative overflow-hidden">
            <MockText variant="body" className="text-slate-600 italic">Background is inactive</MockText>

            <OS.Zone
              id="modal-zone"
              role="dialog"
              className="absolute inset-x-12 inset-y-8 bg-slate-800 border-2 border-orange-500 rounded-2xl shadow-2xl p-6 flex flex-col justify-between"
            >
              <MockText variant="h2" className="text-white">Exit Confirmation</MockText>
              <div className="flex gap-4">
                <OS.Item id="modal-cancel">
                  {({ isFocused }: { isFocused: boolean }) => (
                    <button className={`flex-1 py-3 rounded-lg font-bold transition-all ${isFocused ? 'bg-white text-black' : 'bg-white/5 text-slate-400'}`}>Cancel</button>
                  )}
                </OS.Item>
                <OS.Item id="modal-confirm">
                  {({ isFocused }: { isFocused: boolean }) => (
                    <button className={`flex-1 py-3 rounded-lg font-bold transition-all ${isFocused ? 'bg-orange-500 text-white' : 'bg-orange-900/20 text-orange-900'}`}>Confirm</button>
                  )}
                </OS.Item>
              </div>
            </OS.Zone>
          </div>
        </section>

      </div>
    </div>
  );
}

function MockIcon({ name }: { name: string }) {
  switch (name) {
    case 'Move': return <MousePointer2 size={18} />;
    case 'Text': return <Type size={18} />;
    case 'Draw': return <Grid3X3 size={18} />;
    // Default fallback
    default: return <Package size={18} />;
  }
}
