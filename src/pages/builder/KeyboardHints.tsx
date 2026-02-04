import { Kbd } from "@os/ui/Kbd";

/**
 * KeyboardHints
 * 
 * 사용 가능한 키보드 단축키 안내.
 */
export function KeyboardHints() {
    return (
        <section className="py-8 px-8 max-w-6xl mx-auto">
            <div className="bg-slate-800 rounded-2xl p-6 text-white">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-4">
                    Keyboard Shortcuts
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                    <ShortcutItem keys={["↑", "↓", "←", "→"]} description="포커스 이동" />
                    <ShortcutItem keys={["Tab"]} description="다음 Zone으로" />
                    <ShortcutItem keys={["Enter"]} description="선택 / 편집" />
                    <ShortcutItem keys={["Escape"]} description="취소 / 나가기" />
                    <ShortcutItem keys={["⌘", "C"]} description="복사" />
                    <ShortcutItem keys={["⌘", "V"]} description="붙여넣기" />
                    <ShortcutItem keys={["⌘", "D"]} description="복제" />
                    <ShortcutItem keys={["⌫"]} description="삭제" />
                </div>
            </div>
        </section>
    );
}

interface ShortcutItemProps {
    keys: string[];
    description: string;
}

function ShortcutItem({ keys, description }: ShortcutItemProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
                {keys.map((key, i) => (
                    <span
                        key={i}
                        className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-slate-700 border border-slate-600 rounded-md text-xs font-mono text-slate-300"
                    >
                        {key}
                    </span>
                ))}
            </div>
            <span className="text-slate-400">{description}</span>
        </div>
    );
}
