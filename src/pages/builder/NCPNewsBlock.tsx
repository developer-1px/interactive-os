import { Field } from "@os/6-components/primitives/Field.tsx";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Builder } from "@/apps/builder/primitives/Builder";

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

  const card0 = cards[0]!;
  const card1 = cards[1]!;
  const card2 = cards[2]!;

  return (
    <Builder.Section asChild id="ncp-news">
      <div className="py-24 px-6 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 border-b border-slate-100 pb-8">
            <div>
              <Builder.Badge
                id="ncp-news-label"
                variant="default"
                className="text-slate-500 font-bold tracking-widest text-xs uppercase mb-4 block"
              >
                Updates
              </Builder.Badge>
              <Builder.Item asChild id="ncp-news-title">
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
              </Builder.Item>
            </div>
            <Builder.Item asChild id="ncp-news-all">
              <Builder.Link
                id="ncp-news-all-link"
                href="#"
                className={`
                  text-sm font-bold border-b border-slate-300 pb-1 hover:border-slate-900 transition-colors text-slate-500 hover:text-slate-900
                  data-[focused=true]:border-slate-900 data-[focused=true]:scale-105 data-[focused=true]:origin-right data-[focused=true]:ring-2 data-[focused=true]:ring-slate-100 data-[focused=true]:rounded data-[focused=true]:px-2
                `}
              >
                전체 뉴스 보기
              </Builder.Link>
            </Builder.Item>
          </div>

          {/* Bento Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
            {/* Main Feature Card (Large, Image based) */}
            <Builder.Group asChild id={`card-${card0.id}`}>
              <div className="md:col-span-2 md:row-span-2 relative rounded-3xl overflow-hidden group bg-slate-50 data-[focused=true]:ring-4 data-[focused=true]:ring-blue-500">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${card0.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />

                <div className="absolute bottom-0 left-0 p-10 text-white w-full">
                  <div className="flex justify-between items-end">
                    <div>
                      <Builder.Item asChild id={`${card0.id}-tag`}>
                        <Builder.Badge
                          id={`${card0.id}-tag-badge`}
                          variant="default"
                          className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded border border-white/20 text-xs font-bold tracking-wider mb-4 data-[focused=true]:ring-2 data-[focused=true]:ring-white/50"
                        >
                          {card0.tag}
                        </Builder.Badge>
                      </Builder.Item>
                      <Builder.Item asChild id={`${card0.id}-title`}>
                        <Field
                          name={`${card0.id}-title`}
                          mode="deferred"
                          multiline
                          value={card0.title}
                          onCommit={(val) => {
                            const newCards = [...cards];
                            newCards[0]!.title = val;
                            setCards(newCards);
                          }}
                          className="text-3xl md:text-4xl font-bold leading-tight mb-4 block text-white"
                        />
                      </Builder.Item>
                      <Builder.Item asChild id={`${card0.id}-desc`}>
                        <Field
                          name={`${card0.id}-desc`}
                          mode="deferred"
                          value={card0.desc}
                          onCommit={(val: string) => {
                            const newCards = [...cards];
                            newCards[0]!.desc = val;
                            setCards(newCards);
                          }}
                          className="text-white/80 max-w-lg leading-relaxed mb-6 block"
                        />
                      </Builder.Item>
                    </div>
                    <Builder.Item asChild id={`${card0.id}-link`}>
                      <Builder.Icon
                        id={`${card0.id}-link-icon`}
                        icon={ArrowRight}
                        size={24}
                        className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 data-[focused=true]:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 data-[focused=true]:ring-2 data-[focused=true]:ring-blue-400"
                      />
                    </Builder.Item>
                  </div>
                </div>
              </div>
            </Builder.Group>

            {/* Secondary Card 1 (Top Right) */}
            <Builder.Group asChild id={`card-${card1.id}`}>
              <div className="md:col-span-1 md:row-span-1 bg-slate-50 rounded-3xl p-8 flex flex-col justify-between group border border-slate-100 hover:border-slate-300 hover:shadow-lg transition-all duration-300 data-[focused=true]:ring-4 data-[focused=true]:ring-blue-500">
                <div>
                  <Builder.Item asChild id={`${card1.id}-tag`}>
                    <Builder.Badge
                      id={`${card1.id}-tag-badge`}
                      variant="default"
                      className="text-xs font-bold text-slate-400 tracking-wider mb-2 block data-[focused=true]:ring-2 data-[focused=true]:ring-slate-300 data-[focused=true]:rounded"
                    >
                      {card1.tag}
                    </Builder.Badge>
                  </Builder.Item>
                  <Builder.Item asChild id={`${card1.id}-title`}>
                    <Field
                      name={`${card1.id}-title`}
                      mode="deferred"
                      multiline
                      value={card1.title}
                      onCommit={(val) => {
                        const newCards = [...cards];
                        newCards[1]!.title = val;
                        setCards(newCards);
                      }}
                      className="text-xl font-bold text-slate-900 leading-snug mb-3 block"
                    />
                  </Builder.Item>
                </div>
                <div className="flex justify-between items-end border-t border-slate-200 pt-6 mt-4">
                  <Builder.Item asChild id={`${card1.id}-date`}>
                    <Field
                      name={`${card1.id}-date`}
                      mode="deferred"
                      value={card1.date}
                      onCommit={(val: string) => {
                        const newCards = [...cards];
                        newCards[1]!.date = val;
                        setCards(newCards);
                      }}
                      className="text-sm text-slate-400"
                    />
                  </Builder.Item>
                  <Builder.Item asChild id={`${card1.id}-link`}>
                    <Builder.Icon
                      id={`${card1.id}-link-icon`}
                      icon={ArrowRight}
                      size={18}
                      iconClassName="text-slate-300 group-hover:text-slate-900 transition-colors"
                      className="data-[focused=true]:ring-2 data-[focused=true]:ring-slate-300 data-[focused=true]:rounded"
                    />
                  </Builder.Item>
                </div>
              </div>
            </Builder.Group>

            {/* Secondary Card 2 (Bottom Right) */}
            <Builder.Group asChild id={`card-${card2.id}`}>
              <div className="md:col-span-1 md:row-span-1 bg-white rounded-3xl p-8 flex flex-col justify-between group border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300 relative overflow-hidden data-[focused=true]:ring-4 data-[focused=true]:ring-blue-500">
                {/* Decorative blob for variety */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10">
                  <Builder.Item asChild id={`${card2.id}-tag`}>
                    <Builder.Badge
                      id={`${card2.id}-tag-badge`}
                      variant="info"
                      className="text-xs font-bold text-blue-600 tracking-wider mb-2 block data-[focused=true]:ring-2 data-[focused=true]:ring-blue-300 data-[focused=true]:rounded"
                    >
                      {card2.tag}
                    </Builder.Badge>
                  </Builder.Item>
                  <Builder.Item asChild id={`${card2.id}-title`}>
                    <Field
                      name={`${card2.id}-title`}
                      mode="deferred"
                      multiline
                      value={card2.title}
                      onCommit={(val) => {
                        const newCards = [...cards];
                        newCards[2]!.title = val;
                        setCards(newCards);
                      }}
                      className="text-xl font-bold text-slate-900 leading-snug mb-3 block"
                    />
                  </Builder.Item>
                </div>
                <div className="relative z-10 flex justify-between items-end">
                  <Builder.Item asChild id={`${card2.id}-date`}>
                    <Field
                      name={`${card2.id}-date`}
                      mode="deferred"
                      value={card2.date}
                      onCommit={(val: string) => {
                        const newCards = [...cards];
                        newCards[2]!.date = val;
                        setCards(newCards);
                      }}
                      className="text-sm text-slate-400"
                    />
                  </Builder.Item>
                  <Builder.Item asChild id={`${card2.id}-link`}>
                    <Builder.Icon
                      id={`${card2.id}-link-icon`}
                      icon={ArrowRight}
                      size={18}
                      iconClassName="text-slate-300 group-hover:text-blue-600 transition-colors"
                      className="data-[focused=true]:ring-2 data-[focused=true]:ring-blue-300 data-[focused=true]:rounded"
                    />
                  </Builder.Item>
                </div>
              </div>
            </Builder.Group>
          </div>
        </div>
      </div>
    </Builder.Section>
  );
}
