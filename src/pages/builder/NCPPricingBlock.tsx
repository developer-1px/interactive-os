/**
 * NCPPricingBlock — Demo tab container block for the Builder.
 *
 * Uses Builder.Tabs (first container structural primitive) to show
 * pricing plans that switch between Monthly and Annual views.
 *
 * Design: Free-form HTML/CSS.
 * Editing: Builder Primitives annotate editable parts.
 */

import { Builder } from "@/apps/builder/primitives/Builder";
import { createFieldCommit, useSectionFields } from "@/apps/builder/app";
import { Field } from "@os/6-components/field/Field";

export function NCPPricingBlock({ id }: { id: string }) {
    const fields = useSectionFields(id);

    return (
        <Builder.Section asChild id={id}>
            <div className="py-20 px-8 bg-gradient-to-b from-slate-50 to-white">
                {/* Section Header */}
                <div className="max-w-4xl mx-auto text-center mb-12">
                    <Builder.Item asChild id={`${id}-badge`}>
                        <div className="inline-block">
                            <Builder.Badge
                                id={`${id}-badge`}
                                variant="success"
                                className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold tracking-wider rounded-full mb-4 border border-slate-200"
                            >
                                {fields["badge"] || "PRICING"}
                            </Builder.Badge>
                        </div>
                    </Builder.Item>

                    <Builder.Item asChild id={`${id}-title`}>
                        <Field
                            onCommit={createFieldCommit(id, "title")}
                            value={fields["title"] || "Simple, transparent pricing"}
                            mode="deferred"
                        >
                            <h2 className="text-3xl font-bold text-slate-900 mb-3">
                                {fields["title"] || "Simple, transparent pricing"}
                            </h2>
                        </Field>
                    </Builder.Item>

                    <Builder.Item asChild id={`${id}-sub`}>
                        <Field
                            onCommit={createFieldCommit(id, "sub")}
                            value={fields["sub"] || "Choose the plan that fits your needs"}
                            mode="deferred"
                        >
                            <p className="text-slate-500 text-lg">
                                {fields["sub"] || "Choose the plan that fits your needs"}
                            </p>
                        </Field>
                    </Builder.Item>
                </div>

                {/* Tab Container — Builder.Tabs primitive */}
                <Builder.Tabs
                    id={`${id}-plans`}
                    tabs={["Monthly", "Annual"]}
                    className="max-w-4xl mx-auto"
                >
                    {/* Monthly Panel */}
                    <Builder.TabPanel>
                        <div className="grid grid-cols-3 gap-6 mt-8">
                            <PricingCard
                                id={`${id}-monthly-starter`}
                                fields={fields}
                                prefix="m-starter"
                                defaults={{ name: "Starter", price: "$29", period: "/mo", desc: "Perfect for small teams", cta: "Get Started" }}
                                highlight={false}
                            />
                            <PricingCard
                                id={`${id}-monthly-pro`}
                                fields={fields}
                                prefix="m-pro"
                                defaults={{ name: "Professional", price: "$79", period: "/mo", desc: "For growing businesses", cta: "Start Free Trial" }}
                                highlight={true}
                            />
                            <PricingCard
                                id={`${id}-monthly-ent`}
                                fields={fields}
                                prefix="m-ent"
                                defaults={{ name: "Enterprise", price: "$199", period: "/mo", desc: "For large organizations", cta: "Contact Sales" }}
                                highlight={false}
                            />
                        </div>
                    </Builder.TabPanel>

                    {/* Annual Panel */}
                    <Builder.TabPanel>
                        <div className="grid grid-cols-3 gap-6 mt-8">
                            <PricingCard
                                id={`${id}-annual-starter`}
                                fields={fields}
                                prefix="a-starter"
                                defaults={{ name: "Starter", price: "$290", period: "/yr", desc: "Save 17% with annual", cta: "Get Started" }}
                                highlight={false}
                            />
                            <PricingCard
                                id={`${id}-annual-pro`}
                                fields={fields}
                                prefix="a-pro"
                                defaults={{ name: "Professional", price: "$790", period: "/yr", desc: "Save 17% with annual", cta: "Start Free Trial" }}
                                highlight={true}
                            />
                            <PricingCard
                                id={`${id}-annual-ent`}
                                fields={fields}
                                prefix="a-ent"
                                defaults={{ name: "Enterprise", price: "$1,990", period: "/yr", desc: "Save 17% with annual", cta: "Contact Sales" }}
                                highlight={false}
                            />
                        </div>
                    </Builder.TabPanel>
                </Builder.Tabs>
            </div>
        </Builder.Section>
    );
}

// ─── PricingCard — reusable sub-component ───

function PricingCard({
    id,
    fields,
    prefix,
    defaults,
    highlight,
}: {
    id: string;
    fields: Record<string, string>;
    prefix: string;
    defaults: { name: string; price: string; period: string; desc: string; cta: string };
    highlight: boolean;
}) {
    return (
        <div
            className={`
        rounded-3xl p-8 flex flex-col transition-all duration-300
        ${highlight
                    ? "bg-slate-900 text-white shadow-2xl ring-1 ring-slate-800 scale-[1.03]"
                    : "bg-white text-slate-900 shadow-lg border border-slate-200 hover:shadow-xl hover:-translate-y-1"
                }
      `}
        >
            <Builder.Item asChild id={`${id}-name`}>
                <Field
                    onCommit={createFieldCommit(id.split("-").slice(0, -2).join("-"), `${prefix}-name`)}
                    value={fields[`${prefix}-name`] || defaults.name}
                    mode="deferred"
                >
                    <h3
                        className={`text-xl font-bold mb-2 ${highlight ? "text-slate-100" : "text-slate-700"}`}
                    >
                        {fields[`${prefix}-name`] || defaults.name}
                    </h3>
                </Field>
            </Builder.Item>

            <div className="flex items-baseline mb-4">
                <Builder.Item asChild id={`${id}-price`}>
                    <Field
                        onCommit={createFieldCommit(id.split("-").slice(0, -2).join("-"), `${prefix}-price`)}
                        value={fields[`${prefix}-price`] || defaults.price}
                        mode="deferred"
                    >
                        <span className="text-4xl font-bold tracking-tight">
                            {fields[`${prefix}-price`] || defaults.price}
                        </span>
                    </Field>
                </Builder.Item>
                <span className={`ml-1 text-base font-medium ${highlight ? "text-slate-400" : "text-slate-500"}`}>
                    {defaults.period}
                </span>
            </div>

            <Builder.Item asChild id={`${id}-desc`}>
                <Field
                    onCommit={createFieldCommit(id.split("-").slice(0, -2).join("-"), `${prefix}-desc`)}
                    value={fields[`${prefix}-desc`] || defaults.desc}
                    mode="deferred"
                >
                    <p className={`text-base font-medium mb-8 ${highlight ? "text-slate-300" : "text-slate-500"}`}>
                        {fields[`${prefix}-desc`] || defaults.desc}
                    </p>
                </Field>
            </Builder.Item>

            <div className="mt-auto">
                <Builder.Button
                    id={`${id}-cta`}
                    variant="primary"
                    className={`
              w-full py-4 px-6 rounded-full text-base font-bold transition-all duration-300
              ${highlight
                            ? "bg-[#03C75A] text-white hover:bg-[#02b350] hover:shadow-lg hover:shadow-green-500/20"
                            : "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200"
                        }
            `}
                >
                    {fields[`${prefix}-cta`] || defaults.cta}
                </Builder.Button>
            </div>
        </div>
    );
}
