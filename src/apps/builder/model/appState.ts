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

/** Find a block by id anywhere in the tree (recursive). */
export function findBlock(
  blocks: Block[],
  targetId: string,
): Block | undefined {
  for (const block of blocks) {
    if (block.id === targetId) return block;
    if (block.children) {
      const found = findBlock(block.children, targetId);
      if (found) return found;
    }
  }
  return undefined;
}

interface HistoryEntry {
  command: { type: string; payload?: unknown };
  timestamp: number;
  snapshot?: Record<string, unknown>;
  groupId?: string;
  focusedItemId?: string | number;
}

export interface BuilderStateData {
  /** Block tree — top-level blocks, each may contain children */
  blocks: Block[];
}

export interface BuilderState {
  data: BuilderStateData;
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
          "service-name:en": "CLOVA GreenEye",
          "service-name:ja": "CLOVA グリーンアイ",
          "service-desc": "이미지를 판독하여 유해 콘텐츠를 탐지하는 서비스",
          "service-desc:en":
            "A service that detects harmful content by analyzing images.",
          "service-desc:ja": "画像を解析して有害なコンテンツを検出するサービス",
          "cta-primary": "이용 문의",
          "cta-primary:en": "Contact Us",
          "cta-secondary": "요금 계산",
          "cta-secondary:en": "Calculate Cost",
          "breadcrumb-1": "서비스",
          "breadcrumb-2": "AI Services",
          deprecated: "true",
          "badge-text": "Deprecated",
          "notice-title": "CLOVA GreenEye 서비스 종료 안내",
          "notice-desc":
            "CLOVA GreenEye 서비스가 2026년 4월 23일 종료됩니다. 2026년 1월 22일부터 신규 신청이 제한되오니 자세한 내용은 공지사항을 참고해주세요.",
        },
      },

      // ─── 탭 컨테이너 ──────────────────────────────────────────────
      {
        id: "ge-tab-nav",
        label: "탭 네비게이션",
        type: "ncp-tab-nav",
        fields: {},
        children: [
          {
            id: "ge-tab-overview",
            type: "tab",
            label: "개요",
            fields: {},
            children: [
              // 공지사항
              {
                id: "ge-notice",
                label: "공지사항",
                type: "ncp-notice",
                fields: {
                  label: "공지사항",
                  text: "CLOVA GreenEye 서비스가 2026년 4월 23일 종료됩니다. 2026년 1월 22일부터 신규 신청이 제한되오니 자세한 내용은 공지사항을 확인해주시기 바랍니다.",
                },
              },
              // 서비스 특징
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
            ],
          },
          {
            id: "ge-tab-detail",
            type: "tab",
            label: "상세 기능",
            fields: {},
            children: [
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
            ],
          },
          {
            id: "ge-tab-usecase",
            type: "tab",
            label: "활용 사례",
            fields: {},
            children: [
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
            ],
          },
          {
            id: "ge-tab-resources",
            type: "tab",
            label: "리소스",
            fields: {},
            children: [
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
            ],
          },
          {
            id: "ge-tab-faq",
            type: "tab",
            label: "FAQ",
            fields: {},
            children: [],
          },
        ],
      },

      // ─── 연동 부가 서비스 ────────────────────────────────────────────
      {
        id: "ge-related-services",
        label: "연동 부가 서비스",
        type: "ncp-related-services",
        fields: {
          "section-title": "연동 부가 서비스",
        },
        children: [
          {
            id: "ge-rs-1",
            type: "ncp-related-service-card",
            label: "Load Balancer",
            fields: {
              "card-title": "Load Balancer",
              "card-desc":
                "서버 성능과 부하량을 고려하여 네트워크 트래픽을 다수의 서버로 분산해 주는 서비스",
              category: "Networking",
              badge: "Update",
            },
          },
          {
            id: "ge-rs-2",
            type: "ncp-related-service-card",
            label: "Block Storage",
            fields: {
              "card-title": "Block Storage",
              "card-desc":
                "빠르게 생성하여 사용하고 반납하는 효율적인 스토리지",
              category: "Storage",
            },
          },
          {
            id: "ge-rs-3",
            type: "ncp-related-service-card",
            label: "NAS",
            fields: {
              "card-title": "NAS",
              "card-desc":
                "다수의 서버를 네트워크에 연결하여 사용할 수 있는 스토리지",
              category: "Storage",
            },
          },
          {
            id: "ge-rs-4",
            type: "ncp-related-service-card",
            label: "Auto Scaling",
            fields: {
              "card-title": "Auto Scaling",
              "card-desc":
                "사전 설정에 따라 서버 수를 자동으로 조절해 주는 서비스",
              category: "Compute",
            },
          },
        ],
      },

      // ─── 섹션 푸터 CTA ──────────────────────────────────────────
      {
        id: "ge-section-footer",
        label: "섹션 푸터",
        type: "ncp-section-footer",
        fields: {
          title: "이미지를 판독하여 유해 콘텐츠를 탐지하는 서비스",
          "cta-primary": "이용 문의",
          "cta-secondary": "요금 계산",
          "bg-image":
            "https://portal.gcdn.ntruss.com/image/Database_1720489901543.png",
        },
      },

      // ─── 푸터 ───────────────────────────────────────────────────
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
