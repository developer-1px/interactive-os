/**
 * TabContainerBlock — Generic container block for tabbed content.
 *
 * 3-tier hierarchy:
 *   tabs (this block, accept: ["tab"])
 *     └─ tab (structural node, accept: ["section"])
 *          └─ section (content leaf, has fields)
 *
 * Tab labels come from tab.label.
 * Tab panel content comes from tab.children (sections).
 *
 * Design: Matches NCP block tone (premium gradients, spacing, typography).
 */

import { BuilderApp } from "@/apps/builder/app";
import { Builder } from "@/apps/builder/primitives/Builder";

export function TabContainerBlock({ id }: { id: string }) {
  const block = BuilderApp.useComputed((s) =>
    s.data.blocks.find((b) => b.id === id),
  );
  const tabs = block?.children || []; // type: "tab" nodes

  return (
    <Builder.Section asChild id={id}>
      <div className="py-20 px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto">
          {/* Optional title */}
          {block?.fields?.["title"] && (
            <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
              {block.fields["title"]}
            </h2>
          )}

          {/* Tab Container — tabs are derived from tab children */}
          {tabs.length > 0 ? (
            <Builder.Tabs id={`${id}-tabs`} block={block} className="w-full">
              {tabs.map((tab) => (
                <Builder.TabPanel key={tab.id}>
                  <TabPanelContent tab={tab} />
                </Builder.TabPanel>
              ))}
            </Builder.Tabs>
          ) : (
            /* Empty state — no tabs yet */
            <div className="py-20 text-center text-slate-400 border-2 border-dashed border-slate-300 rounded-2xl bg-white/50 backdrop-blur-sm shadow-sm">
              <p className="text-base font-semibold text-slate-600">
                No tabs yet
              </p>
              <p className="text-sm mt-2 text-slate-500">
                Add tab blocks here to create tabs
              </p>
            </div>
          )}
        </div>
      </div>
    </Builder.Section>
  );
}

// ─── Tab Panel Content — renders sections inside a tab ───

interface TabNode {
  id: string;
  label: string;
  type: string;
  fields: Record<string, string>;
  children?: TabNode[];
}

function TabPanelContent({ tab }: { tab: TabNode }) {
  const sections = tab.children || [];

  if (sections.length === 0) {
    return (
      <div className="py-16 mt-8 text-center border border-slate-100 bg-white rounded-2xl">
        <p className="text-base text-slate-500">
          Empty tab —{" "}
          <span className="font-semibold text-slate-700">"{tab.label}"</span>
        </p>
        <p className="text-sm mt-2 text-slate-400">
          Paste sections here to add content
        </p>
      </div>
    );
  }

  return (
    <div className="py-10 space-y-6">
      {sections.map((section) => (
        <Builder.Item asChild id={section.id} key={section.id}>
          <div className="p-8 bg-white rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/20 hover:shadow-xl hover:border-slate-300 transition-all">
            {section.fields["heading"] && (
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {section.fields["heading"]}
              </h3>
            )}
            {section.fields["description"] && (
              <p className="text-base text-slate-600 leading-relaxed">
                {section.fields["description"]}
              </p>
            )}
            {/* Render any other fields */}
            {Object.entries(section.fields)
              .filter(([key]) => key !== "heading" && key !== "description")
              .map(([key, value]) => (
                <div key={key} className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs text-indigo-500 font-bold uppercase tracking-widest">
                    {key}
                  </span>
                  <p className="text-sm text-slate-700 mt-1">{value}</p>
                </div>
              ))}
          </div>
        </Builder.Item>
      ))}
    </div>
  );
}

TabContainerBlock.displayName = "TabContainerBlock";
