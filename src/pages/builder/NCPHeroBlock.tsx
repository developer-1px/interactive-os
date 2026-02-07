import { Field } from "@os/app/export/primitives/Field.tsx";
import { OS } from "@os/features/AntigravityOS";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

export function NCPHeroBlock() {
  const [values, setValues] = useState({
    headline: "네이버웍스 AI스튜디오 출시",
    subtext: "우리 회사를 가장 잘 이해하는, 일 잘하는 AI 영입하세요.",
    cta: "30일 무료체험",
    brand: "NAVER CLOUD PLATFORM",
    login: "로그인",
    signup: "회원가입",
    languages: "Languages ▾",
  });

  return (
    <OS.Zone
      id="ncp-hero"
      role="builderBlock"
      className="relative h-[600px] flex flex-col items-center justify-center text-center overflow-hidden bg-[#8e9eab]"
      style={{
        background: `radial-gradient(circle at 80% 50%, #03c75a 0%, #3a4b5a 40%, #525f6b 100%)`,
      }}
    >
      {/* Abstract 3D shape placeholders - CSS approximation */}
      <div className="absolute right-[10%] top-[30%] w-64 h-64 bg-green-500 rounded-full blur-3xl opacity-20 mix-blend-overlay animate-pulse" />
      <div className="absolute left-[20%] bottom-[20%] w-96 h-96 bg-gray-500 rounded-full blur-3xl opacity-30 mix-blend-overlay" />

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        {/* Field is a self-registering FocusItem - no need for OS.Item wrapper */}
        <Field
          name="ncp-hero-title"
          mode="deferred"
          value={values.headline}
          onCommit={(val: string) =>
            setValues((prev) => ({ ...prev, headline: val }))
          }
          className={`
                        block text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight drop-shadow-sm rounded-lg px-4 -mx-4
                        data-[focused=true]:bg-white/10 data-[focused=true]:ring-2 data-[focused=true]:ring-white/50
                        data-[selected=true]:bg-green-500/20 data-[selected=true]:ring-2 data-[selected=true]:ring-green-400
                    `}
        />

        <Field
          name="ncp-hero-sub"
          mode="deferred"
          value={values.subtext}
          onCommit={(val: string) =>
            setValues((prev) => ({ ...prev, subtext: val }))
          }
          className={`
                        block text-xl md:text-2xl text-white/90 mb-10 font-medium tracking-wide drop-shadow-sm rounded-lg px-4 -mx-4
                        data-[focused=true]:bg-white/10 data-[focused=true]:ring-2 data-[focused=true]:ring-white/50
                        data-[selected=true]:bg-green-500/20 data-[selected=true]:ring-2 data-[selected=true]:ring-green-400
                    `}
        />

        <OS.Item id="ncp-hero-cta">
          {({ isFocused }: { isFocused: boolean }) => (
            <button
              className={`
                                inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-slate-900 font-bold text-lg transition-all duration-300
                                ${
                                  isFocused
                                    ? "scale-110 shadow-[0_0_30px_rgba(255,255,255,0.4)] ring-4 ring-white/30"
                                    : "hover:scale-105 hover:shadow-lg"
                                }
                            `}
            >
              {values.cta}
              <ChevronRight size={18} className="opacity-60" />
            </button>
          )}
        </OS.Item>
      </div>

      {/* Top Bar - All editable Fields */}
      <OS.Zone
        id="ncp-hero-nav"
        role="builderBlock"
        className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center text-xs text-white/60 font-medium z-20"
      >
        <Field
          name="ncp-hero-brand"
          mode="deferred"
          value={values.brand}
          onCommit={(val: string) =>
            setValues((prev) => ({ ...prev, brand: val }))
          }
          className={`
            text-xs text-white/60 font-medium
            data-[focused=true]:bg-white/20 data-[focused=true]:text-white data-[focused=true]:ring-1 data-[focused=true]:ring-white/40 rounded px-2 -mx-2
          `}
        />
        <div className="flex gap-4">
          <Field
            name="ncp-hero-login"
            mode="deferred"
            value={values.login}
            onCommit={(val: string) =>
              setValues((prev) => ({ ...prev, login: val }))
            }
            className={`
              text-xs text-white/60 font-medium
              data-[focused=true]:bg-white/20 data-[focused=true]:text-white data-[focused=true]:ring-1 data-[focused=true]:ring-white/40 rounded px-2 -mx-2
            `}
          />
          <Field
            name="ncp-hero-signup"
            mode="deferred"
            value={values.signup}
            onCommit={(val: string) =>
              setValues((prev) => ({ ...prev, signup: val }))
            }
            className={`
              text-xs text-white/60 font-medium
              data-[focused=true]:bg-white/20 data-[focused=true]:text-white data-[focused=true]:ring-1 data-[focused=true]:ring-white/40 rounded px-2 -mx-2
            `}
          />
          <Field
            name="ncp-hero-languages"
            mode="deferred"
            value={values.languages}
            onCommit={(val: string) =>
              setValues((prev) => ({ ...prev, languages: val }))
            }
            className={`
              text-xs text-white/60 font-medium
              data-[focused=true]:bg-white/20 data-[focused=true]:text-white data-[focused=true]:ring-1 data-[focused=true]:ring-white/40 rounded px-2 -mx-2
            `}
          />
        </div>
      </OS.Zone>
    </OS.Zone>
  );
}
