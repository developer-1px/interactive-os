import { Field } from "@os/6-components/field/Field";
import { Item } from "@os/6-components/primitives/Item";
import { Star } from "lucide-react";
import { BuilderApp, createFieldCommit } from "@/apps/builder/app";

/**
 * TestimonialsBlock
 *
 * Nested Zone Architecture:
 * - Block (Zone)
 *   - Card (Nested Zone) -> Title, Quote, Role (Items)
 */
export function TestimonialsBlock() {
  const fields = BuilderApp.useComputed((s) => s.data.fields);

  const testimonials = [
    {
      id: "testimonial-1",
      avatar: "SC",
      color: "violet",
    },
    {
      id: "testimonial-2",
      avatar: "MJ",
      color: "blue",
    },
    {
      id: "testimonial-3",
      avatar: "EP",
      color: "emerald",
    },
  ];

  const colorMap: Record<
    string,
    { bg: string; text: string; ring: string; light: string }
  > = {
    violet: {
      bg: "bg-violet-100",
      text: "text-violet-600",
      ring: "ring-violet-500",
      light: "bg-violet-50",
    },
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      ring: "ring-blue-500",
      light: "bg-blue-50",
    },
    emerald: {
      bg: "bg-emerald-100",
      text: "text-emerald-600",
      ring: "ring-emerald-500",
      light: "bg-emerald-50",
    },
  };

  return (
    <Item id="testimonials-block" className="bg-white py-24 px-8">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="mb-4">
            <Item id="testimonials-eyebrow" asChild>
              <Field
                name="testimonials-eyebrow"
                mode="deferred"
                value={fields["testimonials-eyebrow"] ?? ""}
                onCommit={createFieldCommit("testimonials-eyebrow")}
                className={`
                                    inline-block transition-all px-2 py-1 rounded-md text-[13px] text-emerald-600 font-semibold tracking-[0.2em]
                                    data-[focused=true]:scale-105 data-[focused=true]:bg-emerald-50 data-[focused=true]:ring-1 data-[focused=true]:ring-emerald-200
                                `}
              />
            </Item>
          </div>
          <div>
            <Item id="testimonials-title" asChild>
              <Field
                name="testimonials-title"
                mode="deferred"
                value={fields["testimonials-title"] ?? ""}
                onCommit={createFieldCommit("testimonials-title")}
                className={`
                                    inline-block transition-all duration-300 rounded-xl p-3 -mx-3
                                    text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-slate-900
                                    data-[focused=true]:bg-slate-100 data-[focused=true]:ring-2 data-[focused=true]:ring-violet-500
                                `}
              />
            </Item>
          </div>
        </div>

        {/* Testimonial Cards - Nested Zones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => {
            const colors = colorMap[t.color]!;
            return (
              <Item
                key={t.id}
                id={`zone-${t.id}`}
                className={`
                  relative rounded-2xl p-6 transition-all duration-300
                  bg-slate-50 border border-slate-200
                  hover:shadow-lg hover:bg-white
                `}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className="text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <div className="mb-6 h-full flex flex-col items-start min-h-[80px]">
                  <Item id={`${t.id}-quote`} asChild>
                    <Field
                      name={`${t.id}-quote`}
                      mode="deferred"
                      multiline
                      value={fields[`${t.id}-quote`] ?? ""}
                      onCommit={createFieldCommit(`${t.id}-quote`)}
                      className={`
                                                text-slate-600 leading-relaxed p-1 -m-1 rounded w-full
                                                data-[focused=true]:bg-white data-[focused=true]:ring-1 data-[focused=true]:ring-slate-200 data-[focused=true]:shadow-sm
                                            `}
                    />
                  </Item>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center font-semibold text-sm ${colors.text} shrink-0`}
                  >
                    {t.avatar}
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <Item id={`${t.id}-name`} asChild>
                      <Field
                        name={`${t.id}-name`}
                        mode="deferred"
                        value={fields[`${t.id}-name`] ?? ""}
                        onCommit={createFieldCommit(`${t.id}-name`)}
                        className={`
                                                    font-medium text-slate-900 text-sm px-1 -mx-1 rounded inline-block truncate w-full
                                                    data-[focused=true]:bg-white data-[focused=true]:ring-1 data-[focused=true]:ring-slate-200
                                                `}
                      />
                    </Item>
                    <Item id={`${t.id}-role`} asChild>
                      <Field
                        name={`${t.id}-role`}
                        mode="deferred"
                        value={fields[`${t.id}-role`] ?? ""}
                        onCommit={createFieldCommit(`${t.id}-role`)}
                        className={`
                                                    text-xs text-slate-500 px-1 -mx-1 rounded inline-block truncate w-full
                                                    data-[focused=true]:bg-white data-[focused=true]:ring-1 data-[focused=true]:ring-slate-200
                                                `}
                      />
                    </Item>
                  </div>
                </div>
              </Item>
            );
          })}
        </div>
      </div>
    </Item>
  );
}
