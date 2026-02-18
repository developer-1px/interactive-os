import { Field } from "@os/6-components/primitives/Field";
import { Item } from "@os/6-components/primitives/Item";
import { ArrowRight } from "lucide-react";
import { BuilderApp, builderUpdateField } from "@/apps/builder/app";

/**
 * CTABlock
 *
 * Light Theme CTA
 * Focus Verification Mode: All text interactive via OS.Item
 */
export function CTABlock() {
  const fields = BuilderApp.useComputed((s) => s.data.fields);

  return (
    <Item
      id="cta-block"
      className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 py-32 px-8 overflow-hidden"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-fuchsia-500/20 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Headline */}
        <div className="mb-6">
          <Item id="cta-headline" asChild>
            <Field
              name="cta-headline"
              mode="deferred"
              value={fields["cta-headline"] ?? ""}
              onCommit={(val: string) =>
                builderUpdateField("cta-headline", val)
              }
              className={`
                                transition-all duration-300 rounded-2xl p-4 -mx-4 cursor-default
                                text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-white
                                data-[focused=true]:bg-white/10 data-[focused=true]:ring-2 data-[focused=true]:ring-white/50
                                data-[editing=true]:bg-white/20 data-[editing=true]:shadow-2xl
                            `}
            />
          </Item>
        </div>

        {/* Subtext */}
        <div className="mb-10">
          <Item id="cta-subtext" asChild>
            <Field
              name="cta-subtext"
              mode="deferred"
              value={fields["cta-subtext"] ?? ""}
              onCommit={(val: string) => builderUpdateField("cta-subtext", val)}
              className={`
                                transition-all duration-300 rounded-xl p-3 -mx-3 cursor-default
                                text-lg text-white/70
                                data-[focused=true]:bg-white/10 data-[focused=true]:ring-2 data-[focused=true]:ring-white/50
                                data-[editing=true]:bg-white/20
                            `}
            />
          </Item>
        </div>

        {/* CTA Button */}
        <Item id="cta-button">
          {({ isFocused }: { isFocused: boolean }) => (
            <button
              type="button"
              className={`
                inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-300
                ${
                  isFocused
                    ? "bg-white text-violet-700 scale-110 shadow-2xl"
                    : "bg-white text-violet-700 hover:shadow-xl"
                }
              `}
            >
              Get started free
              <ArrowRight size={20} />
            </button>
          )}
        </Item>

        {/* Footer Note */}
        <div className="mt-8">
          <Item id="cta-footer" asChild>
            <Field
              name="cta-footer"
              mode="deferred"
              value={fields["cta-footer"] ?? ""}
              onCommit={(val: string) => builderUpdateField("cta-footer", val)}
              className={`
                                px-2 py-1 rounded inline-block transition-all
                                text-sm text-white/50
                                data-[focused=true]:bg-white/10 data-[focused=true]:text-white/80
                            `}
            />
          </Item>
        </div>
      </div>
    </Item>
  );
}
