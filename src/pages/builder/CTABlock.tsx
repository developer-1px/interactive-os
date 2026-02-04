import { OS } from "@os/ui";
import { ArrowRight } from "lucide-react";

/**
 * CTABlock
 * 
 * Light Theme CTA
 * Focus Verification Mode: All text interactive via OS.Item
 */
export function CTABlock() {
    return (
        <OS.Zone
            id="cta-block"
            role="grid"
            tab="flow"
            seamless
            className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 py-32 px-8 overflow-hidden"
        >
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-fuchsia-500/20 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative max-w-3xl mx-auto text-center">
                {/* Headline */}
                <OS.Item id="cta-headline">
                    {({ isFocused }: { isFocused: boolean }) => (
                        <div
                            className={`
                mb-6 transition-all duration-300 rounded-2xl p-4 -mx-4 cursor-default
                ${isFocused ? "bg-white/10 ring-2 ring-white/50" : ""}
              `}
                        >
                            <h2 className="text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-white">
                                Ready to build something amazing?
                            </h2>
                        </div>
                    )}
                </OS.Item>

                {/* Subtext */}
                <OS.Item id="cta-subtext">
                    {({ isFocused }: { isFocused: boolean }) => (
                        <div
                            className={`
                mb-10 transition-all duration-300 rounded-xl p-3 -mx-3 cursor-default
                ${isFocused ? "bg-white/10 ring-2 ring-white/50" : ""}
              `}
                        >
                            <p className="text-lg text-white/70">
                                Start free. No credit card required. Cancel anytime.
                            </p>
                        </div>
                    )}
                </OS.Item>

                {/* CTA Button */}
                <OS.Item id="cta-button">
                    {({ isFocused }: { isFocused: boolean }) => (
                        <button
                            className={`
                inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-300
                ${isFocused
                                    ? "bg-white text-violet-700 scale-110 shadow-2xl"
                                    : "bg-white text-violet-700 hover:shadow-xl"
                                }
              `}
                        >
                            Get started free
                            <ArrowRight size={20} />
                        </button>
                    )}
                </OS.Item>

                {/* Footer Note */}
                <OS.Item id="cta-footer">
                    {({ isFocused }: { isFocused: boolean }) => (
                        <div className={`mt-8 px-2 py-1 rounded inline-block transition-all ${isFocused ? "bg-white/10" : ""}`}>
                            <p className="text-sm text-white/50">
                                Join 10,000+ teams already using our platform
                            </p>
                        </div>
                    )}
                </OS.Item>
            </div>
        </OS.Zone>
    );
}
