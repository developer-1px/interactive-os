import { Field } from "@os/6-components/field/Field";
import { createFieldCommit, useSectionFields } from "@/apps/builder/app";
import { Builder } from "@/apps/builder/primitives/Builder";

/**
 * NCPProductHeroBlock
 *
 * NCP 서비스 상세 페이지 Hero 배너.
 * 원본 디자인: temp.html → #heroBanner
 */
export function NCPProductHeroBlock({ id }: { id: string }) {
    const fid = (local: string) => `${id}-${local}`;
    const fields = useSectionFields(id);

    const isDeprecated = fields["deprecated"] === "true";

    return (
        <Builder.Section asChild id={id}>
            <div>
                {/* ── Deprecated 공지 배너 ──────────────────────────────────── */}
                {isDeprecated && (
                    <div className="w-full bg-[#fff3cd] border-b border-[#ffc107] px-4 py-3">
                        <div className="max-w-7xl mx-auto px-6 flex items-start gap-3">
                            <span className="shrink-0 mt-0.5 text-[#856404] font-bold text-[14px]">⚠</span>
                            <div>
                                <Builder.Item asChild id={fid("notice-title")}>
                                    <Field.Editable
                                        name={fid("notice-title")}
                                        mode="deferred"
                                        value={fields["notice-title"] ?? ""}
                                        onCommit={createFieldCommit(id, "notice-title")}
                                        className="font-bold text-[14px] text-[#856404] block"
                                    />
                                </Builder.Item>
                                <Builder.Item asChild id={fid("notice-desc")}>
                                    <Field.Editable
                                        name={fid("notice-desc")}
                                        mode="deferred"
                                        fieldType="block"
                                        value={fields["notice-desc"] ?? ""}
                                        onCommit={createFieldCommit(id, "notice-desc")}
                                        className="text-[14px] text-[#856404] mt-[2px] block"
                                    />
                                </Builder.Item>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Hero Banner ───────────────────────────────────────────── */}
                {/* 원본: @md:h-[380px] h-[400px] bg-[#222] */}
                <div
                    className="relative h-[400px] md:h-[380px] bg-[#222] bg-cover bg-right bg-no-repeat"
                    style={{
                        backgroundImage: `url("https://portal.gcdn.ntruss.com/image/Media%20Services%20Graphic_Mobile@2x_1720502747322.png")`,
                    }}
                >
                    {/* 좌→우 그라디언트 오버레이 */}
                    <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#222] via-[#222]/80 to-transparent" />

                    <div className="relative z-[2] flex h-full flex-col text-white max-w-7xl mx-auto px-6">
                        {/* 브레드크럼 — lg 이상 표시 */}
                        <div className="hidden lg:flex items-center pt-[14px]">
                            <nav aria-label="Breadcrumb">
                                <ol className="flex items-center p-0 list-none">
                                    {[
                                        fields["breadcrumb-1"] ?? "서비스",
                                        fields["breadcrumb-2"] ?? "AI Services",
                                    ].map((label, i) => (
                                        <li key={i} className="flex items-center">
                                            {i > 0 && (
                                                <span className="mx-[6px] text-xs text-white/60">›</span>
                                            )}
                                            <a className="text-sm font-semibold text-white/80 cursor-pointer underline underline-offset-2 hover:text-white">
                                                {label}
                                            </a>
                                        </li>
                                    ))}
                                    <li className="flex items-center">
                                        <span className="mx-[6px] text-xs text-white/60">›</span>
                                        <span className="text-sm font-semibold text-white">
                                            {fields["service-name"] ?? ""}
                                        </span>
                                    </li>
                                </ol>
                            </nav>
                        </div>

                        {/* 서비스 정보 */}
                        <div className="flex flex-1 flex-col justify-center">
                            {/* Deprecated 배지 */}
                            {isDeprecated && (
                                <div className="flex items-center gap-[15px] mb-[10px]">
                                    <Builder.Item asChild id={fid("badge")}>
                                        <Builder.Badge
                                            id={fid("badge-inner")}
                                            variant="default"
                                            className="px-[8px] py-[2px] text-[12px] font-bold bg-[#666] text-white rounded-[4px]
                        data-[focused=true]:ring-2 data-[focused=true]:ring-white/50"
                                        >
                                            {fields["badge-text"] ?? "Deprecated"}
                                        </Builder.Badge>
                                    </Builder.Item>
                                </div>
                            )}

                            {/* 서비스명 — 원본: @lg:text-[50px] text-[36px] */}
                            <Builder.Item asChild id={fid("service-name")}>
                                <Field.Editable
                                    name={fid("service-name")}
                                    mode="deferred"
                                    value={fields["service-name"] ?? ""}
                                    onCommit={createFieldCommit(id, "service-name")}
                                    className="block text-[36px] lg:text-[50px] font-bold leading-[120%] mb-0 mt-[15px] text-white
                    data-[focused=true]:bg-white/10 data-[focused=true]:ring-2 data-[focused=true]:ring-white/40 rounded-lg px-2 -mx-2"
                                />
                            </Builder.Item>

                            {/* 설명 — 원본: @md:max-w-[800px] text-[18px] */}
                            <Builder.Item asChild id={fid("service-desc")}>
                                <Field.Editable
                                    name={fid("service-desc")}
                                    mode="deferred"
                                    fieldType="block"
                                    value={fields["service-desc"] ?? ""}
                                    onCommit={createFieldCommit(id, "service-desc")}
                                    className="block text-[18px] font-normal leading-[150%] text-white/90 mt-[14px] md:max-w-[800px]
                    data-[focused=true]:bg-white/10 data-[focused=true]:ring-2 data-[focused=true]:ring-white/40 rounded-lg px-2 -mx-2"
                                />
                            </Builder.Item>

                            {/* CTA 버튼 — 원본: btn-default btn-large / btn-ghost */}
                            <div className="mt-5 flex items-center gap-2">
                                <Builder.Item asChild id={fid("cta-primary")}>
                                    <Builder.Button
                                        id={fid("cta-primary-btn")}
                                        variant="primary"
                                        className="h-[44px] min-w-[110px] px-[20px] rounded-full bg-[#117ce9] text-white text-[15px] font-semibold
                      hover:bg-[#0F6DCD] transition-colors
                      data-[focused=true]:ring-2 data-[focused=true]:ring-white data-[focused=true]:ring-offset-2 data-[focused=true]:ring-offset-[#222]"
                                    >
                                        <Field.Editable
                                            name={fid("cta-primary")}
                                            mode="deferred"
                                            value={fields["cta-primary"] ?? ""}
                                            onCommit={createFieldCommit(id, "cta-primary")}
                                            className="bg-transparent text-inherit"
                                        />
                                    </Builder.Button>
                                </Builder.Item>

                                <Builder.Item asChild id={fid("cta-secondary")}>
                                    <Builder.Button
                                        id={fid("cta-secondary-btn")}
                                        variant="outline"
                                        className="h-[44px] min-w-[110px] px-[20px] rounded-full border border-white text-white bg-transparent text-[15px] font-semibold
                      hover:bg-white/10 transition-colors
                      data-[focused=true]:ring-2 data-[focused=true]:ring-white"
                                    >
                                        <Field.Editable
                                            name={fid("cta-secondary")}
                                            mode="deferred"
                                            value={fields["cta-secondary"] ?? ""}
                                            onCommit={createFieldCommit(id, "cta-secondary")}
                                            className="bg-transparent text-inherit"
                                        />
                                    </Builder.Button>
                                </Builder.Item>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 탭 네비게이션 ─────────────────────────────────────────── */}
                {/* 원본: flex w-full rounded-xl bg-[#F6F7F8] + 각 탭 */}
                <div className="px-[20px] pt-[20px] lg:pt-[12px] max-w-7xl mx-auto">
                    <div className="flex w-full rounded-xl bg-[#F6F7F8]">
                        {(fields["tabs"] ?? "개요,상세 기능,요금,리소스,FAQ")
                            .split(",")
                            .map((tab, i) => (
                                <Builder.Item asChild key={i} id={fid(`tab-${i}`)}>
                                    <div
                                        className={`flex h-[44px] flex-1 cursor-pointer items-center justify-center rounded-xl
                      text-[15px] font-semibold leading-normal
                      transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow]
                      data-[focused=true]:ring-2 data-[focused=true]:ring-inset data-[focused=true]:ring-[#117ce9]
                      ${i === 0
                                                ? "bg-[#222222] text-white"
                                                : "bg-[unset] text-[#222222] hover:bg-[#e7e7e7]"
                                            }`}
                                    >
                                        {tab.trim()}
                                    </div>
                                </Builder.Item>
                            ))}
                    </div>
                </div>
            </div>
        </Builder.Section>
    );
}
