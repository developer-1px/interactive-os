import { Field } from "@os/app/export/primitives/Field.tsx";
import { OS } from "@os/features/AntigravityOS";
import { ArrowRight, Globe } from "lucide-react";
import { useState } from "react";

export function NCPHeroBlock() {
  const [values, setValues] = useState({
    headline: "AI 시대를 위한\n가장 완벽한 플랫폼",
    subtext:
      "네이버클라우드의 기술력으로 완성된\n하이퍼스케일 AI 스튜디오를 경험하세요.",
    cta: "무료로 시작하기",
    brand: "NAVER CLOUD",
  });

  return (
    <OS.Zone
      id="ncp-hero"
      className="relative h-[700px] flex flex-col justify-center overflow-hidden bg-white text-slate-900"
    >
      {/* Background: Subtle Mesh Gradient (Very Light) */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-100/50 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-green-50/50 rounded-full blur-[80px] mix-blend-multiply" />
      </div>

      {/* Grid Pattern overlay for 'constructed' feel */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="flex flex-col items-start text-left pt-20">
          <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
            <div className="w-2 h-2 rounded-full bg-[#03C75A]" />
            <span className="text-xs font-bold text-slate-600 tracking-wider">
              NEW LAUNCH
            </span>
          </div>

          <Field
            name="ncp-hero-title"
            mode="deferred"
            multiline
            value={values.headline}
            onCommit={(val: string) =>
              setValues((prev) => ({ ...prev, headline: val }))
            }
            className={`
                block text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter mb-8 -ml-1
                data-[focused=true]:bg-slate-100 data-[focused=true]:ring-2 data-[focused=true]:ring-slate-300 rounded-lg p-2
            `}
          />

          <Field
            name="ncp-hero-sub"
            mode="deferred"
            multiline
            value={values.subtext}
            onCommit={(val: string) =>
              setValues((prev) => ({ ...prev, subtext: val }))
            }
            className={`
                block text-xl lg:text-2xl text-slate-500 font-medium leading-relaxed mb-12 max-w-lg
                data-[focused=true]:bg-slate-100 data-[focused=true]:ring-2 data-[focused=true]:ring-slate-300 rounded-lg p-2 -ml-2
            `}
          />

          <OS.Item id="ncp-hero-cta">
            {({ isFocused }: { isFocused: boolean }) => (
              <button
                type="button"
                className={`
                    group inline-flex items-center gap-3 px-10 py-5 rounded-full text-lg font-bold transition-all duration-300
                    bg-slate-900 text-white shadow-xl shadow-slate-900/10
                    ${
                      isFocused
                        ? "scale-105 ring-4 ring-slate-300 bg-[#03C75A]"
                        : "hover:bg-[#03C75A] hover:shadow-green-500/30 hover:-translate-y-1"
                    }
                `}
              >
                {values.cta}
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            )}
          </OS.Item>
        </div>

        {/* Right Visual: The "Portal" */}
        <div className="relative h-[600px] hidden lg:flex items-center justify-center perspective-[1000px]">
          {/* Abstract Portal Composition */}
          <div className="relative w-[500px] h-[500px] animate-[float_6s_ease-in-out_infinite]">
            {/* Glass Card 1 */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl border border-white/50 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transform rotate-[-6deg] z-10" />

            {/* Glass Card 2 (Offset) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/80 to-white/40 backdrop-blur-md border border-white/60 rounded-[3rem] shadow-2xl transform rotate-[3deg] scale-95 z-20 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-ad71c4295843?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
              <div className="text-center p-12">
                <Globe
                  size={64}
                  className="mx-auto mb-6 text-slate-300"
                  strokeWidth={1}
                />
                <div className="text-2xl font-bold text-slate-800 mb-2">
                  Global Scale
                </div>
                <div className="text-slate-400">
                  Hyper-connected infrastructure
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#03C75A] rounded-full blur-xl opacity-20" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-500 rounded-full blur-2xl opacity-10" />
          </div>
        </div>
      </div>

      {/* Minimal Nav */}
      <OS.Zone
        id="ncp-hero-nav"
        className="absolute top-0 left-0 right-0 px-8 py-6 flex justify-between items-center z-50"
      >
        <Field
          name="ncp-hero-brand"
          mode="deferred"
          value={values.brand}
          onCommit={(val: string) =>
            setValues((prev) => ({ ...prev, brand: val }))
          }
          className={`
            font-black tracking-tighter text-lg text-slate-900
            data-[focused=true]:bg-slate-100 rounded px-2 -mx-2
          `}
        />
        <div className="flex gap-6 text-sm font-bold text-slate-600">
          <OS.Item id="nav-login">
            {({ isFocused }: { isFocused: boolean }) => (
              <button
                type="button"
                className={`hover:text-slate-900 transition-colors ${isFocused ? "underline text-slate-900" : ""}`}
              >
                로그인
              </button>
            )}
          </OS.Item>
          <OS.Item id="nav-signup">
            {({ isFocused }: { isFocused: boolean }) => (
              <button
                type="button"
                className={`px-4 py-2 rounded-full border border-slate-200 hover:border-slate-800 hover:text-slate-900 transition-all ${isFocused ? "ring-2 ring-slate-800" : ""}`}
              >
                회원가입
              </button>
            )}
          </OS.Item>
        </div>
      </OS.Zone>
    </OS.Zone>
  );
}
