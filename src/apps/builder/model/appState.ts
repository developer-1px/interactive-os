export type PropertyType =
  | "text"
  | "image"
  | "icon"
  | "link"
  | "button"
  | "badge"
  | "divider"
  | "tabs"
  | "section"
  | null;

/**
 * Block — Universal builder data model.
 *
 * Every element in the builder is a Block: hero sections, cards, tabs, etc.
 * Container blocks (tabs, accordion, carousel) have children.
 * Leaf blocks (hero, footer) do not.
 *
 * Design blocks are free to use any HTML/CSS.
 * Builder Primitives annotate which parts are editable.
 * `fields` stores editable content values (always strings).
 */
export interface Block {
  id: string;
  label: string;
  /** Block type — resolved by BlockRegistry to a renderer component */
  type: string;
  /** Editable content — all values are strings (text, URLs, icon names) */
  fields: Record<string, string>;
  /** Child blocks for container types (tabs, accordion, carousel) */
  children?: Block[];
  /** Constrained Composition — allowed child block types (e.g. ["section"]) */
  accept?: string[];
}

/** Find a block by id in the tree and return its type + depth. */
export function findBlockInfo(
  blocks: Block[],
  targetId: string,
  depth = 0,
): { type: string; depth: number } | null {
  for (const block of blocks) {
    if (block.id === targetId) {
      return { type: block.type, depth };
    }
    if (block.children) {
      const found = findBlockInfo(block.children, targetId, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

interface HistoryEntry {
  command: { type: string; payload?: unknown };
  timestamp: number;
  snapshot?: Record<string, unknown>;
  groupId?: string;
  focusedItemId?: string | number;
}

export interface BuilderState {
  data: {
    /** Block tree — top-level blocks, each may contain children */
    blocks: Block[];
  };
  history: {
    past: HistoryEntry[];
    future: HistoryEntry[];
  };
}

export const INITIAL_STATE: BuilderState = {
  data: {
    blocks: [
      // ─── 1. Hero + Deprecated 배너 + 탭 네비게이션 ──────────────────
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
          tabs: "개요,상세 기능,요금,리소스,FAQ",
          deprecated: "true",
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

      // ─── 3. 서비스 특징 ─────────────────────────────────────────────
      {
        id: "ge-features",
        label: "서비스 특징",
        type: "ncp-feature-cards",
        fields: {
          "section-title": "서비스 특징",
          subtitle: "AI 학습 기반의 유해 이미지 탐지 자동화",
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

      // ─── 3. 섹션 푸터 CTA ──────────────────────────────────────────
      {
        id: "ge-section-footer",
        label: "섹션 푸터",
        type: "ncp-section-footer",
        fields: {
          title: "이미지를 판독하여 유해 콘텐츠를 탐지하는 서비스",
          "cta-primary": "이용 문의",
          "cta-secondary": "요금 계산",
          "bg-image": "https://portal.gcdn.ntruss.com/image/Database_1720489901543.png",
        },
      },

      // ─── 4. 활용 사례 ───────────────────────────────────────────────
      {
        id: "ge-usecase",
        label: "활용 사례",
        type: "ncp-feature-cards",
        fields: {
          "section-title": "활용 사례",
          subtitle: "구현 시나리오 예시",
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

      // ─── 4. 상세 기능 ───────────────────────────────────────────────
      {
        id: "ge-detail",
        label: "상세 기능",
        type: "ncp-feature-cards",
        fields: {
          "section-title": "상세 기능",
          subtitle: "유해 콘텐츠 등급 분류 기준",
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

      // ─── 5. 요금 ───────────────────────────────────────────────────
      {
        id: "ge-pricing",
        label: "요금",
        type: "pricing",
        fields: {
          title: "요금",
          sub: "CLOVA GreenEye는 네이버 클라우드 플랫폼 콘솔에서 서비스 이용을 신청할 수 있으며 승인된 사용만 서비스 사용할 수 있습니다.\n이용 신청에 앞서 [이용 문의하기]를 클릭하여 이용 문의를 접수하고 담당 영업팀으로부터 이용 신청 관련 안내를 받아 이용 신청을 해주십시오.",
          cta: "이용 문의하기",
          tier1: "협의에 의한 별도 요금",
          tier2: "",
          tier3: "",
        },
      },

      // ─── 6. 리소스 ─────────────────────────────────────────────────
      {
        id: "ge-resources",
        label: "리소스",
        type: "ncp-feature-cards",
        fields: {
          "section-title": "리소스",
          subtitle: "사용 가이드",
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

      // ─── 7. 푸터 ───────────────────────────────────────────────────
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
  history: {
    past: [],
    future: [],
  },
};
