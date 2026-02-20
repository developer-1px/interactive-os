import { Field } from "@os/6-components/field/Field";
import {
  ArrowRight,
  Box,
  Brain,
  Cpu,
  Database,
  Globe,
  Layers,
  Server,
  Star,
} from "lucide-react";
import {
  BuilderApp,
  createFieldCommit,
  useSectionFields,
} from "@/apps/builder/app";
import type { Block, BuilderState } from "@/apps/builder/model/appState";
import { Builder } from "@/apps/builder/primitives/Builder";

export function NCPServicesBlock({ id }: { id: string }) {
  const fid = (local: string) => `${id}-${local}`;
  const fields = useSectionFields(id);

  const tabs = [
    { icon: Star, label: "Featured", active: true },
    { icon: Brain, label: "AI Services" },
    { icon: Cpu, label: "Compute" },
    { icon: Database, label: "Storage" },
    { icon: Server, label: "Database" },
    { icon: Box, label: "Hybrid" },
    { icon: Layers, label: "Network" },
  ];

  const block: Block | undefined = BuilderApp.useComputed((s: BuilderState) =>
    s.data.blocks.find((b: Block) => b.id === id),
  );
  const cards: Block[] = block?.children || [];

  const iconMap: Record<string, React.FC<any>> = {
    Server,
    Database,
    Brain,
    Layers,
    Globe,
    Box,
    Cpu,
    Star,
  };

  return (
    <Builder.Section asChild id={id}>
      <div className="py-24 px-6 bg-[#F8F9FA] border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-end mb-12 gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <Builder.Item asChild id={fid("category")}>
                  <Field.Editable
                    name={fid("category")}
                    mode="deferred"
                    value={fields["category"] ?? ""}
                    onCommit={createFieldCommit(id, "category")}
                    className="text-blue-600 font-bold text-xs tracking-widest uppercase"
                  />
                </Builder.Item>
              </div>
              <Builder.Item asChild id={fid("title")}>
                <Field.Editable
                  name={fid("title")}
                  mode="deferred"
                  multiline
                  value={fields["title"] ?? ""}
                  onCommit={createFieldCommit(id, "title")}
                  className={`
                    text-3xl md:text-4xl font-bold text-slate-900 leading-tight tracking-tight
                    data-[focused=true]:bg-white rounded-lg p-2 -m-2
                  `}
                />
              </Builder.Item>
            </div>

            {/* Segmented Control Tabs */}
            <div className="flex items-center bg-slate-200/50 p-1.5 rounded-xl overflow-x-auto max-w-full">
              {tabs.map((tab, i) => (
                <Builder.Item asChild key={tab.label} id={fid(`tab-${i}`)}>
                  <Builder.Button
                    id={fid(`tab-btn-${i}`)}
                    variant={tab.active ? "primary" : "ghost"}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                      ${tab.active ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}
                      data-[focused=true]:bg-white data-[focused=true]:ring-2 data-[focused=true]:ring-slate-300 data-[focused=true]:z-10
                    `}
                  >
                    <tab.icon
                      size={16}
                      className={tab.active ? "text-blue-600" : ""}
                    />
                    {tab.label}
                  </Builder.Button>
                </Builder.Item>
              ))}
            </div>
          </div>

          {/* Service Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card: Block) => {
              const cardFields = card.fields;
              const title = cardFields["item-title"] || "Service";
              const desc = cardFields["item-desc"] || "Description";
              const badge = cardFields["badge"] || "";
              const color = cardFields["color"] || "text-slate-600 bg-slate-50";
              const Icon = iconMap[cardFields["icon"] || "Box"] || Box;

              return (
                <Builder.Group asChild key={card.id} id={card.id}>
                  <div className="group bg-white rounded-2xl p-8 border border-slate-200 transition-all duration-300 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 cursor-pointer data-[focused=true]:ring-4 data-[focused=true]:ring-blue-500 data-[focused=true]:border-blue-500">
                    <div className="flex justify-between items-start mb-6">
                      <Builder.Item asChild id={`${card.id}-icon`}>
                        <Builder.Icon
                          id={`${card.id}-icon-inner`}
                          icon={Icon}
                          size={24}
                          strokeWidth={2}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} data-[focused=true]:ring-2 data-[focused=true]:ring-slate-400`}
                        />
                      </Builder.Item>
                      {badge && (
                        <Builder.Item asChild id={`${card.id}-badge`}>
                          <Builder.Badge
                            id={`${card.id}-badge-inner`}
                            variant="default"
                            className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider data-[focused=true]:ring-2 data-[focused=true]:ring-slate-400"
                          >
                            {badge}
                          </Builder.Badge>
                        </Builder.Item>
                      )}
                    </div>

                    <Builder.Item asChild id={`${card.id}-item-title`}>
                      <Field.Editable
                        name={`${card.id}-item-title`}
                        mode="deferred"
                        value={title}
                        onCommit={createFieldCommit(card.id, "item-title")}
                        className={`text-lg font-bold text-slate-900 mb-2 block`}
                      />
                    </Builder.Item>

                    <Builder.Item asChild id={`${card.id}-item-desc`}>
                      <Field.Editable
                        name={`${card.id}-item-desc`}
                        mode="deferred"
                        multiline
                        value={desc}
                        onCommit={createFieldCommit(card.id, "item-desc")}
                        className={`text-sm text-slate-500 leading-relaxed block min-h-[40px]`}
                      />
                    </Builder.Item>

                    <Builder.Item asChild id={`${card.id}-service-details`}>
                      <Builder.Link
                        id={`${card.id}-service-details-link`}
                        href="#"
                        className="mt-6 flex items-center text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 data-[focused=true]:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 data-[focused=true]:translate-x-0 duration-300 data-[focused=true]:ring-2 data-[focused=true]:ring-blue-300 data-[focused=true]:rounded"
                      >
                        <span>Details</span>
                        <ArrowRight size={16} className="ml-1" />
                      </Builder.Link>
                    </Builder.Item>
                  </div>
                </Builder.Group>
              );
            })}

            {/* "View All" Card */}
            <Builder.Group asChild id={fid("service-view-all")}>
              <div className="rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer group data-[focused=true]:ring-2 data-[focused=true]:ring-slate-400 data-[focused=true]:border-slate-400">
                <Builder.Icon
                  id={fid("service-view-all-icon")}
                  icon={ArrowRight}
                  size={24}
                  className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 group-hover:bg-slate-200 group-hover:text-slate-600 py-10 transition-colors"
                />
                <span className="text-slate-500 font-bold text-sm">
                  서비스 전체보기
                </span>
              </div>
            </Builder.Group>
          </div>
        </div>
      </div>
    </Builder.Section>
  );
}
