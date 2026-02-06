import { useState } from "react";
import { OS } from "@os/features/AntigravityOS";
import { Field } from "@os/app/export/primitives/Field.tsx";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export function NCPNewsBlock() {
    const [title, setTitle] = useState("네이버 클라우드 플랫폼의 최신 소식을 확인하세요");

    const [cards, setCards] = useState([
        {
            id: "news-1",
            tag: "서비스 출시",
            title: "Valkey 기반\n인메모리 캐시\n데이터베이스\nCloud DB for Cache",
            link: "자세히 보기 ->",
            bg: "bg-slate-800",
            style: { background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)" }
        },
        {
            id: "news-2",
            tag: "클라우드 뉴스",
            title: "네이버클라우드\n국내 최초 유니모델 공개",
            link: "자세히 보기 ->",
            bg: "bg-pink-500",
            style: { background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #10b981 100%)" }
        },
        {
            id: "news-3",
            tag: "콘텐츠",
            title: "2026년\n스마트 제조혁신\n지원사업 준비 가이드",
            link: "자세히 보기 ->",
            bg: "bg-blue-900",
            style: { background: "radial-gradient(circle at 30% 30%, #1e3a8a 0%, #0f172a 100%)" }
        }
    ]);

    return (
        <OS.Zone
            id="ncp-news"
            role="builderBlock"
            className="py-20 px-4 bg-white"
        >
            <div className="max-w-[1200px] mx-auto">
                <div className="flex justify-between items-end mb-6">
                    {/* Field self-registers as FocusItem */}
                    <Field
                        name="ncp-news-title"
                        mode="deferred"
                        value={title}
                        onCommit={(val: string) => setTitle(val)}
                        className={`
                            text-3xl font-bold text-slate-900 tracking-tight
                            data-[focused=true]:bg-slate-100 data-[focused=true]:ring-2 data-[focused=true]:ring-slate-300 rounded px-2 -mx-2
                        `}
                    />

                    <div className="flex gap-2">
                        <OS.Item id="ncp-news-prev">
                            {({ isFocused }: { isFocused: boolean }) => (
                                <button className={`w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 ${isFocused ? 'ring-2 ring-slate-400 bg-slate-50' : 'hover:bg-slate-50'}`}>
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                        </OS.Item>
                        <OS.Item id="ncp-news-next">
                            {({ isFocused }: { isFocused: boolean }) => (
                                <button className={`w-10 h-10 rounded-full border border-slate-900 bg-slate-900 flex items-center justify-center text-white ${isFocused ? 'ring-4 ring-slate-300' : 'hover:bg-slate-800'}`}>
                                    <ChevronRight size={20} />
                                </button>
                            )}
                        </OS.Item>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {cards.map((card, index) => (
                        <OS.Zone
                            key={card.id}
                            id={`card-${card.id}`}
                            role="builderBlock"
                            className="aspect-[4/5] rounded-[2rem] p-10 flex flex-col justify-between text-white relative overflow-hidden group transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                            style={card.style}
                        >

                            <div className="relative z-10">
                                {/* Field self-registers */}
                                <Field
                                    name={`${card.id}-tag`}
                                    mode="deferred"
                                    value={card.tag}
                                    onCommit={(val: string) => {
                                        const newCards = [...cards];
                                        newCards[index].tag = val;
                                        setCards(newCards);
                                    }}
                                    className={`
                                        inline-block text-sm font-medium mb-4 opacity-80
                                        data-[focused=true]:bg-white/20 data-[focused=true]:ring-1 data-[focused=true]:ring-white/50 rounded px-2 -mx-2
                                    `}
                                />

                                <Field
                                    name={`${card.id}-title`}
                                    mode="deferred"
                                    multiline
                                    value={card.title}
                                    onCommit={(val: string) => {
                                        const newCards = [...cards];
                                        newCards[index].title = val;
                                        setCards(newCards);
                                    }}
                                    className={`
                                        block text-2xl font-bold leading-snug whitespace-pre-wrap
                                        data-[focused=true]:bg-white/20 data-[focused=true]:ring-1 data-[focused=true]:ring-white/50 rounded p-2 -m-2
                                    `}
                                />
                            </div>

                            <div className="relative z-10">
                                <OS.Item id={`${card.id}-link`}>
                                    {({ isFocused }: { isFocused: boolean }) => (
                                        <div className={`flex items-center gap-2 text-sm font-semibold ${isFocused ? 'underline decoration-2 underline-offset-4' : ''}`}>
                                            자세히 보기 <ArrowRight size={14} />
                                        </div>
                                    )}
                                </OS.Item>
                            </div>
                        </OS.Zone>
                    ))}
                </div>
            </div>
        </OS.Zone>
    );
}
