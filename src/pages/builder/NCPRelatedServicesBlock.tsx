import { Field } from "@os/6-components/field/Field";
import {
    BuilderApp,
    createFieldCommit,
    useSectionFields,
} from "@/apps/builder/app";
import type { Block, BuilderState } from "@/apps/builder/model/appState";
import { Builder } from "@/apps/builder/primitives/Builder";

/**
 * NCPRelatedServicesBlock
 *
 * NCP 연동 부가 서비스 — 가로 스크롤 카드 캐러셀.
 * 원본 디자인: 서비스 상세 페이지 하단 연동 서비스 섹션.
 *
 *   h3: 연동 부가 서비스
 *   가로 스크롤: 카드마다 rounded-[20px], border, category badge + title + desc
 */
export function NCPRelatedServicesBlock({ id }: { id: string }) {
    const fid = (local: string) => `${id}-${local}`;
    const fields = useSectionFields(id);

    const block: Block | undefined = BuilderApp.useComputed((s: BuilderState) =>
        s.data.blocks.find((b: Block) => b.id === id),
    );
    const cards: Block[] = block?.children ?? [];

    return (
        <Builder.Section asChild id={id}>
            <section className="bg-[#f6f7f8] py-[60px] lg:py-[80px]">
                <div className="max-w-7xl mx-auto px-6">
                    {/* 섹션 제목 */}
                    <h3 className="m-0 text-[22px] lg:text-[28px] font-bold leading-[150%] text-black mb-[30px]">
                        <Builder.Item asChild id={fid("section-title")}>
                            <Field.Editable
                                name={fid("section-title")}
                                mode="deferred"
                                value={fields["section-title"] ?? ""}
                                onCommit={createFieldCommit(id, "section-title")}
                                className="block data-[focused=true]:bg-slate-200/80 data-[focused=true]:ring-2 data-[focused=true]:ring-slate-300 rounded-lg px-2 -mx-2"
                            />
                        </Builder.Item>
                    </h3>

                    {/* 가로 스크롤 카드 */}
                    <div
                        className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory"
                        style={{ scrollbarWidth: "thin" }}
                    >
                        {cards.map((card) => {
                            const cf = card.fields;
                            const title = cf["card-title"] ?? "";
                            const desc = cf["card-desc"] ?? "";
                            const category = cf["category"] ?? "";
                            const badge = cf["badge"] ?? "";

                            return (
                                <Builder.Group asChild key={card.id} id={card.id}>
                                    <div
                                        className="relative flex-shrink-0 w-[387px] h-[387px] rounded-[20px] border border-solid border-[#e5e5e5] bg-white p-[30px] snap-start
                    cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-[#117ce9]/30
                    data-[focused=true]:ring-4 data-[focused=true]:ring-[#117ce9]/30 data-[focused=true]:border-[#117ce9]/40"
                                    >
                                        {/* 상단: 카테고리 뱃지 */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100" />
                                            <div className="flex gap-1.5">
                                                {badge && (
                                                    <span className="inline-block rounded px-1.5 py-0.5 text-xs font-semibold text-white bg-[#117ce9]">
                                                        {badge}
                                                    </span>
                                                )}
                                                {category && (
                                                    <span className="inline-block rounded border border-solid border-[#dadada] px-1.5 py-0.5 text-xs font-semibold text-[#555]">
                                                        {category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 카드 제목 */}
                                        <h4 className="m-0 text-[18px] lg:text-[20px] font-bold leading-[150%] text-black mb-[10px]">
                                            <Builder.Item asChild id={`${card.id}-card-title`}>
                                                <Field.Editable
                                                    name={`${card.id}-card-title`}
                                                    mode="deferred"
                                                    value={title}
                                                    onCommit={createFieldCommit(card.id, "card-title")}
                                                    className="block data-[focused=true]:bg-slate-200/50 data-[focused=true]:ring-1 data-[focused=true]:ring-slate-400 rounded px-1 -mx-1"
                                                />
                                            </Builder.Item>
                                        </h4>

                                        {/* 카드 설명 */}
                                        <p className="m-0 text-[18px] font-normal leading-[150%] text-[#707070] line-clamp-4">
                                            <Builder.Item asChild id={`${card.id}-card-desc`}>
                                                <Field.Editable
                                                    name={`${card.id}-card-desc`}
                                                    mode="deferred"
                                                    fieldType="block"
                                                    value={desc}
                                                    onCommit={createFieldCommit(card.id, "card-desc")}
                                                    className="block data-[focused=true]:bg-slate-200/50 data-[focused=true]:ring-1 data-[focused=true]:ring-slate-400 rounded px-1 -mx-1"
                                                />
                                            </Builder.Item>
                                        </p>

                                        {/* 화살표 아이콘 */}
                                        <div className="absolute bottom-[30px] right-[30px] text-[#ccc] text-xl">
                                            →
                                        </div>
                                    </div>
                                </Builder.Group>
                            );
                        })}
                    </div>
                </div>
            </section>
        </Builder.Section>
    );
}
