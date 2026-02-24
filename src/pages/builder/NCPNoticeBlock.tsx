import { Field } from "@os/6-components/field/Field";
import { X } from "lucide-react";
import { createFieldCommit, useSectionFields } from "@/apps/builder/app";
import { Builder } from "@/apps/builder/primitives/Builder";

/**
 * NCPNoticeBlock
 *
 * NCP 포털 공지사항 배너.
 * 원본 디자인:
 *   - 파란 틴트 배경: bg-[#117CE9]/[.08]
 *   - 좌: "공지사항" (파란 라벨) | 공지 텍스트 (line-clamp-2)
 *   - 우: X 닫기 버튼
 *
 * @container 쿼리 대신 Tailwind 반응형 래핑 사용 (md: breakpoint 기준)
 */
export function NCPNoticeBlock({ id }: { id: string }) {
  const fid = (local: string) => `${id}-${local}`;
  const fields = useSectionFields(id);

  return (
    <Builder.Section asChild id={id}>
      <div className="w-full px-4 py-3 md:px-6 md:py-4">
        <div className="max-w-7xl mx-auto">
          {/* 원본: rounded-[20px] bg-[#117CE9]/[.08] p-[20px] @lg:px-[30px] @lg:py-[24px] */}
          <div className="rounded-[20px] bg-[#117CE9]/[.08] p-[20px] lg:px-[30px] lg:py-[24px] leading-[24px] text-[#222222]">
            <div className="flex place-content-between items-start">
              <div className="flex grow md:flex-row flex-col">
                {/* 라벨 영역 */}
                <div className="flex items-center shrink-0 mr-0 md:mr-[10px]">
                  <Builder.Item asChild id={fid("label")}>
                    <Field.Editable
                      name={fid("label")}
                      mode="deferred"
                      value={fields["label"] ?? "공지사항"}
                      onCommit={createFieldCommit(id, "label")}
                      className="m-0 text-[16px] font-bold leading-[150%] whitespace-nowrap text-[#117CE9]
                        data-[focused=true]:bg-[#117CE9]/10 rounded px-1 -mx-1"
                    />
                  </Builder.Item>
                  {/* 원본: | 구분자 (md 이상에서만) */}
                  <span className="hidden md:block mx-[10px] text-[15px] text-[#D9D9D9] leading-none select-none">
                    |
                  </span>
                </div>

                {/* 공지 텍스트 */}
                {/* 원본: max-w-[1020px] grow, h6 line-clamp-2 */}
                <div className="max-w-[1020px] grow mt-[10px] md:mt-0">
                  <Builder.Item asChild id={fid("text")}>
                    <Field.Editable
                      name={fid("text")}
                      mode="deferred"
                      fieldType="block"
                      value={fields["text"] ?? ""}
                      onCommit={createFieldCommit(id, "text")}
                      className="m-0 text-[16px] font-bold leading-[150%] line-clamp-2 block
                        data-[focused=true]:line-clamp-none data-[focused=true]:bg-[#117CE9]/10 rounded px-1 -mx-1"
                    />
                  </Builder.Item>
                </div>
              </div>

              {/* 닫기 버튼 */}
              <Builder.Item asChild id={fid("close")}>
                <button
                  type="button"
                  aria-label="닫기"
                  className="ml-[22px] shrink-0 h-[24px] w-[24px] flex items-center justify-center
                    border-none bg-transparent text-[#222222] cursor-pointer
                    hover:text-[#555] transition-colors
                    data-[focused=true]:ring-2 data-[focused=true]:ring-[#117CE9] data-[focused=true]:rounded"
                >
                  <X size={14} />
                </button>
              </Builder.Item>
            </div>
          </div>
        </div>
      </div>
    </Builder.Section>
  );
}
