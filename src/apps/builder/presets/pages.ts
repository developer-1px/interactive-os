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
    id: "ncp-green-eye",
    label: "CLOVA GreenEye",
    description: "NCP 서비스 상세 페이지 — 실제 GreenEye 구성",
    icon: "👁️",
    blocks: [
      // ─── 1. Hero + Deprecated 배너 + 탭 네비게이션 ────────────────────
      {
        id: "ge-hero",
        label: "Product Hero",
        type: "ncp-product-hero",
        fields: {
          "service-name": "CLOVA GreenEye",
          "service-desc":
            "이미지를 판독하여 유해 콘텐츠를 탐지하는 서비스",
          "cta-primary": "이용 문의",
          "cta-secondary": "요금 계산",
          "breadcrumb-1": "서비스",
          "breadcrumb-2": "AI Services",
          "tabs": "개요,상세 기능,요금,리소스,FAQ",
          "deprecated": "true",
          "badge-text": "Deprecated",
          "notice-title": "CLOVA GreenEye 서비스 종료 안내",
          "notice-desc":
            "CLOVA GreenEye 서비스가 2026년 4월 23일 종료됩니다. 2026년 1월 22일부터 신규 신청이 제한되오니 자세한 내용은 공지사항을 참고해주세요.",
        },
      },

      // ─── 2. 공지사항 배너 ────────────────────────────────────────────
      {
        id: "ge-notice",
        label: "공지사항",
        type: "ncp-notice",
        fields: {
          label: "공지사항",
          text: "CLOVA GreenEye 서비스가 2026년 4월 23일 종료됩니다. 2026년 1월 22일부터 신규 신청이 제한되오니 자세한 내용은 공지사항을 확인해주시기 바랍니다.",
        },
      },

      // ─── 3. 서비스 특징 섹션 헤더 ────────────────────────────────────
      {
        id: "ge-features",
        label: "서비스 특징",
        type: "ncp-feature-cards",
        fields: {
          "section-title": "서비스 특징",
          "subtitle": "AI 학습 기반의 유해 이미지 탐지 자동화",
        },
        children: [
          {
            id: "ge-card-1",
            type: "ncp-feature-card",
            label: "뛰어난 정확도",
            fields: {
              "card-title": "뛰어난 정확도",
              "card-desc":
                "네이버에 축적된 수백만 장의 이미지를 AI로 꾸준히 학습하고 최신화한 데이터를 기반으로 이미지를 판독합니다. 판독한 이미지는 99.5%의 정확도로 정상, 음란, 성인, 선정 4가지 등급으로 분류할 수 있습니다.",
            },
          },
          {
            id: "ge-card-2",
            type: "ncp-feature-card",
            label: "콘텐츠 품질 향상",
            fields: {
              "card-title": "콘텐츠 품질 향상",
              "card-desc":
                "유해 콘텐츠 탐지 및 검열을 자동화하여 손쉽게 건전한 인터넷 이용 환경을 조성할 수 있습니다.",
            },
          },
          {
            id: "ge-card-3",
            type: "ncp-feature-card",
            label: "안정적 서비스 제공",
            fields: {
              "card-title": "안정적 서비스 제공",
              "card-desc":
                "콘텐츠 탐지 자동화로 관리자가 콘텐츠를 일일이 검수하는 수작업을 최소화하고 검수 인력의 공백을 줄일 수 있어 안정적인 콘텐츠를 실시간으로 제공할 수 있습니다.",
            },
          },
        ],
      },

      // ─── 3. 활용 사례 ─────────────────────────────────────────────────
      {
        id: "ge-usecase",
        label: "활용 사례",
        type: "ncp-feature-cards",
        fields: {
          "section-title": "활용 사례",
          "subtitle": "구현 시나리오 예시",
        },
        children: [
          {
            id: "ge-usecase-card-1",
            type: "ncp-feature-card",
            label: "유해 이미지 탐지",
            fields: {
              "card-title": "유해 이미지 탐지 및 등급 분류",
              "card-desc":
                "인터넷 및 모바일 환경에 등록되어 전송된 모든 콘텐츠를 이미지 단위로 검사하고 유해 콘텐츠 등급에 따라 검사 결괏값을 반환합니다. 사용자가 실제 구현할 때는 원하는 정책에 따른 방식으로 구현할 수 있습니다.",
            },
          },
        ],
      },

      // ─── 4. 상세 기능 ─────────────────────────────────────────────────
      {
        id: "ge-detail",
        label: "상세 기능",
        type: "ncp-feature-cards",
        fields: {
          "section-title": "상세 기능",
          "subtitle": "유해 콘텐츠 등급 분류 기준",
        },
        children: [
          {
            id: "ge-detail-card-1",
            type: "ncp-feature-card",
            label: "정상",
            fields: {
              "card-title": "정상 (Green)",
              "card-desc":
                "방송통신심의위원회 기준 일반 사용자에게 무해한 이미지입니다.",
            },
          },
          {
            id: "ge-detail-card-2",
            type: "ncp-feature-card",
            label: "선정",
            fields: {
              "card-title": "선정 (Yellow)",
              "card-desc":
                "노출이 있으나 성인 수준에는 이르지 않는 이미지입니다.",
            },
          },
          {
            id: "ge-detail-card-3",
            type: "ncp-feature-card",
            label: "성인",
            fields: {
              "card-title": "성인 (Orange)",
              "card-desc":
                "성인만 이용할 수 있는 수준의 콘텐츠를 포함한 이미지입니다.",
            },
          },
          {
            id: "ge-detail-card-4",
            type: "ncp-feature-card",
            label: "음란",
            fields: {
              "card-title": "음란 (Red)",
              "card-desc":
                "방송통신심의위원회 기준 음란물에 해당하는 이미지입니다. 서비스 내 게시 불가 수준입니다.",
            },
          },
        ],
      },

      // ─── 5. 요금 ──────────────────────────────────────────────────────
      {
        id: "ge-pricing",
        label: "요금",
        type: "pricing",
        fields: {
          title: "요금",
          sub:
            "CLOVA GreenEye는 네이버 클라우드 플랫폼 콘솔에서 서비스 이용을 신청할 수 있으며 승인된 사용만 서비스 사용할 수 있습니다.\n이용 신청에 앞서 [이용 문의하기]를 클릭하여 이용 문의를 접수하고 담당 영업팀으로부터 이용 신청 관련 안내를 받아 이용 신청을 해주십시오.",
          cta: "이용 문의하기",
          tier1: "협의에 의한 별도 요금",
          tier2: "",
          tier3: "",
        },
      },

      // ─── 6. 리소스 ────────────────────────────────────────────────────
      {
        id: "ge-resources",
        label: "리소스",
        type: "ncp-feature-cards",
        fields: {
          "section-title": "리소스",
          "subtitle": "사용 가이드",
        },
        children: [
          {
            id: "ge-res-card-1",
            type: "ncp-feature-card",
            label: "사용 가이드",
            fields: {
              "card-title": "CLOVA GreenEye 개요",
              "card-desc":
                "CLOVA GreenEye 서비스의 개요, 사용 방법, API 레퍼런스를 확인할 수 있는 가이드 문서입니다.",
            },
          },
        ],
      },

      // ─── 7. 푸터 ──────────────────────────────────────────────────────
      {
        id: "ge-footer",
        label: "Footer",
        type: "footer",
        fields: {
          brand: "NAVER Cloud Platform",
          desc: "대한민국 No.1 클라우드 플랫폼",
          copyright: `© ${new Date().getFullYear()} NAVER Cloud Corp. All Rights Reserved.`,
        },
      },
    ],
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
