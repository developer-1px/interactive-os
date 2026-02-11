import { Field } from "@os/6-components/Field";
import {
  Github,
  Globe,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
} from "lucide-react";
import { useState } from "react";
import { Builder } from "@/apps/builder/primitives/Builder";

export function NCPFooterBlock() {
  const [brand, setBrand] = useState("NAVER CLOUD");

  const [columns] = useState([
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
  ]);

  const [socials] = useState([
    { icon: Youtube, label: "Youtube", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
    { icon: Github, label: "GitHub", href: "#" },
    { icon: Twitter, label: "Twitter", href: "#" },
    { icon: Instagram, label: "Instagram", href: "#" },
  ]);

  const [bottomLinks] = useState([
    "개인정보처리방침",
    "이용약관",
    "서비스 수준 협약 (SLA)",
    "청소년보호정책",
  ]);

  return (
    <Builder.Section asChild id="ncp-footer">
      <footer className="bg-slate-900 py-16 px-6 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <Builder.Item asChild id="footer-brand">
                <Field
                  name="footer-brand"
                  mode="deferred"
                  value={brand}
                  onCommit={(val: string) => setBrand(val)}
                  className="font-black text-2xl tracking-tighter text-white mb-6 block w-fit data-[focused=true]:bg-slate-800 data-[focused=true]:ring-2 data-[focused=true]:ring-slate-600 rounded px-2 -mx-2"
                />
              </Builder.Item>

              <Builder.Item asChild id="footer-desc">
                <Field
                  name="footer-desc"
                  mode="deferred"
                  multiline
                  value="네이버클라우드는 기업의 비즈니스 혁신을 위한\n최적의 클라우드 서비스를 제공합니다."
                  className="text-slate-500 text-sm leading-relaxed max-w-sm mb-6 block data-[focused=true]:bg-slate-800 rounded p-2 -ml-2"
                />
              </Builder.Item>

              <Builder.Group asChild id="footer-lang">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800/50 border border-slate-700 data-[focused=true]:ring-2 data-[focused=true]:ring-slate-500">
                  <Globe size={16} className="text-slate-400" />
                  <Builder.Item asChild id="footer-lang-select">
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
                id={`footer-col-${colIndex}`}
              >
                <div className="lg:col-span-1">
                  <Builder.Item asChild id={`footer-col-${colIndex}-title`}>
                    <h3 className="font-bold text-white text-sm tracking-wider uppercase mb-6 data-[focused=true]:bg-slate-800 rounded px-1 w-fit">
                      {col.title}
                    </h3>
                  </Builder.Item>
                  <ul className="space-y-3">
                    {col.links.map((link, linkIndex) => (
                      <li key={link.label}>
                        <Builder.Item
                          asChild
                          id={`footer-link-${colIndex}-${linkIndex}`}
                        >
                          <Builder.Link
                            id={`footer-link-inner-${colIndex}-${linkIndex}`}
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

            {/* Social / Contact Column? Maybe merge into last column or separate. 
                Actually 2+1+1+1 = 5 columns. I used lg:grid-cols-6. 
                Let's make Brand 2 cols, Products 1, Solutions 1, Support 1. That's 5. 
                Maybe add an empty column or spacer, or just let them space out.
                Let's stick to the current layout.
            */}
            <div className="lg:col-span-1">
              <Builder.Item asChild id="footer-social-title">
                <h3 className="font-bold text-white text-sm tracking-wider uppercase mb-6 data-[focused=true]:bg-slate-800 rounded px-1 w-fit">
                  Follow Us
                </h3>
              </Builder.Item>
              <div className="flex flex-wrap gap-3">
                {socials.map((social, i) => (
                  <Builder.Item
                    asChild
                    key={social.label}
                    id={`footer-social-${i}`}
                  >
                    <Builder.Link
                      id={`footer-social-btn-${i}`}
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
                <Builder.Item asChild key={text} id={`footer-bottom-link-${i}`}>
                  <Builder.Link
                    id={`footer-bottom-link-inner-${i}`}
                    href="#"
                    className={`text-xs font-bold ${i === 0 ? "text-slate-300" : "text-slate-500"} hover:text-white transition-colors data-[focused=true]:ring-1 data-[focused=true]:ring-slate-600 rounded px-1`}
                  >
                    {text}
                  </Builder.Link>
                </Builder.Item>
              ))}
            </div>

            <Builder.Item asChild id="footer-copyright">
              <Field
                name="footer-copyright"
                mode="deferred"
                value={`© ${new Date().getFullYear()} NAVER Cloud Corp. All rights reserved.`}
                className="text-xs text-slate-600 font-medium data-[focused=true]:text-slate-400"
              />
            </Builder.Item>
          </div>
        </div>
      </footer>
    </Builder.Section>
  );
}
