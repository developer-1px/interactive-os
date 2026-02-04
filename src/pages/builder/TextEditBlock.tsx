import { OS } from "@os/ui";
import { Field } from "@os/ui/Field";
import { Type } from "lucide-react";

/**
 * TextEditBlock
 * 
 * Field 컴포넌트를 이용한 텍스트 편집 테스트.
 * Item + Field 조합으로 포커스 후 편집 모드 진입.
 */
export function TextEditBlock() {
    return (
        <section className="py-12 px-8 max-w-6xl mx-auto">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">Text Editing</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Item 선택 후 텍스트 필드 편집. Enter로 커밋, Escape로 취소.
                </p>
            </div>

            <OS.Zone
                id="text-edit-zone"
                role="listbox"
                className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
            >
                <TextEditItem
                    id="edit-heading"
                    label="제목"
                    placeholder="페이지 제목을 입력하세요..."
                    defaultValue="Welcome to the Builder"
                />
                <TextEditItem
                    id="edit-subtitle"
                    label="부제목"
                    placeholder="부제목을 입력하세요..."
                    defaultValue="Create beautiful interfaces with Focus"
                />
                <TextEditItem
                    id="edit-body"
                    label="본문"
                    placeholder="본문 내용을 입력하세요..."
                    defaultValue="이 데모에서는 Zone, Item, Field, Trigger 프리미티브가 어떻게 동작하는지 확인할 수 있습니다."
                    multiline
                />
            </OS.Zone>
        </section>
    );
}

interface TextEditItemProps {
    id: string;
    label: string;
    placeholder: string;
    defaultValue: string;
    multiline?: boolean;
}

function TextEditItem({ id, label, placeholder, defaultValue, multiline }: TextEditItemProps) {
    return (
        <OS.Item id={id}>
            {({ isFocused }: { isFocused: boolean }) => (
                <div
                    className={`
            p-4 rounded-xl border transition-all duration-200
            ${isFocused
                            ? "bg-indigo-50/50 border-indigo-300 shadow-sm"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300"
                        }
          `}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Type size={14} className={isFocused ? "text-indigo-500" : "text-slate-400"} />
                        <label className={`text-xs font-semibold uppercase tracking-wide ${isFocused ? "text-indigo-600" : "text-slate-500"}`}>
                            {label}
                        </label>
                    </div>
                    <Field
                        name={id}
                        mode="deferred"
                        value={defaultValue}
                        placeholder={placeholder}
                        multiline={multiline}
                        className={`
              w-full bg-transparent outline-none transition-colors
              ${multiline ? "min-h-[60px]" : ""}
              ${isFocused ? "text-slate-800" : "text-slate-600"}
              placeholder:text-slate-400
            `}
                    />
                </div>
            )}
        </OS.Item>
    );
}
