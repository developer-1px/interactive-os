import { Field } from "@os/6-components/field/Field";
import {
    BuilderApp,
    createFieldCommit,
    useSectionFields,
} from "@/apps/builder/app";
import type { Block, BuilderState } from "@/apps/builder/model/appState";
import { Builder } from "@/apps/builder/primitives/Builder";

/**
 * NCPFeatureCardsBlock
 *
 * NCP 서비스 특징 섹션 — 2열 카드 그리드.
 * 원본 디자인: temp.html → section#bb7579e2 / section#68dda144
 *
 *   h2: 서비스 특징
 *   h3: 서브타이틀 (e.g. "AI 학습 기반의 유해 이미지 탐지 자동화")
 *   그리드: 2열, 카드마다 rounded-[20px] bg-[#f6f7f8], h-[390px]
 *   카드 내부: h4 title + paragraph desc
 */
export function NCPFeatureCardsBlock({ id }: { id: string }) {
    const fid = (local: string) => `${id}-${local}`;
    const fields = useSectionFields(id);

    const block: Block | undefined = BuilderApp.useComputed((s: BuilderState) =>
        s.data.blocks.find((b: Block) => b.id === id),
    );
    const cards: Block[] = block?.children ?? [];

    return (
        <Builder.Section asChild id={id}>
            <section className="mt-[40px] lg:mt-[60px] mb-[60px] lg:mb-[80px]">
                <div className="max-w-7xl mx-auto px-6">
                    {/* h2 섹션 제목 */}
                    <h2 className="m-0 text-[28px] lg:text-[38px] font-bold leading-[120%]">
                        <Builder.Item asChild id={fid("section-title")}>
                            <Field.Editable
                                name={fid("section-title")}
                                mode="deferred"
                                value={fields["section-title"] ?? ""}
                                onCommit={createFieldCommit(id, "section-title")}
                                className="block mt-[40px] lg:mt-[60px] mb-0 text-[#222]
                  data-[focused=true]:bg-slate-100 data-[focused=true]:ring-2 data-[focused=true]:ring-slate-300 rounded-lg px-2 -mx-2"
                            />
                        </Builder.Item>
                    </h2>

                    {/* h3 서브타이틀 */}
                    <h3 className="m-0 text-[22px] lg:text-[28px] font-bold leading-[150%] max-w-[800px] mt-[40px]">
                        <Builder.Item asChild id={fid("subtitle")}>
                            <Field.Editable
                                name={fid("subtitle")}
                                mode="deferred"
                                fieldType="block"
                                value={fields["subtitle"] ?? ""}
                                onCommit={createFieldCommit(id, "subtitle")}
                                className="block text-[#222]
                  data-[focused=true]:bg-slate-100 data-[focused=true]:ring-2 data-[focused=true]:ring-slate-300 rounded-lg px-2 -mx-2"
                            />
                        </Builder.Item>
                    </h3>

                    {/* 2열 카드 그리드 */}
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 mt-[40px]"
                        style={{ gap: "20px" }}
                    >
                        {cards.map((card) => {
                            const cardFields = card.fields;
                            const title = cardFields["card-title"] ?? "";
                            const desc = cardFields["card-desc"] ?? "";

                            return (
                                <Builder.Group asChild key={card.id} id={card.id}>
                                    {/* 원본: rounded-[20px] bg-[#f6f7f8] h-[390px] py-[30px] pl-[30px] pr-[60px] */}
                                    <div className="relative rounded-[20px] bg-[#f6f7f8] text-[#707070] py-[30px] pl-[30px] pr-[60px] min-h-[390px]
                    data-[focused=true]:ring-4 data-[focused=true]:ring-[#117ce9]/30 data-[focused=true]:bg-[#f0f5ff]
                    transition-all duration-200">

                                        {/* 카드 제목 */}
                                        <h4 className="m-0 text-[18px] lg:text-[20px] font-bold leading-[150%] mb-[10px] mt-0 text-[#222]">
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
                                        <p className="m-0 text-[18px] font-normal leading-[150%]">
                                            <Builder.Item asChild id={`${card.id}-card-desc`}>
                                                <Field.Editable
                                                    name={`${card.id}-card-desc`}
                                                    mode="deferred"
                                                    fieldType="block"
                                                    value={desc}
                                                    onCommit={createFieldCommit(card.id, "card-desc")}
                                                    className="block text-[#707070] data-[focused=true]:bg-slate-200/50 data-[focused=true]:ring-1 data-[focused=true]:ring-slate-400 rounded px-1 -mx-1"
                                                />
                                            </Builder.Item>
                                        </p>

                                        {/* 원본: 카드 하단 링크 자리 (h-[1px] w-[24px] 밑줄) */}
                                        <div className="absolute bottom-[30px] left-[30px]">
                                            <Builder.Item asChild id={`${card.id}-card-link`}>
                                                <Builder.Link
                                                    id={`${card.id}-card-link-inner`}
                                                    href="#"
                                                    className="text-[#117ce9] text-[15px] font-semibold opacity-0 group-hover:opacity-100 data-[focused=true]:opacity-100 transition-opacity
                            data-[focused=true]:underline"
                                                >
                                                    자세히 보기
                                                </Builder.Link>
                                            </Builder.Item>
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
