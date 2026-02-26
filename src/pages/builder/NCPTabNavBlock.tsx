import { useSelection } from "@os/5-hooks/useSelection";
import { Item as OSItem } from "@os/6-components/primitives/Item";
import { Zone } from "@os/6-components/primitives/Zone";
import { BuilderApp } from "@/apps/builder/app";
import type { Block, BuilderState } from "@/apps/builder/model/appState";
import { Builder } from "@/apps/builder/primitives/Builder";

/**
 * NCPTabNavBlock — Tab Container
 *
 * NCP 서비스 상세 페이지 탭 컨테이너.
 * children에서 탭 라벨과 패널 콘텐츠를 읽음.
 *
 * 구조:
 *   ncp-tab-nav (this block)
 *     ├── tab "개요"      (children: [...sections...])
 *     ├── tab "상세 기능"  (children: [ncp-feature-cards])
 *     └── tab "리소스"     (children: [...])
 *
 * OS Zone(role=tablist) + Item(role=tab)으로 키보드 네비게이션 지원.
 * 활성 탭은 OS selection으로 관리.
 */

import { BLOCK_REGISTRY } from "@/apps/builder/blockRegistry";

export function NCPTabNavBlock({ id }: { id: string }) {
  const fid = (local: string) => `${id}-${local}`;

  const block: Block | undefined = BuilderApp.useComputed((s: BuilderState) =>
    s.data.blocks.find((b: Block) => b.id === id),
  );
  const tabs: Block[] = block?.children ?? [];

  const tablistId = `${id}-tablist`;

  // OS selection으로 active 탭 관리
  const selection = useSelection(tablistId);
  const firstTabId = tabs.length > 0 ? tabs[0].id : fid("tab-0");
  const selectedTabId = selection[0] ?? firstTabId;
  const activeIndex = tabs.findIndex((t) => t.id === selectedTabId);
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  const activeTab = tabs[safeActiveIndex];
  const panelSections = activeTab?.children ?? [];

  return (
    <Builder.Section asChild id={id}>
      <div>
        {/* 탭 리스트 — NCP pill 스타일 */}
        <div className="px-[20px] pt-[20px] lg:pt-[12px] max-w-7xl mx-auto">
          <Zone
            id={tablistId}
            role="tablist"
            className="flex w-full rounded-xl bg-[#F6F7F8]"
            options={{
              navigate: { orientation: "horizontal" },
              tab: { behavior: "flow" },
            }}
          >
            {tabs.map((tab, i) => {
              const isActive = i === safeActiveIndex;
              return (
                <OSItem key={tab.id} id={tab.id} asChild>
                  <button
                    type="button"
                    role="tab"
                    tabIndex={-1}
                    aria-controls={`${id}-panel-${i}`}
                    className={`flex h-[44px] flex-1 cursor-pointer items-center justify-center rounded-xl
                      text-[15px] font-semibold leading-normal outline-none
                      transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow]
                      data-[focused]:ring-2 data-[focused]:ring-inset data-[focused]:ring-[#117ce9]
                      ${
                        isActive
                          ? "bg-[#222222] text-white"
                          : "bg-[unset] text-[#222222] hover:bg-[#e7e7e7]"
                      }`}
                  >
                    {tab.label}
                  </button>
                </OSItem>
              );
            })}
          </Zone>
        </div>

        {/* 탭 패널 — 활성 탭의 children 렌더링 */}
        {panelSections.length > 0 && (
          <div id={`${id}-panel-${safeActiveIndex}`} role="tabpanel">
            {panelSections.map((section) => {
              const Renderer = BLOCK_REGISTRY[section.type];
              if (Renderer)
                return <Renderer key={section.id} id={section.id} />;
              // fallback: 기본 텍스트
              return (
                <div key={section.id} className="max-w-7xl mx-auto px-6 py-8">
                  <p className="text-slate-500">{section.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* 빈 탭 패널 */}
        {panelSections.length === 0 && (
          <div
            id={`${id}-panel-${safeActiveIndex}`}
            role="tabpanel"
            className="max-w-7xl mx-auto px-6 py-16 text-center text-slate-400"
          >
            <p className="text-base font-semibold text-slate-500">
              {activeTab?.label ?? "탭"} — 콘텐츠가 없습니다
            </p>
            <p className="text-sm mt-2">이 탭에 섹션을 추가하세요.</p>
          </div>
        )}
      </div>
    </Builder.Section>
  );
}
