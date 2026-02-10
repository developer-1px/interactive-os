import { Builder } from "@os/app/export/primitives/Builder.tsx";
import { Field } from "@os/app/export/primitives/Field.tsx";
import {
  ArrowRight,
  Box,
  Brain,
  Cpu,
  Database,
  Globe,
  Layers,
  Server,
  Star,
} from "lucide-react";
import { useState } from "react";

export function NCPServicesBlock() {
  const [title, setTitle] = useState("비즈니스에 최적화된\n클라우드 서비스");

  const [tabs] = useState([
    { icon: Star, label: "Featured", active: true },
    { icon: Brain, label: "AI Services" },
    { icon: Cpu, label: "Compute" },
    { icon: Database, label: "Storage" },
    { icon: Server, label: "Database" },
    { icon: Box, label: "Hybrid" },
    { icon: Layers, label: "Network" },
  ]);

  const [featuredServices, setFeaturedServices] = useState([
    {
      icon: Server,
      color: "text-blue-600 bg-blue-50",
      title: "Server",
      badge: "UPDATED",
      desc: "고성능 클라우드 서버 인프라를 \n몇 번의 클릭으로 구축하세요.",
    },
    {
      icon: Database,
      color: "text-purple-600 bg-purple-50",
      title: "Cloud DB for Cache",
      badge: "NEW",
      desc: "Valkey 기반의 완전 관리형 \n인메모리 캐시 서비스.",
    },
    {
      icon: Brain,
      color: "text-green-600 bg-green-50",
      title: "CLOVA Speech",
      badge: "",
      desc: "비즈니스 환경에 특화된 \n최고 수준의 음성 인식 기술.",
    },
    {
      icon: Layers,
      color: "text-orange-600 bg-orange-50",
      title: "Data Stream",
      badge: "",
      desc: "대용량 데이터의 실시간 수집과 \n처리를 위한 파이프라인.",
    },
    {
      icon: Globe,
      color: "text-cyan-600 bg-cyan-50",
      title: "Global CDN",
      badge: "",
      desc: "전 세계 사용자에게 빠르고 \n안정적인 콘텐츠 전송.",
    },
    {
      icon: Box,
      color: "text-indigo-600 bg-indigo-50",
      title: "Kubernetes",
      badge: "",
      desc: "컨테이너화된 애플리케이션의 \n자동화된 배포 및 관리.",
    },
  ]);

  return (
    <Builder.Section asChild id="ncp-services">
      <div className="py-24 px-6 bg-[#F8F9FA] border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-end mb-12 gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <Builder.Item asChild id="ncp-service-category">
                  <Field
                    name="ncp-service-category"
                    mode="deferred"
                    value="Service Category"
                    className="text-blue-600 font-bold text-xs tracking-widest uppercase"
                  />
                </Builder.Item>
              </div>
              <Builder.Item asChild id="ncp-service-title">
                <Field
                  name="ncp-service-title"
                  mode="deferred"
                  multiline
                  value={title}
                  onCommit={(val: string) => setTitle(val)}
                  className={`
                    text-3xl md:text-4xl font-bold text-slate-900 leading-tight tracking-tight
                    data-[focused=true]:bg-white rounded-lg p-2 -m-2
                  `}
                />
              </Builder.Item>
            </div>

            {/* Segmented Control Tabs */}
            <div className="flex items-center bg-slate-200/50 p-1.5 rounded-xl overflow-x-auto max-w-full">
              {tabs.map((tab, i) => (
                <Builder.Item asChild key={tab.label} id={`tab-${i}`}>
                  <Builder.Button
                    id={`tab-btn-${i}`}
                    variant={tab.active ? "primary" : "ghost"}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                      ${
                        tab.active
                          ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                      }
                      data-[focused=true]:bg-white data-[focused=true]:ring-2 data-[focused=true]:ring-slate-300 data-[focused=true]:z-10
                    `}
                  >
                    <tab.icon
                      size={16}
                      className={tab.active ? "text-blue-600" : ""}
                    />
                    {tab.label}
                  </Builder.Button>
                </Builder.Item>
              ))}
            </div>
          </div>

          {/* Service Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredServices.map((service, index) => (
              <Builder.Group
                asChild
                key={service.title}
                id={`service-card-${index}`}
              >
                <div className="group bg-white rounded-2xl p-8 border border-slate-200 transition-all duration-300 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 cursor-pointer data-[focused=true]:ring-4 data-[focused=true]:ring-blue-500 data-[focused=true]:border-blue-500">
                  <div className="flex justify-between items-start mb-6">
                    <Builder.Item asChild id={`service-icon-${index}`}>
                      <Builder.Icon
                        id={`service-icon-inner-${index}`}
                        icon={service.icon}
                        size={24}
                        strokeWidth={2}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${service.color} data-[focused=true]:ring-2 data-[focused=true]:ring-slate-400`}
                      />
                    </Builder.Item>
                    {service.badge && (
                      <Builder.Item asChild id={`service-badge-${index}`}>
                        <Builder.Badge
                          id={`service-badge-inner-${index}`}
                          variant="default"
                          className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider data-[focused=true]:ring-2 data-[focused=true]:ring-slate-400"
                        >
                          {service.badge}
                        </Builder.Badge>
                      </Builder.Item>
                    )}
                  </div>

                  <Builder.Item asChild id={`service-title-${index}`}>
                    <Field
                      name={`service-title-${index}`}
                      mode="deferred"
                      value={service.title}
                      onCommit={(val: string) => {
                        const newServices = [...featuredServices];
                        newServices[index].title = val;
                        setFeaturedServices(newServices);
                      }}
                      className={`text-lg font-bold text-slate-900 mb-2 block`}
                    />
                  </Builder.Item>

                  <Builder.Item asChild id={`service-desc-${index}`}>
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
                      className={`text-sm text-slate-500 leading-relaxed block min-h-[40px]`}
                    />
                  </Builder.Item>

                  <Builder.Item asChild id={`service-details-${index}`}>
                    <Builder.Link
                      id={`service-details-link-${index}`}
                      href="#"
                      className="mt-6 flex items-center text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 data-[focused=true]:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 data-[focused=true]:translate-x-0 duration-300 data-[focused=true]:ring-2 data-[focused=true]:ring-blue-300 data-[focused=true]:rounded"
                    >
                      <span>Details</span>
                      <ArrowRight size={16} className="ml-1" />
                    </Builder.Link>
                  </Builder.Item>
                </div>
              </Builder.Group>
            ))}

            {/* "View All" Card */}
            <Builder.Group asChild id="service-view-all">
              <div className="rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer group data-[focused=true]:ring-2 data-[focused=true]:ring-slate-400 data-[focused=true]:border-slate-400">
                <Builder.Icon
                  id="service-view-all-icon"
                  icon={ArrowRight}
                  size={24}
                  className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 group-hover:bg-slate-200 group-hover:text-slate-600 py-10 transition-colors"
                />
                <span className="text-slate-500 font-bold text-sm">
                  서비스 전체보기
                </span>
              </div>
            </Builder.Group>
          </div>
        </div>
      </div>
    </Builder.Section>
  );
}
