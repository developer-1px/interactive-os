import { OS } from "@os/ui";
import { Zap, Lock, Wand2, BarChart3 } from "lucide-react";

/**
 * FeaturesBlock
 * 
 * Nested Zone Architecture:
 * - Block (Zone role=grid)
 *   - Card (Zone role=listbox/group)
 *     - Item (Title)
 *     - Item (Desc)
 */
export function FeaturesBlock() {
    return (
        <OS.Zone
            id="features-block"
            role="grid"
            tab="flow"
            seamless
            className="bg-slate-50 py-24 px-8"
        >
            <div className="max-w-5xl mx-auto">
                {/* Section Header - Items directly in the grid zone */}
                <div className="text-center mb-16">
                    <OS.Item id="features-eyebrow">
                        {({ isFocused }: { isFocused: boolean }) => (
                            <div className={`inline-block mb-4 transition-all px-2 py-1 rounded-md ${isFocused ? "scale-105 bg-violet-50 ring-1 ring-violet-200" : ""}`}>
                                <span className="text-[13px] text-violet-600 font-semibold tracking-[0.2em]">
                                    FEATURES
                                </span>
                            </div>
                        )}
                    </OS.Item>
                    <div>
                        <OS.Item id="features-title">
                            {({ isFocused }: { isFocused: boolean }) => (
                                <div
                                    className={`
                    inline-block transition-all duration-300 rounded-xl p-3 -mx-3
                    ${isFocused ? "bg-white ring-2 ring-violet-500 shadow-sm" : ""}
                  `}
                                >
                                    <h2 className="text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-slate-900">
                                        Everything you need to ship.
                                    </h2>
                                </div>
                            )}
                        </OS.Item>
                    </div>
                </div>

                {/* Bento Grid - Nested Zones */}
                <div className="grid grid-cols-12 gap-4">
                    {/* Large Card - Spans 7 columns */}
                    <OS.Zone
                        id="feature-main-zone"
                        integrated
                        className="col-span-12 md:col-span-7 flex flex-col"
                    >
                        <div className="relative h-[320px] rounded-2xl p-8 overflow-hidden bg-gradient-to-br from-violet-100 via-violet-50 to-white border border-violet-200">
                            <div className="absolute top-8 right-8 w-24 h-24 bg-violet-200 rounded-2xl flex items-center justify-center">
                                <Wand2 size={40} className="text-violet-600" />
                            </div>
                            <div className="absolute bottom-8 left-8 right-8">
                                <OS.Item id="feature-main-title">
                                    {({ isFocused }: { isFocused: boolean }) => (
                                        <h3 className={`text-2xl font-semibold text-slate-900 mb-3 px-2 py-1 -mx-2 rounded ${isFocused ? "bg-white/50 ring-1 ring-violet-300" : ""}`}>
                                            AI-Powered Design
                                        </h3>
                                    )}
                                </OS.Item>
                                <OS.Item id="feature-main-desc">
                                    {({ isFocused }: { isFocused: boolean }) => (
                                        <p className={`text-slate-600 leading-relaxed px-2 py-1 -mx-2 rounded ${isFocused ? "bg-white/50 ring-1 ring-violet-300" : ""}`}>
                                            Generate layouts, copy, and images with a single prompt. Our AI understands your brand and creates on-brand content instantly.
                                        </p>
                                    )}
                                </OS.Item>
                            </div>
                        </div>
                    </OS.Zone>

                    {/* Stacked Cards - Right Column */}
                    <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
                        <OS.Zone id="feature-speed-zone" integrated className="relative h-[152px] rounded-2xl p-6 bg-white border border-slate-200">
                            <div className="flex items-start justify-between h-full">
                                <div>
                                    <OS.Item id="feature-speed-title">
                                        {({ isFocused }: { isFocused: boolean }) => (
                                            <h3 className={`text-lg font-semibold text-slate-900 mb-1 px-1 -mx-1 rounded inline-block ${isFocused ? "bg-amber-50 ring-1 ring-amber-200" : ""}`}>
                                                Blazing Fast
                                            </h3>
                                        )}
                                    </OS.Item>
                                    <OS.Item id="feature-speed-desc">
                                        {({ isFocused }: { isFocused: boolean }) => (
                                            <p className={`text-sm text-slate-500 px-1 -mx-1 rounded inline-block ${isFocused ? "bg-amber-50 ring-1 ring-amber-200" : ""}`}>
                                                Sub-second load times, every page.
                                            </p>
                                        )}
                                    </OS.Item>
                                </div>
                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                    <Zap size={20} className="text-amber-600" />
                                </div>
                            </div>
                        </OS.Zone>

                        <OS.Zone id="feature-security-zone" integrated className="relative h-[152px] rounded-2xl p-6 bg-white border border-slate-200">
                            <div className="flex items-start justify-between h-full">
                                <div>
                                    <OS.Item id="feature-security-title">
                                        {({ isFocused }: { isFocused: boolean }) => (
                                            <h3 className={`text-lg font-semibold text-slate-900 mb-1 px-1 -mx-1 rounded inline-block ${isFocused ? "bg-emerald-50 ring-1 ring-emerald-200" : ""}`}>
                                                Enterprise Security
                                            </h3>
                                        )}
                                    </OS.Item>
                                    <OS.Item id="feature-security-desc">
                                        {({ isFocused }: { isFocused: boolean }) => (
                                            <p className={`text-sm text-slate-500 px-1 -mx-1 rounded inline-block ${isFocused ? "bg-emerald-50 ring-1 ring-emerald-200" : ""}`}>
                                                SOC 2 compliant. Your data is safe.
                                            </p>
                                        )}
                                    </OS.Item>
                                </div>
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <Lock size={20} className="text-emerald-600" />
                                </div>
                            </div>
                        </OS.Zone>
                    </div>

                    {/* Bottom Row - Nested Zones */}
                    <OS.Zone id="feature-analytics-zone" integrated className="col-span-12 md:col-span-6 h-[160px] rounded-2xl p-6 bg-white border border-slate-200">
                        <div className="flex items-center gap-4 h-full">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <BarChart3 size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <OS.Item id="feature-analytics-title">
                                    {({ isFocused }: { isFocused: boolean }) => (
                                        <h3 className={`text-lg font-semibold text-slate-900 mb-1 px-1 -mx-1 rounded inline-block ${isFocused ? "bg-blue-50 ring-1 ring-blue-200" : ""}`}>
                                            Built-in Analytics
                                        </h3>
                                    )}
                                </OS.Item>
                                <OS.Item id="feature-analytics-desc">
                                    {({ isFocused }: { isFocused: boolean }) => (
                                        <p className={`text-sm text-slate-500 px-1 -mx-1 rounded inline-block ${isFocused ? "bg-blue-50 ring-1 ring-blue-200" : ""}`}>
                                            Track conversions, heatmaps, and user flows without extra tools.
                                        </p>
                                    )}
                                </OS.Item>
                            </div>
                        </div>

                    </OS.Zone>

                    <OS.Zone id="feature-collab-zone" integrated className="col-span-12 md:col-span-6 h-[160px] rounded-2xl p-6 bg-white border border-slate-200">

                        <div className="flex items-center gap-4 h-full">
                            <div className="flex -space-x-2">
                                {["🧑‍💻", "👩‍🎨", "🧑‍🔬"].map((emoji, i) => (
                                    <div key={i} className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center border-2 border-white text-lg">
                                        {emoji}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <OS.Item id="feature-collab-title">
                                    {({ isFocused }: { isFocused: boolean }) => (
                                        <h3 className={`text-lg font-semibold text-slate-900 mb-1 px-1 -mx-1 rounded inline-block ${isFocused ? "bg-pink-50 ring-1 ring-pink-200" : ""}`}>
                                            Real-time Collaboration
                                        </h3>
                                    )}
                                </OS.Item>
                                <OS.Item id="feature-collab-desc">
                                    {({ isFocused }: { isFocused: boolean }) => (
                                        <p className={`text-sm text-slate-500 px-1 -mx-1 rounded inline-block ${isFocused ? "bg-pink-50 ring-1 ring-pink-200" : ""}`}>
                                            Edit together with your team, in real-time.
                                        </p>
                                    )}
                                </OS.Item>
                            </div>
                        </div>

                    </OS.Zone>
                </div>
            </div>
        </OS.Zone>
    );
}
