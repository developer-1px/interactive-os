import { Field } from "@os/6-components/field/Field";
import { ArrowRight, Globe } from "lucide-react";
import { createFieldCommit, useSectionFields } from "@/apps/builder/app";
import { Builder } from "@/apps/builder/primitives/Builder";

export function NCPHeroBlock({ id }: { id: string }) {
  const fid = (local: string) => `${id}-${local}`;
  const fields = useSectionFields(id);

  return (
    <Builder.Section asChild id={id}>
      <div className="relative h-[700px] flex flex-col justify-center overflow-hidden bg-white text-slate-900">
        {/* Background: Subtle Mesh Gradient (Very Light) */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-100/50 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-green-50/50 rounded-full blur-[80px] mix-blend-multiply" />
        </div>

        {/* Grid Pattern overlay */}
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
            <Builder.Group asChild id={fid("new-badge-container")}>
              <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 bg-slate-100 rounded-full border border-slate-200 data-[focused=true]:ring-2 data-[focused=true]:ring-slate-400">
                <div className="w-2 h-2 rounded-full bg-[#03C75A]" />
                <Builder.Item asChild id={fid("new-badge")}>
                  <Builder.Badge
                    id={fid("new-badge-inner")}
                    variant="success"
                    className="text-xs font-bold text-slate-600 tracking-wider"
                  >
                    NEW LAUNCH
                  </Builder.Badge>
                </Builder.Item>
              </div>
            </Builder.Group>

            <Builder.Item asChild id={fid("title")}>
              <Field.Editable
                name={fid("title")}
                mode="deferred"
                multiline
                value={fields["title"] ?? ""}
                onCommit={createFieldCommit(id, "title")}
                className={`
                    block text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter mb-8 -ml-1
                    data-[focused=true]:bg-slate-100 data-[focused=true]:ring-2 data-[focused=true]:ring-slate-300 rounded-lg p-2
                `}
              />
            </Builder.Item>

            <Builder.Item asChild id={fid("sub")}>
              <Field.Editable
                name={fid("sub")}
                mode="deferred"
                multiline
                value={fields["sub"] ?? ""}
                onCommit={createFieldCommit(id, "sub")}
                className={`
                    block text-xl lg:text-2xl text-slate-500 font-medium leading-relaxed mb-12 max-w-lg
                    data-[focused=true]:bg-slate-100 data-[focused=true]:ring-2 data-[focused=true]:ring-slate-300 rounded-lg p-2 -ml-2
                `}
              />
            </Builder.Item>

            <Builder.Item asChild id={fid("cta")}>
              <Builder.Button
                id={fid("cta-btn")}
                variant="primary"
                className={`
                    group inline-flex items-center gap-3 px-10 py-5 rounded-full text-lg font-bold transition-all duration-300
                    bg-slate-900 text-white shadow-xl shadow-slate-900/10
                    data-[focused=true]:scale-105 data-[focused=true]:ring-4 data-[focused=true]:ring-slate-300 data-[focused=true]:bg-[#03C75A]
                    hover:bg-[#03C75A] hover:shadow-green-500/30 hover:-translate-y-1
                `}
              >
                {fields["cta"] || "무료로 시작하기"}
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Builder.Button>
            </Builder.Item>
          </div>

          {/* Right Visual: The "Portal" */}
          <div className="relative h-[600px] hidden lg:flex items-center justify-center perspective-[1000px]">
            <div className="relative w-[500px] h-[500px] animate-[float_6s_ease-in-out_infinite]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl border border-white/50 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transform rotate-[-6deg] z-10" />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/80 to-white/40 backdrop-blur-md border border-white/60 rounded-[3rem] shadow-2xl transform rotate-[3deg] scale-95 z-20 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-ad71c4295843?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
                <div className="text-center p-12">
                  <Builder.Item asChild id={fid("portal-icon")}>
                    <Builder.Icon
                      id={fid("portal-icon-inner")}
                      icon={Globe}
                      size={64}
                      iconClassName="text-slate-300"
                      strokeWidth={1}
                      className="mx-auto mb-6 data-[focused=true]:ring-2 data-[focused=true]:ring-slate-400 data-[focused=true]:rounded w-fit"
                    />
                  </Builder.Item>
                  <Builder.Item asChild id={fid("portal-title")}>
                    <Field.Editable
                      name={fid("portal-title")}
                      mode="deferred"
                      value={fields["portal-title"] ?? ""}
                      onCommit={createFieldCommit(id, "portal-title")}
                      as="div"
                      multiline
                      className="text-2xl font-bold text-slate-800 mb-2 block"
                    />
                  </Builder.Item>
                  <Builder.Item asChild id={fid("portal-subtitle")}>
                    <Field.Editable
                      name={fid("portal-subtitle")}
                      mode="deferred"
                      value={fields["portal-subtitle"] ?? ""}
                      onCommit={createFieldCommit(id, "portal-subtitle")}
                      as="div"
                      multiline
                      className="text-slate-400 block"
                    />
                  </Builder.Item>
                </div>
              </div>
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#03C75A] rounded-full blur-xl opacity-20" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-500 rounded-full blur-2xl opacity-10" />
            </div>
          </div>
        </div>

        {/* Minimal Nav */}
        <div className="absolute top-0 left-0 right-0 px-8 py-6 flex justify-between items-center z-50">
          <Builder.Item asChild id={fid("brand")}>
            <Field.Editable
              name={fid("brand")}
              mode="deferred"
              value={fields["brand"] ?? ""}
              onCommit={createFieldCommit(id, "brand")}
              className={`
                font-black tracking-tighter text-lg text-slate-900
                data-[focused=true]:bg-slate-100 rounded px-2 -mx-2
              `}
            />
          </Builder.Item>
          <div className="flex gap-6 text-sm font-bold text-slate-600">
            <Builder.Item asChild id={fid("nav-login")}>
              <Builder.Button
                id={fid("nav-login-btn")}
                variant="ghost"
                className="hover:text-slate-900 transition-colors data-[focused=true]:underline data-[focused=true]:text-slate-900"
              >
                {fields["nav-login"] || "로그인"}
              </Builder.Button>
            </Builder.Item>
            <Builder.Item asChild id={fid("nav-signup")}>
              <Builder.Button
                id={fid("nav-signup-btn")}
                variant="outline"
                className="px-4 py-2 rounded-full border border-slate-200 hover:border-slate-800 hover:text-slate-900 transition-all data-[focused=true]:ring-2 data-[focused=true]:ring-slate-800"
              >
                {fields["nav-signup"] || "회원가입"}
              </Builder.Button>
            </Builder.Item>
          </div>
        </div>
      </div>
    </Builder.Section>
  );
}
