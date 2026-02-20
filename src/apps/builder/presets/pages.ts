/**
 * Page Presets — complete page templates composed of multiple blocks.
 *
 * Each preset is a Block[] that replaces the entire canvas.
 * The current INITIAL_STATE is the "SaaS Landing" preset.
 */

import type { Block } from "../model/appState";
import { INITIAL_STATE } from "../model/appState";

export interface PagePreset {
  /** Unique key */
  id: string;
  /** Display name */
  label: string;
  /** Short description */
  description: string;
  /** Preview emoji/icon */
  icon: string;
  /** Complete block tree */
  blocks: Block[];
}

export const PAGE_PRESETS: PagePreset[] = [
  {
    id: "saas-landing",
    label: "SaaS 랜딩",
    description: "히어로 + 뉴스 + 서비스 + 프라이싱 + 푸터",
    icon: "🚀",
    blocks: INITIAL_STATE.data.blocks,
  },
  {
    id: "minimal",
    label: "미니멀",
    description: "히어로 + 푸터만",
    icon: "✨",
    blocks: [
      {
        id: "min-hero",
        label: "Hero",
        type: "hero",
        fields: {
          title: "심플하게 시작하세요",
          sub: "필요한 블록을 추가하며\n나만의 페이지를 만들어보세요.",
          brand: "BRAND",
          cta: "시작하기",
          "nav-login": "로그인",
          "nav-signup": "회원가입",
          "portal-title": "Start Here",
          "portal-subtitle": "Build your page",
        },
      },
      {
        id: "min-footer",
        label: "Footer",
        type: "footer",
        fields: {
          brand: "BRAND",
          desc: "당신의 브랜드를 소개하세요.",
          copyright: `© ${new Date().getFullYear()} Company. All rights reserved.`,
        },
      },
    ],
  },
  {
    id: "blank",
    label: "빈 페이지",
    description: "빈 캔버스에서 시작",
    icon: "📄",
    blocks: [],
  },
];
