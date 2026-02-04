import { OS } from "@os/ui";
import { Star } from "lucide-react";

/**
 * TestimonialsBlock
 * 
 * Nested Zone Architecture:
 * - Block (Zone)
 *   - Card (Nested Zone) -> Title, Quote, Role (Items)
 */
export function TestimonialsBlock() {
    const testimonials = [
        {
            id: "testimonial-1",
            name: "Sarah Chen",
            role: "Head of Growth, Acme",
            quote: "We cut our landing page development time by 80%. The AI suggestions are scarily good.",
            avatar: "SC",
            color: "violet",
        },
        {
            id: "testimonial-2",
            name: "Marcus Johnson",
            role: "Founder, Startup",
            quote: "Finally, a builder that doesn't feel like a compromise. It's fast, beautiful, and my team actually uses it.",
            avatar: "MJ",
            color: "blue",
        },
        {
            id: "testimonial-3",
            name: "Emily Park",
            role: "Design Lead, Agency",
            quote: "The attention to detail is incredible. Every interaction feels polished.",
            avatar: "EP",
            color: "emerald",
        },
    ];

    const colorMap: Record<string, { bg: string; text: string; ring: string; light: string }> = {
        violet: { bg: "bg-violet-100", text: "text-violet-600", ring: "ring-violet-500", light: "bg-violet-50" },
        blue: { bg: "bg-blue-100", text: "text-blue-600", ring: "ring-blue-500", light: "bg-blue-50" },
        emerald: { bg: "bg-emerald-100", text: "text-emerald-600", ring: "ring-emerald-500", light: "bg-emerald-50" },
    };

    return (
        <OS.Zone
            id="testimonials-block"
            role="grid"
            tab="flow"
            seamless
            className="bg-white py-24 px-8"
        >
            <div className="max-w-5xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <OS.Item id="testimonials-eyebrow">
                        {({ isFocused }: { isFocused: boolean }) => (
                            <div className={`inline-block mb-4 transition-all px-2 py-1 rounded-md ${isFocused ? "scale-105 bg-emerald-50 ring-1 ring-emerald-200" : ""}`}>
                                <span className="text-[13px] text-emerald-600 font-semibold tracking-[0.2em]">
                                    TESTIMONIALS
                                </span>
                            </div>
                        )}
                    </OS.Item>
                    <div>
                        <OS.Item id="testimonials-title">
                            {({ isFocused }: { isFocused: boolean }) => (
                                <div
                                    className={`
                      inline-block transition-all duration-300 rounded-xl p-3 -mx-3
                      ${isFocused ? "bg-slate-100 ring-2 ring-violet-500" : ""}
                    `}
                                >
                                    <h2 className="text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-slate-900">
                                        Loved by thousands.
                                    </h2>
                                </div>
                            )}
                        </OS.Item>
                    </div>
                </div>

                {/* Testimonial Cards - Nested Zones */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((t) => {
                        const colors = colorMap[t.color];
                        return (
                            <OS.Zone
                                key={t.id}
                                id={`zone-${t.id}`}
                                integrated
                                className={`
                  relative rounded-2xl p-6 transition-all duration-300
                  bg-slate-50 border border-slate-200
                  hover:shadow-lg hover:bg-white
                `}
                            >
                                {/* Stars */}
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                                    ))}
                                </div>

                                {/* Quote */}
                                <OS.Item id={`${t.id}-quote`}>
                                    {({ isFocused }: { isFocused: boolean }) => (
                                        <p className={`text-slate-600 leading-relaxed mb-6 min-h-[60px] p-1 -m-1 rounded ${isFocused ? "bg-white ring-1 ring-slate-200 shadow-sm" : ""}`}>
                                            {t.quote}
                                        </p>
                                    )}
                                </OS.Item>

                                {/* Author */}
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center font-semibold text-sm ${colors.text}`}>
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <OS.Item id={`${t.id}-name`}>
                                            {({ isFocused }: { isFocused: boolean }) => (
                                                <div className={`font-medium text-slate-900 text-sm px-1 -mx-1 rounded inline-block ${isFocused ? "bg-white ring-1 ring-slate-200" : ""}`}>
                                                    {t.name}
                                                </div>
                                            )}
                                        </OS.Item>
                                        <OS.Item id={`${t.id}-role`}>
                                            {({ isFocused }: { isFocused: boolean }) => (
                                                <div className={`text-xs text-slate-500 px-1 -mx-1 rounded inline-block ${isFocused ? "bg-white ring-1 ring-slate-200" : ""}`}>
                                                    {t.role}
                                                </div>
                                            )}
                                        </OS.Item>
                                    </div>
                                </div>
                            </OS.Zone>
                        );
                    })}
                </div>
            </div>
        </OS.Zone>
    );
}
