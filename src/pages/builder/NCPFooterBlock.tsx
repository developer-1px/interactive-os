import { Field } from "@os/6-components/field/Field";
import {
  Github,
  Globe,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
} from "lucide-react";
import { createFieldCommit, useSectionFields } from "@/apps/builder/app";
import { Builder } from "@/apps/builder/primitives/Builder";

export function NCPFooterBlock({ id }: { id: string }) {
  const fid = (local: string) => `${id}-${local}`;
  const fields = useSectionFields(id);

  const columns = [
    {
      title: "Products",
      links: [
        { label: "Compute", href: "#" },
        { label: "Storage", href: "#" },
        { label: "Database", href: "#" },
        { label: "AI & Data", href: "#" },
        { label: "Media", href: "#" },
      ],
    },
    {
      title: "Solutions",
      links: [
        { label: "Financial", href: "#" },
        { label: "Public", href: "#" },
        { label: "Medical", href: "#" },
        { label: "Game", href: "#" },
        { label: "Education", href: "#" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Documentation", href: "#" },
        { label: "API Reference", href: "#" },
        { label: "Community", href: "#" },
        { label: "Contact Sales", href: "#" },
        { label: "Status", href: "#" },
      ],
    },
  ];

  const socials = [
    { icon: Youtube, label: "Youtube", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
    { icon: Github, label: "GitHub", href: "#" },
    { icon: Twitter, label: "Twitter", href: "#" },
    { icon: Instagram, label: "Instagram", href: "#" },
  ];

  const bottomLinks = [
    "개인정보처리방침",
    "이용약관",
    "서비스 수준 협약 (SLA)",
    "청소년보호정책",
  ];

  return (
    <Builder.Section asChild id={id}>
      <footer className="bg-slate-900 py-16 px-6 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <Builder.Item asChild id={fid("brand")}>
                <Field.Editable
                  name={fid("brand")}
                  mode="deferred"
                  value={fields["brand"] ?? ""}
                  onCommit={createFieldCommit(id, "brand")}
                  className="font-black text-2xl tracking-tighter text-white mb-6 block w-fit data-[focused=true]:bg-slate-800 data-[focused=true]:ring-2 data-[focused=true]:ring-slate-600 rounded px-2 -mx-2"
                />
              </Builder.Item>
              <Builder.Item asChild id={fid("desc")}>
                <Field.Editable
                  name={fid("desc")}
                  mode="deferred"
                  fieldType="block"
                  value={fields["desc"] ?? ""}
                  onCommit={createFieldCommit(id, "desc")}
                  className="text-slate-500 text-sm leading-relaxed max-w-sm mb-6 block data-[focused=true]:bg-slate-800 rounded p-2 -ml-2"
                />
              </Builder.Item>
              <Builder.Group asChild id={fid("lang")}>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800/50 border border-slate-700 data-[focused=true]:ring-2 data-[focused=true]:ring-slate-500">
                  <Globe size={16} className="text-slate-400" />
                  <Builder.Item asChild id={fid("lang-select")}>
                    <span className="text-xs font-bold text-slate-300">
                      한국어 (Korean)
                    </span>
                  </Builder.Item>
                </div>
              </Builder.Group>
            </div>

            {/* Links Columns */}
            {columns.map((col, colIndex) => (
              <Builder.Group
                asChild
                key={col.title}
                id={fid(`col-${colIndex}`)}
              >
                <div className="lg:col-span-1">
                  <Builder.Item asChild id={fid(`col-${colIndex}-title`)}>
                    <h3 className="font-bold text-white text-sm tracking-wider uppercase mb-6 data-[focused=true]:bg-slate-800 rounded px-1 w-fit">
                      {col.title}
                    </h3>
                  </Builder.Item>
                  <ul className="space-y-3">
                    {col.links.map((link, linkIndex) => (
                      <li key={link.label}>
                        <Builder.Item
                          asChild
                          id={fid(`link-${colIndex}-${linkIndex}`)}
                        >
                          <Builder.Link
                            id={fid(`link-inner-${colIndex}-${linkIndex}`)}
                            href={link.href}
                            className="text-sm font-medium hover:text-[#03C75A] transition-colors inline-block data-[focused=true]:text-[#03C75A] data-[focused=true]:translate-x-1 duration-200"
                          >
                            {link.label}
                          </Builder.Link>
                        </Builder.Item>
                      </li>
                    ))}
                  </ul>
                </div>
              </Builder.Group>
            ))}

            <div className="lg:col-span-1">
              <Builder.Item asChild id={fid("social-title")}>
                <h3 className="font-bold text-white text-sm tracking-wider uppercase mb-6 data-[focused=true]:bg-slate-800 rounded px-1 w-fit">
                  Follow Us
                </h3>
              </Builder.Item>
              <div className="flex flex-wrap gap-3">
                {socials.map((social, i) => (
                  <Builder.Item
                    asChild
                    key={social.label}
                    id={fid(`social-${i}`)}
                  >
                    <Builder.Link
                      id={fid(`social-btn-${i}`)}
                      href={social.href}
                      className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#03C75A] hover:text-white transition-all data-[focused=true]:ring-2 data-[focused=true]:ring-slate-500"
                    >
                      <social.icon size={18} />
                    </Builder.Link>
                  </Builder.Item>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-wrap gap-6 justify-center md:justify-start">
              {bottomLinks.map((text, i) => (
                <Builder.Item asChild key={text} id={fid(`bottom-link-${i}`)}>
                  <Builder.Link
                    id={fid(`bottom-link-inner-${i}`)}
                    href="#"
                    className={`text-xs font-bold ${i === 0 ? "text-slate-300" : "text-slate-500"} hover:text-white transition-colors data-[focused=true]:ring-1 data-[focused=true]:ring-slate-600 rounded px-1`}
                  >
                    {text}
                  </Builder.Link>
                </Builder.Item>
              ))}
            </div>
            <Builder.Item asChild id={fid("copyright")}>
              <Field.Editable
                name={fid("copyright")}
                mode="deferred"
                value={fields["copyright"] ?? ""}
                onCommit={createFieldCommit(id, "copyright")}
                className="text-xs text-slate-600 font-medium data-[focused=true]:text-slate-400"
              />
            </Builder.Item>
          </div>
        </div>
      </footer>
    </Builder.Section>
  );
}
