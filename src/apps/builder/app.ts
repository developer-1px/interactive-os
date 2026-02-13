/**
 * Builder App — defineApp + createWidget based.
 *
 * Second dogfooding of defineApp pattern.
 * Unlike Todo (entity CRUD with id → object), Builder manages flat key-value content fields.
 * Each field name maps 1:1 to an OS.Field `name` prop.
 *
 * Structure:
 *   BuilderApp (defineApp) — state + selectors
 *   ├── BuilderCanvas (createWidget) — updateField, selectElement commands
 *   └── (PropertiesPanel reads via useComputed, writes via same updateField)
 */

import { produce } from "immer";
import { defineApp } from "@/os/defineApp";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export type PropertyType =
  | "text"
  | "image"
  | "icon"
  | "link"
  | "button"
  | "section"
  | null;

export interface BuilderState {
  data: {
    /** field name → value. OS.Field의 name과 1:1 매핑 */
    fields: Record<string, string>;
  };
  ui: {
    /** 현재 선택된 요소의 builder ID */
    selectedId: string | null;
    /** 선택된 요소의 프로퍼티 타입 */
    selectedType: PropertyType;
  };
}

// ═══════════════════════════════════════════════════════════════════
// Initial State — NCP 블록들의 편집 가능한 필드 초기값
// ═══════════════════════════════════════════════════════════════════

export const INITIAL_STATE: BuilderState = {
  data: {
    fields: {
      // Hero Block
      "ncp-hero-title": "AI 시대를 위한\n가장 완벽한 플랫폼",
      "ncp-hero-sub":
        "네이버클라우드의 기술력으로 완성된\n하이퍼스케일 AI 스튜디오를 경험하세요.",
      "ncp-hero-brand": "NAVER CLOUD",
      "ncp-hero-cta": "무료로 시작하기",
      "ncp-hero-portal-title": "Global Scale",
      "ncp-hero-portal-subtitle": "Hyper-connected infrastructure",

      // News Block
      "ncp-news-title": "네이버클라우드의\n새로운 소식",
      "news-1-title": "Cloud DB for Cache\nRedis 호환성 강화",
      "news-1-desc":
        "Valkey 기반의 인메모리 캐시 서비스를 이제 클라우드에서 만나보세요.",
      "news-1-date": "2024.03.15",
      "news-2-title": "하이퍼클로바X\n기업용 솔루션 공개",
      "news-2-date": "2024.03.10",
      "news-3-title": "AI RUSH 2024\n개발자 컨퍼런스",
      "news-3-date": "2024.03.01",

      // Services Block
      "ncp-service-category": "Service Category",
      "ncp-service-title": "비즈니스에 최적화된\n클라우드 서비스",
      "service-title-0": "Server",
      "service-desc-0":
        "고성능 클라우드 서버 인프라를 \n몇 번의 클릭으로 구축하세요.",
      "service-title-1": "Cloud DB for Cache",
      "service-desc-1": "Valkey 기반의 완전 관리형 \n인메모리 캐시 서비스.",
      "service-title-2": "CLOVA Speech",
      "service-desc-2": "비즈니스 환경에 특화된 \n최고 수준의 음성 인식 기술.",
      "service-title-3": "Data Stream",
      "service-desc-3":
        "대용량 데이터의 실시간 수집과 \n처리를 위한 파이프라인.",
      "service-title-4": "Global CDN",
      "service-desc-4": "전 세계 사용자에게 빠르고 \n안정적인 콘텐츠 전송.",
      "service-title-5": "Kubernetes",
      "service-desc-5": "컨테이너화된 애플리케이션의 \n자동화된 배포 및 관리.",

      // Footer Block
      "footer-brand": "NAVER CLOUD",
      "footer-desc":
        "네이버클라우드는 기업의 비즈니스 혁신을 위한\n최적의 클라우드 서비스를 제공합니다.",
      "footer-copyright": `© ${new Date().getFullYear()} NAVER Cloud Corp. All rights reserved.`,

      // ── Legacy Blocks ──────────────────────────────────────────

      // HeroBlock
      "hero-badge": "NEW — Now with AI-powered layouts",
      "hero-headline": "Build websites that convert.",
      "hero-subheadline":
        "The visual builder for teams who ship fast. No code required, just drag, drop, and publish.",

      // CTABlock
      "cta-headline": "Ready to build something amazing?",
      "cta-subtext": "Start free. No credit card required. Cancel anytime.",
      "cta-footer": "Join 10,000+ teams already using our platform",

      // FeaturesBlock
      "features-eyebrow": "FEATURES",
      "features-title": "Everything you need to ship.",
      "feature-main-title": "AI-Powered Design",
      "feature-main-desc":
        "Generate layouts, copy, and images with a single prompt. Our AI understands your brand and creates on-brand content instantly.",
      "feature-speed-title": "Blazing Fast",
      "feature-speed-desc": "Sub-second load times, every page.",
      "feature-security-title": "Enterprise Security",
      "feature-security-desc": "SOC 2 compliant. Your data is safe.",
      "feature-analytics-title": "Built-in Analytics",
      "feature-analytics-desc":
        "Track conversions, heatmaps, and user flows without extra tools.",
      "feature-collab-title": "Real-time Collaboration",
      "feature-collab-desc": "Edit together with your team, in real-time.",

      // TestimonialsBlock
      "testimonials-eyebrow": "TESTIMONIALS",
      "testimonials-title": "Loved by thousands.",
      "testimonial-1-quote":
        "We cut our landing page development time by 80%. The AI suggestions are scarily good.",
      "testimonial-1-name": "Sarah Chen",
      "testimonial-1-role": "Head of Growth, Acme",
      "testimonial-2-quote":
        "Finally, a builder that doesn't feel like a compromise. It's fast, beautiful, and my team actually uses it.",
      "testimonial-2-name": "Marcus Johnson",
      "testimonial-2-role": "Founder, Startup",
      "testimonial-3-quote":
        "The attention to detail is incredible. Every interaction feels polished.",
      "testimonial-3-name": "Emily Park",
      "testimonial-3-role": "Design Lead, Agency",
    },
  },
  ui: {
    selectedId: null,
    selectedType: null,
  },
};

// ═══════════════════════════════════════════════════════════════════
// App definition
// ═══════════════════════════════════════════════════════════════════

export const BuilderApp = defineApp<BuilderState>("builder", INITIAL_STATE, {
  selectors: {
    fieldValue: (state: BuilderState, name: string) =>
      state.data.fields[name] ?? "",
    selectedId: (state: BuilderState) => state.ui.selectedId,
    selectedType: (state: BuilderState) => state.ui.selectedType,
    allFields: (state: BuilderState) => state.data.fields,
  },
});

// ═══════════════════════════════════════════════════════════════════
// BuilderCanvas — canvas + panel shared commands
// ═══════════════════════════════════════════════════════════════════

export const BuilderCanvas = BuilderApp.createWidget("canvas", (define) => {
  /**
   * updateField — 필드 값 변경.
   * 캔버스 인라인 편집과 패널 편집 모두 이 하나의 커맨드를 사용.
   */
  const updateField = define.command(
    "updateField",
    [],
    (ctx: { state: BuilderState }) =>
      (payload: { name: string; value: string }) => ({
        state: produce(ctx.state, (draft) => {
          draft.data.fields[payload.name] = payload.value;
        }),
      }),
  );

  /**
   * selectElement — 요소 선택 상태 변경.
   * kernel focus와 동기화하여 패널에 해당 요소 데이터를 표시.
   */
  const selectElement = define.command(
    "selectElement",
    [],
    (ctx: { state: BuilderState }) =>
      (payload: { id: string | null; type: PropertyType }) => ({
        state: produce(ctx.state, (draft) => {
          draft.ui.selectedId = payload.id;
          draft.ui.selectedType = payload.type;
        }),
      }),
  );

  return {
    commands: { updateField, selectElement },
    zone: { role: "grid" },
  };
});

// ═══════════════════════════════════════════════════════════════════
// Helper for onCommit callbacks (OS.Field → state update)
// ═══════════════════════════════════════════════════════════════════

/**
 * Update a single field value in the centralized state.
 * Used in NCP blocks' OS.Field onCommit callbacks.
 *
 * This bridges OS.Field's callback-based API and defineApp's state.
 * Both canvas inline editing and panel editing converge on the same state.
 */
export function builderUpdateField(name: string, value: string) {
  BuilderApp.setState((prev) =>
    produce(prev, (draft) => {
      draft.data.fields[name] = value;
    }),
  );
}
