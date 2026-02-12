import { OS } from "@os/AntigravityOS";
import { BarChart3, Lock, Wand2, Zap } from "lucide-react";
import { useState } from "react";

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
  const [values, setValues] = useState({
    eyebrow: "FEATURES",
    title: "Everything you need to ship.",
    mainTitle: "AI-Powered Design",
    mainDesc:
      "Generate layouts, copy, and images with a single prompt. Our AI understands your brand and creates on-brand content instantly.",
    speedTitle: "Blazing Fast",
    speedDesc: "Sub-second load times, every page.",
    securityTitle: "Enterprise Security",
    securityDesc: "SOC 2 compliant. Your data is safe.",
    analyticsTitle: "Built-in Analytics",
    analyticsDesc:
      "Track conversions, heatmaps, and user flows without extra tools.",
    collabTitle: "Real-time Collaboration",
    collabDesc: "Edit together with your team, in real-time.",
  });

  return (
    <OS.Item id="features-block" className="bg-slate-50 py-24 px-8">
      <div className="max-w-5xl mx-auto">
        {/* Section Header - Items directly in the grid zone */}
        <div className="text-center mb-16">
          <div className="mb-4">
            <OS.Item id="features-eyebrow" asChild>
              <OS.Field
                name="features-eyebrow"
                mode="deferred"
                value={values.eyebrow}
                onCommit={(val: string) =>
                  setValues((prev) => ({ ...prev, eyebrow: val }))
                }
                className={`
                                    inline-block transition-all px-2 py-1 rounded-md text-[13px] text-violet-600 font-semibold tracking-[0.2em]
                                    data-[focused=true]:scale-105 data-[focused=true]:bg-violet-50 data-[focused=true]:ring-1 data-[focused=true]:ring-violet-200
                                `}
              />
            </OS.Item>
          </div>
          <div>
            <OS.Item id="features-title" asChild>
              <OS.Field
                name="features-title"
                mode="deferred"
                value={values.title}
                onCommit={(val: string) =>
                  setValues((prev) => ({ ...prev, title: val }))
                }
                className={`
                                    inline-block transition-all duration-300 rounded-xl p-3 -mx-3
                                    text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-slate-900
                                    data-[focused=true]:bg-white data-[focused=true]:ring-2 data-[focused=true]:ring-violet-500 data-[focused=true]:shadow-sm
                                `}
              />
            </OS.Item>
          </div>
        </div>

        {/* Bento Grid - Nested Zones */}
        <div className="grid grid-cols-12 gap-4">
          {/* Large Card - Spans 7 columns */}
          <OS.Item
            id="feature-main-zone"
            className="col-span-12 md:col-span-7 flex flex-col"
          >
            <div className="relative h-[320px] rounded-2xl p-8 overflow-hidden bg-gradient-to-br from-violet-100 via-violet-50 to-white border border-violet-200">
              <div className="absolute top-8 right-8 w-24 h-24 bg-violet-200 rounded-2xl flex items-center justify-center shrink-0">
                <Wand2 size={40} className="text-violet-600" />
              </div>
              <div className="absolute bottom-8 left-8 right-8 flex flex-col items-start">
                <OS.Item id="feature-main-title" asChild>
                  <OS.Field
                    name="feature-main-title"
                    mode="deferred"
                    value={values.mainTitle}
                    onCommit={(val: string) =>
                      setValues((prev) => ({ ...prev, mainTitle: val }))
                    }
                    className={`
                                            text-2xl font-semibold text-slate-900 mb-1 px-2 py-1 -mx-2 rounded
                                            data-[focused=true]:bg-white/50 data-[focused=true]:ring-1 data-[focused=true]:ring-violet-300
                                        `}
                  />
                </OS.Item>
                <OS.Item id="feature-main-desc" asChild>
                  <OS.Field
                    name="feature-main-desc"
                    mode="deferred"
                    multiline
                    value={values.mainDesc}
                    onCommit={(val: string) =>
                      setValues((prev) => ({ ...prev, mainDesc: val }))
                    }
                    className={`
                                            text-slate-600 leading-relaxed px-2 py-1 -mx-2 rounded
                                            data-[focused=true]:bg-white/50 data-[focused=true]:ring-1 data-[focused=true]:ring-violet-300
                                        `}
                  />
                </OS.Item>
              </div>
            </div>
          </OS.Item>

          {/* Stacked Cards - Right Column */}
          <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
            <OS.Item
              id="feature-speed-zone"
              className="relative h-[152px] rounded-2xl p-6 bg-white border border-slate-200"
            >
              <div className="flex items-start justify-between h-full">
                <div className="flex flex-col items-start pr-12">
                  <OS.Item id="feature-speed-title" asChild>
                    <OS.Field
                      name="feature-speed-title"
                      mode="deferred"
                      value={values.speedTitle}
                      onCommit={(val: string) =>
                        setValues((prev) => ({ ...prev, speedTitle: val }))
                      }
                      className={`
                                                text-lg font-semibold text-slate-900 mb-1 px-1 -mx-1 rounded inline-block
                                                data-[focused=true]:bg-amber-50 data-[focused=true]:ring-1 data-[focused=true]:ring-amber-200
                                            `}
                    />
                  </OS.Item>
                  <OS.Item id="feature-speed-desc" asChild>
                    <OS.Field
                      name="feature-speed-desc"
                      mode="deferred"
                      value={values.speedDesc}
                      onCommit={(val: string) =>
                        setValues((prev) => ({ ...prev, speedDesc: val }))
                      }
                      className={`
                                                text-sm text-slate-500 px-1 -mx-1 rounded inline-block
                                                data-[focused=true]:bg-amber-50 data-[focused=true]:ring-1 data-[focused=true]:ring-amber-200
                                            `}
                    />
                  </OS.Item>
                </div>
                <div className="absolute top-6 right-6 w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Zap size={20} className="text-amber-600" />
                </div>
              </div>
            </OS.Item>

            <OS.Item
              id="feature-security-zone"
              className="relative h-[152px] rounded-2xl p-6 bg-white border border-slate-200"
            >
              <div className="flex items-start justify-between h-full">
                <div className="flex flex-col items-start pr-12">
                  <OS.Item id="feature-security-title" asChild>
                    <OS.Field
                      name="feature-security-title"
                      mode="deferred"
                      value={values.securityTitle}
                      onCommit={(val: string) =>
                        setValues((prev) => ({ ...prev, securityTitle: val }))
                      }
                      className={`
                                                text-lg font-semibold text-slate-900 mb-1 px-1 -mx-1 rounded inline-block
                                                data-[focused=true]:bg-emerald-50 data-[focused=true]:ring-1 data-[focused=true]:ring-emerald-200
                                            `}
                    />
                  </OS.Item>
                  <OS.Item id="feature-security-desc" asChild>
                    <OS.Field
                      name="feature-security-desc"
                      mode="deferred"
                      value={values.securityDesc}
                      onCommit={(val: string) =>
                        setValues((prev) => ({ ...prev, securityDesc: val }))
                      }
                      className={`
                                                text-sm text-slate-500 px-1 -mx-1 rounded inline-block
                                                data-[focused=true]:bg-emerald-50 data-[focused=true]:ring-1 data-[focused=true]:ring-emerald-200
                                            `}
                    />
                  </OS.Item>
                </div>
                <div className="absolute top-6 right-6 w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                  <Lock size={20} className="text-emerald-600" />
                </div>
              </div>
            </OS.Item>
          </div>

          {/* Bottom Row - Nested Zones */}
          <OS.Item
            id="feature-analytics-zone"
            className="col-span-12 md:col-span-6 h-[160px] rounded-2xl p-6 bg-white border border-slate-200 shrink-0"
          >
            <div className="flex items-center gap-4 h-full">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <BarChart3 size={24} className="text-blue-600" />
              </div>
              <div className="flex flex-col items-start">
                <OS.Item id="feature-analytics-title" asChild>
                  <OS.Field
                    name="feature-analytics-title"
                    mode="deferred"
                    value={values.analyticsTitle}
                    onCommit={(val: string) =>
                      setValues((prev) => ({ ...prev, analyticsTitle: val }))
                    }
                    className={`
                                            text-lg font-semibold text-slate-900 mb-1 px-1 -mx-1 rounded inline-block
                                            data-[focused=true]:bg-blue-50 data-[focused=true]:ring-1 data-[focused=true]:ring-blue-200
                                        `}
                  />
                </OS.Item>
                <OS.Item id="feature-analytics-desc" asChild>
                  <OS.Field
                    name="feature-analytics-desc"
                    mode="deferred"
                    multiline
                    value={values.analyticsDesc}
                    onCommit={(val: string) =>
                      setValues((prev) => ({ ...prev, analyticsDesc: val }))
                    }
                    className={`
                                            text-sm text-slate-500 px-1 -mx-1 rounded inline-block
                                            data-[focused=true]:bg-blue-50 data-[focused=true]:ring-1 data-[focused=true]:ring-blue-200
                                        `}
                  />
                </OS.Item>
              </div>
            </div>
          </OS.Item>

          <OS.Item
            id="feature-collab-zone"
            className="col-span-12 md:col-span-6 h-[160px] rounded-2xl p-6 bg-white border border-slate-200 shrink-0"
          >
            <div className="flex items-center gap-4 h-full">
              <div className="flex -space-x-2 shrink-0">
                {["🧑‍💻", "👩‍🎨", "🧑‍🔬"].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center border-2 border-white text-lg"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-start">
                <OS.Item id="feature-collab-title" asChild>
                  <OS.Field
                    name="feature-collab-title"
                    mode="deferred"
                    value={values.collabTitle}
                    onCommit={(val: string) =>
                      setValues((prev) => ({ ...prev, collabTitle: val }))
                    }
                    className={`
                                            text-lg font-semibold text-slate-900 mb-1 px-1 -mx-1 rounded inline-block
                                            data-[focused=true]:bg-pink-50 data-[focused=true]:ring-1 data-[focused=true]:ring-pink-200
                                        `}
                  />
                </OS.Item>
                <OS.Item id="feature-collab-desc" asChild>
                  <OS.Field
                    name="feature-collab-desc"
                    mode="deferred"
                    value={values.collabDesc}
                    onCommit={(val: string) =>
                      setValues((prev) => ({ ...prev, collabDesc: val }))
                    }
                    className={`
                                            text-sm text-slate-500 px-1 -mx-1 rounded inline-block
                                            data-[focused=true]:bg-pink-50 data-[focused=true]:ring-1 data-[focused=true]:ring-pink-200
                                        `}
                  />
                </OS.Item>
              </div>
            </div>
          </OS.Item>
        </div>
      </div>
    </OS.Item>
  );
}
