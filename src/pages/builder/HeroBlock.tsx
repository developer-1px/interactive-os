import { useState } from "react";
import { OS } from "@os/features/AntigravityOS";
import { Field } from "@os/primitives/Field.tsx";

/**
 * HeroBlock
 * 
 * Premium Hero Section - Light Theme
 * Focus Verification Mode: All text elements are focusable Items
 */
export function HeroBlock() {
    const [values, setValues] = useState({
        badge: "NEW — Now with AI-powered layouts",
        headline: "Build websites that convert.",
        subheadline: "The visual builder for teams who ship fast. No code required, just drag, drop, and publish."
    });

    return (
        <OS.Zone
            id="hero-block"
            role="grid"
            tab="flow"
            seamless
            className="relative bg-white text-slate-900 overflow-hidden"
        >
            {/* Subtle Grid Background */}
            <div
                className="absolute inset-0 opacity-[0.4]"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)`,
                    backgroundSize: '64px 64px'
                }}
            />

            {/* Gradient Orbs - Soft */}
            <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-violet-200/40 via-fuchsia-200/20 to-transparent rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative max-w-4xl mx-auto px-8 py-32 text-center">
                {/* Announcement Badge */}
                <div className="mb-8">
                    <OS.Item id="hero-badge" asChild>
                        <Field
                            name="hero-badge"
                            mode="deferred"
                            value={values.badge}
                            onCommit={(val: string) => setValues(prev => ({ ...prev, badge: val }))}
                            className={`
                                inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300 cursor-default
                                data-[focused=true]:bg-violet-600 data-[focused=true]:text-white data-[focused=true]:scale-105 data-[focused=true]:shadow-lg data-[focused=true]:shadow-violet-500/30
                                data-[focused=false]:bg-slate-100 data-[focused=false]:text-slate-600 data-[focused=false]:border data-[focused=false]:border-slate-200
                                data-[editing=true]:ring-2 data-[editing=true]:ring-violet-300 data-[editing=true]:bg-violet-700
                            `}
                        />
                    </OS.Item>
                </div>

                {/* Main Headline */}
                <OS.Item id="hero-headline" asChild>
                    <Field
                        name="hero-headline"
                        mode="deferred"
                        value={values.headline}
                        onCommit={(val: string) => setValues(prev => ({ ...prev, headline: val }))}
                        className={`
                            mb-6 transition-all duration-300 rounded-2xl p-4 -mx-4 cursor-default
                            text-[56px] md:text-[72px] font-semibold tracking-[-0.04em] leading-[1.05] text-slate-900
                            data-[focused=true]:bg-slate-100 data-[focused=true]:ring-2 data-[focused=true]:ring-violet-500
                            data-[editing=true]:bg-white data-[editing=true]:shadow-xl
                        `}
                    />
                </OS.Item>

                {/* Subheadline */}
                <OS.Item id="hero-subheadline" asChild>
                    <Field
                        name="hero-subheadline"
                        mode="deferred"
                        multiline
                        value={values.subheadline}
                        onCommit={(val: string) => setValues(prev => ({ ...prev, subheadline: val }))}
                        className={`
                            mb-12 max-w-xl mx-auto transition-all duration-300 rounded-xl p-3 -mx-3 cursor-default
                            text-lg text-slate-500 leading-relaxed font-normal
                            data-[focused=true]:bg-slate-100 data-[focused=true]:ring-2 data-[focused=true]:ring-violet-500
                            data-[editing=true]:bg-white data-[editing=true]:shadow-lg
                        `}
                    />
                </OS.Item>

                {/* CTA Buttons */}
                <div className="flex items-center justify-center gap-4">
                    <OS.Item id="hero-cta-primary">
                        {({ isFocused }: { isFocused: boolean }) => (
                            <button
                                className={`
                  px-7 py-3.5 rounded-xl font-medium text-[15px] transition-all duration-300
                  ${isFocused
                                        ? "bg-violet-600 text-white scale-105 shadow-xl shadow-violet-500/40"
                                        : "bg-slate-900 text-white hover:bg-slate-800"
                                    }
                `}
                            >
                                Start for free
                            </button>
                        )}
                    </OS.Item>

                    <OS.Item id="hero-cta-secondary">
                        {({ isFocused }: { isFocused: boolean }) => (
                            <button
                                className={`
                  px-7 py-3.5 rounded-xl font-medium text-[15px] transition-all duration-300 border
                  ${isFocused
                                        ? "bg-violet-50 border-violet-500 text-violet-700 scale-105"
                                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                                    }
                `}
                            >
                                Watch demo →
                            </button>
                        )}
                    </OS.Item>
                </div>

                {/* Trust Bar */}
                <div className="mt-16 pt-8 border-t border-slate-200">
                    <p className="text-[13px] text-slate-400 uppercase tracking-[0.15em] font-medium mb-6">
                        Trusted by teams at
                    </p>
                    <div className="flex items-center justify-center gap-12">
                        {["Vercel", "Linear", "Notion", "Figma", "Stripe"].map((brand) => (
                            <OS.Item key={brand} id={`brand-${brand}`}>
                                {({ isFocused }: { isFocused: boolean }) => (
                                    <span
                                        className={`
                        text-slate-400 font-semibold tracking-tight text-lg transition-colors duration-300 rounded-md px-2 py-1
                        ${isFocused ? "text-violet-600 bg-violet-50 ring-1 ring-violet-200" : ""}
                      `}
                                    >
                                        {brand}
                                    </span>
                                )}
                            </OS.Item>
                        ))}
                    </div>
                </div>
            </div>
        </OS.Zone>
    );
}
