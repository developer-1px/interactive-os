import { OS } from "@os/ui";
import { Monitor, Repeat, ArrowRightFromLine, ArrowRight, CornerDownRight, Box, Layers } from "lucide-react";

export default function ShowcasePage() {
  return (
    <div className="flex-1 h-full bg-[#050505] text-white overflow-y-auto custom-scrollbar font-sans selection:bg-indigo-500/30">

      {/* Hero Section */}
      <div className="relative border-b border-white/10 bg-gradient-to-b from-indigo-900/20 to-transparent">
        <div className="max-w-7xl mx-auto px-12 py-16">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
              <Monitor className="text-indigo-400" size={32} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold tracking-wider border border-indigo-500/30">
                  V7.3 SYSTEM
                </span>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Focus Engine Benchmark</span>
              </div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-500">
                Focus Navigation Architectures
              </h1>
              <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
                Verify the behavior of the <strong>6-Axis Focus System</strong>.
                Test the "Zone Jump" (Escape) vs "Linear Flow" (Flow) paradigms deeply integrated into the OS kernel.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-12 py-12 pb-32 space-y-20">

        {/* 1. THE TAB STRATEGY (Primary Demo) */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Box className="text-indigo-400" size={20} />
              Navigation Policies
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Card 1: Loop (Trap) */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-b from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <OS.Zone
                id="demo-loop"
                direction="v"
                tab="loop"
                className="relative h-full bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 flex flex-col space-y-6 hover:border-pink-500/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-pink-400">
                      <Repeat size={18} />
                      <h3 className="font-bold text-sm tracking-widest uppercase">Loop Policy</h3>
                    </div>
                    <p className="text-xs text-slate-500">Traps focus inside.</p>
                  </div>
                  <div className="px-2 py-1 rounded bg-pink-500/10 text-pink-400 text-[10px] font-mono border border-pink-500/20">
                    tab="loop"
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  {["Modal Confirm", "Modal Cancel", "More Options"].map((item, i) => (
                    <OS.Item key={item} id={`loop-${i}`}>
                      {({ isFocused }: { isFocused: boolean }) => (
                        <div className={`
                          px-4 py-3 rounded-xl border flex items-center justify-between group/item cursor-pointer
                          transition-all duration-200
                          ${isFocused
                            ? 'bg-pink-500/10 border-pink-500/50 shadow-[0_0_20px_-5px_rgba(236,72,153,0.3)]'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'}
                        `}>
                          <span className={`text-sm ${isFocused ? 'text-pink-200 font-medium' : 'text-slate-400'}`}>
                            {item}
                          </span>
                          {isFocused && <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />}
                        </div>
                      )}
                    </OS.Item>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5 text-[11px] text-slate-600 font-mono text-center">
                  Press TAB to cycle explicitly within this zone.
                </div>
              </OS.Zone>
            </div>

            {/* Card 2: Escape (Zone Jump) - NEW STANDARD */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-black text-[10px] font-bold rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10">
                RECOMMENDED
              </div>

              <OS.Zone
                id="demo-escape"
                direction="v"
                tab="escape"
                className="relative h-full bg-[#0A0A0A] border border-emerald-500/30 rounded-3xl p-8 flex flex-col space-y-6 shadow-[0_0_40px_-20px_rgba(16,185,129,0.1)]"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <ArrowRightFromLine size={18} />
                      <h3 className="font-bold text-sm tracking-widest uppercase">Escape Policy</h3>
                    </div>
                    <p className="text-xs text-slate-500">Jump to next Zone.</p>
                  </div>
                  <div className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                    tab="escape"
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  {["List Item A", "List Item B", "List Item C"].map((item, i) => (
                    <OS.Item key={item} id={`escape-${i}`}>
                      {({ isFocused }: { isFocused: boolean }) => (
                        <div className={`
                          px-4 py-3 rounded-xl border flex items-center justify-between group/item cursor-pointer
                          transition-all duration-200
                          ${isFocused
                            ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'}
                        `}>
                          <span className={`text-sm ${isFocused ? 'text-emerald-200 font-medium' : 'text-slate-400'}`}>
                            {item}
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono opacity-0 group-hover/item:opacity-100 transition-opacity">
                            Arrow Keys
                          </span>
                        </div>
                      )}
                    </OS.Item>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5 text-[11px] text-slate-600 font-mono text-center">
                  TAB jumps to the next card immediately. <br />Use ARROWS to navigate items.
                </div>
              </OS.Zone>
            </div>

            {/* Card 3: Flow (Linear) */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <OS.Zone
                id="demo-flow"
                direction="v"
                tab="flow"
                className="relative h-full bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 flex flex-col space-y-6 hover:border-blue-500/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-400">
                      <ArrowRight size={18} />
                      <h3 className="font-bold text-sm tracking-widest uppercase">Flow Policy</h3>
                    </div>
                    <p className="text-xs text-slate-500">Linear Form Style.</p>
                  </div>
                  <div className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono border border-blue-500/20">
                    tab="flow"
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  {["Username Input", "Password Input", "Confirm Button"].map((item, i) => (
                    <OS.Item key={item} id={`flow-${i}`}>
                      {({ isFocused }: { isFocused: boolean }) => (
                        <div className={`
                          px-4 py-3 rounded-xl border flex items-center justify-between group/item cursor-pointer
                          transition-all duration-200
                          ${isFocused
                            ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)] transform translate-x-1'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'}
                        `}>
                          <span className={`text-sm ${isFocused ? 'text-blue-200 font-medium' : 'text-slate-400'}`}>
                            {item}
                          </span>
                          {isFocused && <CornerDownRight size={14} className="text-blue-400" />}
                        </div>
                      )}
                    </OS.Item>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5 text-[11px] text-slate-600 font-mono text-center">
                  TAB moves to the NEXT ITEM linearly.<br />(Like a legacy form)
                </div>
              </OS.Zone>
            </div>

          </div>
        </section>


        {/* 2. NESTED ZONES DEMO - ESCAPE vs FLOW */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="text-orange-400" size={20} />
              Nested Zone Patterns
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Nested Escape Pattern */}
            <div className="bg-white/5 rounded-3xl p-8 border border-white/10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <ArrowRightFromLine size={18} />
                    <h3 className="font-bold tracking-tight">Nested Escape</h3>
                  </div>
                  <p className="text-xs text-slate-500">Tab jumps between zones. Arrows explore within.</p>
                </div>
                <div className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                  RECOMMENDED
                </div>
              </div>

              <OS.Zone
                id="nested-escape-outer"
                direction="v"
                tab="escape"
                className="p-6 bg-[#0A0A0A] rounded-2xl border border-emerald-500/20 space-y-4"
              >
                <div className="flex items-center justify-between text-emerald-500 text-[10px] font-mono">
                  <span>Zone: nested-escape-outer</span>
                  <span className="bg-emerald-500/10 px-2 py-0.5 rounded">Level 1</span>
                </div>

                <div className="space-y-2">
                  {["Parent A", "Parent B"].map((item, i) => (
                    <OS.Item key={item} id={`esc-outer-${i}`}>
                      {({ isFocused }: { isFocused: boolean }) => (
                        <div className={`px-4 py-3 rounded-xl border transition-all ${isFocused ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/5 border-white/5'}`}>
                          <span className={`text-sm ${isFocused ? 'text-emerald-200' : 'text-slate-400'}`}>{item}</span>
                        </div>
                      )}
                    </OS.Item>
                  ))}
                </div>

                {/* Inner Zone */}
                <OS.Zone
                  id="nested-escape-inner"
                  direction="v"
                  tab="escape"
                  className="p-4 bg-black/50 rounded-xl border border-emerald-500/10 space-y-2"
                >
                  <div className="text-emerald-600 text-[10px] font-mono mb-2">Zone: nested-escape-inner (Level 2)</div>
                  {["Child 1", "Child 2", "Child 3"].map((item, i) => (
                    <OS.Item key={item} id={`esc-inner-${i}`}>
                      {({ isFocused }: { isFocused: boolean }) => (
                        <div className={`px-3 py-2 rounded-lg border flex items-center gap-2 transition-all ${isFocused ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-transparent border-white/5'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${isFocused ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                          <span className={`text-xs ${isFocused ? 'text-emerald-200' : 'text-slate-500'}`}>{item}</span>
                        </div>
                      )}
                    </OS.Item>
                  ))}
                </OS.Zone>
              </OS.Zone>

              <p className="text-[11px] text-slate-600 text-center font-mono">
                Tab: Jump to sibling zone → Arrow: Navigate items
              </p>
            </div>

            {/* Nested Flow Pattern */}
            <div className="bg-white/5 rounded-3xl p-8 border border-white/10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-blue-400">
                    <ArrowRight size={18} />
                    <h3 className="font-bold tracking-tight">Nested Flow</h3>
                  </div>
                  <p className="text-xs text-slate-500">Tab traverses all items linearly across zones.</p>
                </div>
                <div className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono border border-blue-500/20">
                  FORM STYLE
                </div>
              </div>

              <OS.Zone
                id="nested-flow-outer"
                direction="v"
                tab="flow"
                className="p-6 bg-[#0A0A0A] rounded-2xl border border-blue-500/20 space-y-4"
              >
                <div className="flex items-center justify-between text-blue-500 text-[10px] font-mono">
                  <span>Zone: nested-flow-outer</span>
                  <span className="bg-blue-500/10 px-2 py-0.5 rounded">Level 1</span>
                </div>

                <div className="space-y-2">
                  {["Field 1", "Field 2"].map((item, i) => (
                    <OS.Item key={item} id={`flow-outer-${i}`}>
                      {({ isFocused }: { isFocused: boolean }) => (
                        <div className={`px-4 py-3 rounded-xl border transition-all ${isFocused ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-white/5'}`}>
                          <span className={`text-sm ${isFocused ? 'text-blue-200' : 'text-slate-400'}`}>{item}</span>
                        </div>
                      )}
                    </OS.Item>
                  ))}
                </div>

                {/* Inner Zone */}
                <OS.Zone
                  id="nested-flow-inner"
                  direction="v"
                  tab="flow"
                  className="p-4 bg-black/50 rounded-xl border border-blue-500/10 space-y-2"
                >
                  <div className="text-blue-600 text-[10px] font-mono mb-2">Zone: nested-flow-inner (Level 2)</div>
                  {["Sub-field A", "Sub-field B", "Sub-field C"].map((item, i) => (
                    <OS.Item key={item} id={`flow-inner-${i}`}>
                      {({ isFocused }: { isFocused: boolean }) => (
                        <div className={`px-3 py-2 rounded-lg border flex items-center gap-2 transition-all ${isFocused ? 'bg-blue-500/20 border-blue-500/40' : 'bg-transparent border-white/5'}`}>
                          <CornerDownRight size={12} className={isFocused ? 'text-blue-400' : 'text-slate-700'} />
                          <span className={`text-xs ${isFocused ? 'text-blue-200' : 'text-slate-500'}`}>{item}</span>
                        </div>
                      )}
                    </OS.Item>
                  ))}
                </OS.Zone>
              </OS.Zone>

              <p className="text-[11px] text-slate-600 text-center font-mono">
                Tab: Next item (linear) → Arrow: Same behavior
              </p>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
