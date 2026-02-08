import { Field } from "@os/app/export/primitives/Field.tsx";
import { OS } from "@os/features/AntigravityOS";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

export function NCPNewsBlock() {
  const [title, setTitle] = useState("네이버클라우드의\n새로운 소식");

  const [cards, setCards] = useState([
    {
      id: "news-1",
      tag: "SERVICE",
      title: "Cloud DB for Cache\nRedis 호환성 강화",
      desc: "Valkey 기반의 인메모리 캐시 서비스를 이제 클라우드에서 만나보세요.",
      date: "2024.03.15",
      image:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
    },
    {
      id: "news-2",
      tag: "PRESS",
      title: "하이퍼클로바X\n기업용 솔루션 공개",
      desc: "업무 생산성을 혁신하는 AI 도구.",
      date: "2024.03.10",
      image: null,
    },
    {
      id: "news-3",
      tag: "EVENT",
      title: "AI RUSH 2024\n개발자 컨퍼런스",
      desc: "지금 바로 등록하세요.",
      date: "2024.03.01",
      image: null,
    },
  ]);

  return (
    <OS.Zone
      id="ncp-news"
      className="py-24 px-6 bg-white border-t border-slate-100"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 border-b border-slate-100 pb-8">
          <div>
            <span className="text-slate-500 font-bold tracking-widest text-xs uppercase mb-4 block">
              Updates
            </span>
            <Field
              name="ncp-news-title"
              mode="deferred"
              multiline
              value={title}
              onCommit={(val: string) => setTitle(val)}
              className={`
                 text-4xl md:text-5xl font-bold text-slate-900 leading-tight tracking-tight
                 data-[focused=true]:bg-slate-50 rounded-lg p-2 -m-2
              `}
            />
          </div>
          <OS.Item id="ncp-news-all">
            {({ isFocused }: { isFocused: boolean }) => (
              <button
                className={`
                        text-sm font-bold border-b border-slate-300 pb-1 hover:border-slate-900 transition-colors
                        ${isFocused ? "border-slate-900 scale-105 origin-right ring-2 ring-slate-100 rounded px-2" : "text-slate-500 hover:text-slate-900"}
                    `}
              >
                전체 뉴스 보기
              </button>
            )}
          </OS.Item>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
          {/* Main Feature Card (Large, Image based) */}
          <OS.Zone
            key={cards[0].id}
            id={`card-${cards[0].id}`}
            className="md:col-span-2 md:row-span-2 relative rounded-3xl overflow-hidden group bg-slate-50"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${cards[0].image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />

            <div className="absolute bottom-0 left-0 p-10 text-white w-full">
              <div className="flex justify-between items-end">
                <div>
                  <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded border border-white/20 text-xs font-bold tracking-wider mb-4">
                    {cards[0].tag}
                  </span>
                  <Field
                    name={`${cards[0].id}-title`}
                    mode="deferred"
                    multiline
                    value={cards[0].title}
                    onCommit={(val) => {
                      const newCards = [...cards];
                      newCards[0].title = val;
                      setCards(newCards);
                    }}
                    className="text-3xl md:text-4xl font-bold leading-tight mb-4 block text-white"
                  />
                  <p className="text-white/80 max-w-lg leading-relaxed mb-6">
                    {cards[0].desc}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <ArrowRight />
                </div>
              </div>
            </div>
          </OS.Zone>

          {/* Secondary Card 1 (Top Right) */}
          <OS.Zone
            key={cards[1].id}
            id={`card-${cards[1].id}`}
            className="md:col-span-1 md:row-span-1 bg-slate-50 rounded-3xl p-8 flex flex-col justify-between group border border-slate-100 hover:border-slate-300 hover:shadow-lg transition-all duration-300"
          >
            <div>
              <span className="text-xs font-bold text-slate-400 tracking-wider mb-2 block">
                {cards[1].tag}
              </span>
              <Field
                name={`${cards[1].id}-title`}
                mode="deferred"
                multiline
                value={cards[1].title}
                onCommit={(val) => {
                  const newCards = [...cards];
                  newCards[1].title = val;
                  setCards(newCards);
                }}
                className="text-xl font-bold text-slate-900 leading-snug mb-3 block"
              />
            </div>
            <div className="flex justify-between items-end border-t border-slate-200 pt-6 mt-4">
              <span className="text-sm text-slate-400">{cards[1].date}</span>
              <ArrowRight
                size={18}
                className="text-slate-300 group-hover:text-slate-900 transition-colors"
              />
            </div>
          </OS.Zone>

          {/* Secondary Card 2 (Bottom Right) */}
          <OS.Zone
            key={cards[2].id}
            id={`card-${cards[2].id}`}
            className="md:col-span-1 md:row-span-1 bg-white rounded-3xl p-8 flex flex-col justify-between group border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300 relative overflow-hidden"
          >
            {/* Decorative blob for variety */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <span className="text-xs font-bold text-blue-600 tracking-wider mb-2 block">
                {cards[2].tag}
              </span>
              <Field
                name={`${cards[2].id}-title`}
                mode="deferred"
                multiline
                value={cards[2].title}
                onCommit={(val) => {
                  const newCards = [...cards];
                  newCards[2].title = val;
                  setCards(newCards);
                }}
                className="text-xl font-bold text-slate-900 leading-snug mb-3 block"
              />
            </div>
            <div className="relative z-10 flex justify-between items-end">
              <span className="text-sm text-slate-400">{cards[2].date}</span>
              <ArrowRight
                size={18}
                className="text-slate-300 group-hover:text-blue-600 transition-colors"
              />
            </div>
          </OS.Zone>
        </div>
      </div>
    </OS.Zone>
  );
}
