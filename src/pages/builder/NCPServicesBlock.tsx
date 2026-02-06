import { useState } from "react";
import { OS } from "@os/features/AntigravityOS";
import { Field } from "@os/app/export/primitives/Field.tsx";
import { Star, Brain, Cpu, Database, Server, Box, Layers, Globe } from "lucide-react";

export function NCPServicesBlock() {
    const [title, setTitle] = useState("고객이 원하는 클라우드 환경 구축을 위한\n다양한 서비스를 제공합니다");

    // Tab Icons Mock
    const tabs = [
        { icon: Star, label: "Featured", active: true },
        { icon: Brain, label: "AI Services" },
        { icon: Cpu, label: "Compute" },
        { icon: Database, label: "Storage" },
        { icon: Server, label: "Database" },
        { icon: Box, label: "Hybrid & Private" },
        { icon: Layers, label: "Application" },
    ];

    const [featuredServices, setFeaturedServices] = useState([
        { icon: Server, title: "Server", badge: "Update", desc: "클라우드 상에서 서버를 생성하고 운영할 수 있는 서비스" },
        { icon: Database, title: "Cloud DB for Cache", badge: "Update", desc: "인메모리 캐시를 클라우드 상에서 간편하게 구축하고 안정적으로 운영하는 서비스" },
        { icon: Brain, title: "CLOVA Speech", badge: "", desc: "음성을 텍스트로 바꿔주며 긴 문장 받아쓰기, 자막 생성 등 다양한 음성 인식 서비스에 활용할 수 있습니다." },
        { icon: Layers, title: "Data Stream", badge: "Update", desc: "완전 관리형 시계열 데이터 플랫폼" },
        { icon: Globe, title: "Papago Translation", badge: "", desc: "입력된 텍스트를 파파고의 번역 엔진을 통해 번역하는 기계 번역 서비스" },
        { icon: Box, title: "CLOVA Studio", badge: "", desc: "비즈니스에 최적화된 하이퍼스케일 AI 개발 도구" },
    ]);

    return (
        <OS.Zone
            id="ncp-services"
            role="builderBlock"
            className="py-24 px-4 bg-slate-50"
        >
            <div className="max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-16">
                    {/* Field self-registers as FocusItem */}
                    <Field
                        name="ncp-service-title"
                        mode="deferred"
                        multiline
                        value={title}
                        onCommit={(val: string) => setTitle(val)}
                        className={`
                            text-3xl font-bold text-slate-900 leading-tight whitespace-pre-wrap tracking-tight
                            data-[focused=true]:bg-white data-[focused=true]:ring-2 data-[focused=true]:ring-slate-300 rounded p-2 -m-2
                        `}
                    />

                    <OS.Item id="ncp-service-all">
                        {({ isFocused }: { isFocused: boolean }) => (
                            <button className={`
                                px-6 py-3 rounded-full bg-slate-900 text-white text-sm font-bold transition-all
                                shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 hover:-translate-y-0.5
                                ${isFocused ? 'scale-105 ring-4 ring-slate-300' : 'hover:bg-slate-800'}
                            `}>
                                서비스 전체보기
                            </button>
                        )}
                    </OS.Item>
                </div>

                {/* Tabs */}
                <OS.Zone
                    id="ncp-service-tabs"
                    role="builderBlock"
                    className="flex flex-row gap-6 items-center mb-12 border-b border-slate-200 pb-8 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,transparent,black_2%,black_98%,transparent)]"
                >
                    {tabs.map((tab, i) => (
                        <OS.Item key={tab.label} id={`tab-${i}`}>
                            {({ isFocused }: { isFocused: boolean }) => (
                                <div className={`
                                    flex flex-col items-start justify-between p-5 min-w-[160px] h-[160px] rounded-3xl cursor-pointer group transition-all relative shrink-0 border
                                    ${tab.active
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/30 ring-4 ring-blue-600/10'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1'
                                    }
                                    ${isFocused ? 'scale-105 ring-4 ring-blue-500/20' : ''}
                                `}>
                                    <div className={`
                                        w-12 h-12 rounded-2xl flex items-center justify-center transition-all
                                        ${tab.active
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
                                        }
                                    `}>
                                        <tab.icon size={24} strokeWidth={2} />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <span className={`text-lg font-bold tracking-tight ${tab.active ? 'text-white' : 'text-slate-900'}`}>
                                            {tab.label}
                                        </span>
                                        <span className={`text-[11px] font-medium uppercase tracking-wider ${tab.active ? 'text-blue-200' : 'text-slate-400'}`}>
                                            Service
                                        </span>
                                    </div>

                                    {/* Active decorative blob */}
                                    {tab.active && (
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                    )}
                                </div>
                            )}
                        </OS.Item>
                    ))}
                </OS.Zone>

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                    {/* Featured Card */}
                    <OS.Zone
                        id="ncp-featured-card"
                        role="builderBlock"
                        className="lg:w-1/4 min-h-[400px] bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-3xl p-10 text-white flex flex-col justify-between overflow-hidden relative shadow-2xl shadow-blue-900/20 group"
                    >
                        {/* Dynamic Background Effects */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/30 transition-colors duration-700" />
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 group-hover:bg-cyan-400/20 transition-colors duration-700" />

                        <div className="relative z-10">
                            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/90 text-[10px] font-bold tracking-wider mb-4 border border-white/10 backdrop-blur-md">
                                RECOMMEND
                            </span>
                            <h3 className="text-3xl font-bold tracking-tight leading-tight">
                                Featured<br />Service
                            </h3>
                        </div>

                        <div className="relative z-10 h-32 w-32 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-full blur-2xl opacity-80 self-end shadow-lg shadow-cyan-500/50 animate-pulse duration-[3000ms]" />
                    </OS.Zone>

                    {/* Service List Grid */}
                    <OS.Zone
                        id="ncp-service-list"
                        role="builderBlock"
                        className="lg:w-3/4 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10"
                    >
                        <div className="col-span-2 mb-2">
                            <h4 className="text-sm font-bold text-slate-500">네이버클라우드의 주요 서비스를 사용해보세요</h4>
                        </div>

                        {featuredServices.map((service, index) => (
                            <div key={index} className="flex gap-5 group/item cursor-pointer p-4 -m-4 rounded-2xl hover:bg-slate-50 transition-all duration-300">
                                <OS.Item id={`service-icon-${index}`}>
                                    {({ isFocused }: { isFocused: boolean }) => (
                                        <div className={`
                                            w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300
                                            ${isFocused
                                                ? 'bg-slate-900 text-white ring-2 ring-slate-300 scale-110 shadow-lg'
                                                : 'bg-white text-slate-600 border-slate-100 shadow-sm group-hover/item:border-blue-200 group-hover/item:shadow-blue-100 group-hover/item:scale-110'
                                            }
                                        `}>
                                            <service.icon size={22} className="group-hover/item:text-blue-600 transition-colors" />
                                        </div>
                                    )}
                                </OS.Item>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        {/* Field self-registers */}
                                        <Field
                                            name={`service-title-${index}`}
                                            mode="deferred"
                                            value={service.title}
                                            onCommit={(val: string) => {
                                                const newServices = [...featuredServices];
                                                newServices[index].title = val;
                                                setFeaturedServices(newServices);
                                            }}
                                            className={`
                                                font-bold text-slate-900 text-lg tracking-tight
                                                data-[focused=true]:bg-slate-100 data-[focused=true]:ring-1 data-[focused=true]:ring-slate-300 rounded px-1 -mx-1
                                            `}
                                        />
                                        {service.badge && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider border border-green-200">
                                                {service.badge}
                                            </span>
                                        )}
                                    </div>
                                    <Field
                                        name={`service-desc-${index}`}
                                        mode="deferred"
                                        multiline
                                        value={service.desc}
                                        onCommit={(val: string) => {
                                            const newServices = [...featuredServices];
                                            newServices[index].desc = val;
                                            setFeaturedServices(newServices);
                                        }}
                                        className={`
                                            text-sm text-slate-500 leading-relaxed block group-hover/item:text-slate-600 transition-colors
                                            data-[focused=true]:bg-slate-100 data-[focused=true]:ring-1 data-[focused=true]:ring-slate-300 rounded px-1 -mx-1
                                        `}
                                    />
                                </div>
                            </div>
                        ))}
                    </OS.Zone>
                </div>
            </div>
        </OS.Zone>
    );
}
