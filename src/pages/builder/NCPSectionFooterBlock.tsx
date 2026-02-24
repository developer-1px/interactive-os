import { Field } from "@os/6-components/field/Field";
import { createFieldCommit, useSectionFields } from "@/apps/builder/app";
import { Builder } from "@/apps/builder/primitives/Builder";

/**
 * NCPSectionFooterBlock
 *
 * NCP 포털 섹션 하단 CTA 배너 (Section Footer).
 * 원본 HTML:
 *   <div class="@md:py-[60px] @lg:block hidden bg-[#222] bg-cover bg-no-repeat py-[75px]"
 *        style="background-image:url(...)">
 *     <div class="container text-white">
 *       <h3>...</h3>
 *       <div class="flex mt-5">
 *         <a class="btn-default btn-large ...">이용 신청</a>
 *         <a class="btn-ghost btn-large ...">요금 계산</a>
 *       </div>
 *     </div>
 *   </div>
 *
 * @md:/@lg: 컨테이너 쿼리 → 표준 md:/lg:, container → max-w-7xl mx-auto px-6
 */
export function NCPSectionFooterBlock({ id }: { id: string }) {
    const fid = (local: string) => `${id}-${local}`;
    const fields = useSectionFields(id);

    const bgImage = fields["bg-image"] ?? "https://portal.gcdn.ntruss.com/image/Database_1720489901543.png";

    return (
        <Builder.Section asChild id={id}>
            {/* 원본: hidden lg:block / py-[75px] md:py-[60px] */}
            <div
                className="bg-[#222] bg-cover bg-no-repeat py-[75px] md:py-[60px]"
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className="max-w-7xl mx-auto px-6 text-white">
                    {/* h3 — 원본: @lg:text-[28px] text-[22px] @md:w-[398px] @lg:w-[582px] */}
                    <h3 className="m-0 text-[22px] lg:text-[28px] font-bold leading-[150%] md:max-w-[398px] lg:max-w-[582px] xl:max-w-[600px] break-keep">
                        <Builder.Item asChild id={fid("title")}>
                            <Field.Editable
                                name={fid("title")}
                                mode="deferred"
                                fieldType="block"
                                value={fields["title"] ?? ""}
                                onCommit={createFieldCommit(id, "title")}
                                className="block data-[focused=true]:bg-white/10 data-[focused=true]:ring-2 data-[focused=true]:ring-white/40 rounded-lg px-2 -mx-2"
                            />
                        </Builder.Item>
                    </h3>

                    {/* CTA 버튼 — 원본: flex mt-5 */}
                    <div className="flex mt-5 gap-2">
                        {/* btn-default btn-large — 파란 solid */}
                        <Builder.Item asChild id={fid("cta-primary")}>
                            <Builder.Button
                                id={fid("cta-primary-btn")}
                                variant="primary"
                                className="h-[44px] min-w-[120px] px-[20px] rounded-full
                  bg-[#117ce9] text-white text-[15px] font-semibold
                  hover:bg-[#0F6DCD] transition-colors
                  data-[focused=true]:ring-2 data-[focused=true]:ring-white data-[focused=true]:ring-offset-2 data-[focused=true]:ring-offset-[#222]"
                            >
                                <Field.Editable
                                    name={fid("cta-primary")}
                                    mode="deferred"
                                    value={fields["cta-primary"] ?? "이용 신청"}
                                    onCommit={createFieldCommit(id, "cta-primary")}
                                    className="bg-transparent text-inherit"
                                />
                            </Builder.Button>
                        </Builder.Item>

                        {/* btn-ghost btn-large — 테두리 ghost */}
                        <Builder.Item asChild id={fid("cta-secondary")}>
                            <Builder.Button
                                id={fid("cta-secondary-btn")}
                                variant="outline"
                                className="h-[44px] min-w-[120px] px-[20px] rounded-full
                  border border-white text-white bg-transparent text-[15px] font-semibold
                  hover:bg-white/10 transition-colors
                  data-[focused=true]:ring-2 data-[focused=true]:ring-white"
                            >
                                <Field.Editable
                                    name={fid("cta-secondary")}
                                    mode="deferred"
                                    value={fields["cta-secondary"] ?? "요금 계산"}
                                    onCommit={createFieldCommit(id, "cta-secondary")}
                                    className="bg-transparent text-inherit"
                                />
                            </Builder.Button>
                        </Builder.Item>
                    </div>
                </div>
            </div>
        </Builder.Section>
    );
}
