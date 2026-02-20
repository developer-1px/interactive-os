/**
 * Block Presets — factory templates for adding individual blocks.
 *
 * Each preset is a Block snapshot. On insertion, IDs are regenerated
 * via deepClone to ensure uniqueness.
 */

import type { Block } from "../model/appState";

export interface BlockPreset {
    /** Display name in the palette */
    label: string;
    /** Short description */
    description: string;
    /** Block type key (matches BLOCK_COMPONENTS registry) */
    type: string;
    /** Emoji/icon hint for palette UI */
    icon: string;
    /** Template block — IDs will be regenerated on insert */
    block: Block;
}

export const BLOCK_PRESETS: BlockPreset[] = [
    {
        label: "히어로",
        description: "대형 타이틀 + CTA 버튼",
        type: "hero",
        icon: "🏠",
        block: {
            id: "tpl-hero",
            label: "Hero",
            type: "hero",
            fields: {
                title: "새로운 시작을 위한\n최고의 플랫폼",
                sub: "당신의 비즈니스를 한 단계 끌어올릴\n강력한 솔루션을 만나보세요.",
                brand: "BRAND",
                cta: "시작하기",
                "nav-login": "로그인",
                "nav-signup": "회원가입",
                "portal-title": "Global Scale",
                "portal-subtitle": "Connected infrastructure",
            },
        },
    },
    {
        label: "뉴스",
        description: "벤토 그리드 뉴스 카드",
        type: "news",
        icon: "📰",
        block: {
            id: "tpl-news",
            label: "News",
            type: "news",
            fields: {
                title: "새로운 소식",
                all: "전체 보기",
                "item-1-title": "첫 번째 뉴스\n제목을 입력하세요",
                "item-1-desc": "뉴스 설명을 입력하세요.",
                "item-1-date": "2026.01.01",
                "item-2-title": "두 번째 뉴스\n제목을 입력하세요",
                "item-2-date": "2026.01.01",
                "item-3-title": "세 번째 뉴스\n제목을 입력하세요",
                "item-3-date": "2026.01.01",
            },
        },
    },
    {
        label: "서비스",
        description: "카드 그리드 + 탭 필터",
        type: "services",
        icon: "🧩",
        block: {
            id: "tpl-services",
            label: "Services",
            type: "services",
            fields: {
                category: "Service Category",
                title: "우리의 서비스를\n소개합니다",
            },
            accept: ["service-card"],
            children: [
                {
                    id: "tpl-services-card-1",
                    type: "service-card",
                    label: "Service Card",
                    fields: {
                        "item-title": "서비스 1",
                        "item-desc": "서비스 설명을 입력하세요.",
                        icon: "Box",
                        color: "text-blue-600 bg-blue-50",
                        badge: "",
                    },
                },
                {
                    id: "tpl-services-card-2",
                    type: "service-card",
                    label: "Service Card",
                    fields: {
                        "item-title": "서비스 2",
                        "item-desc": "서비스 설명을 입력하세요.",
                        icon: "Globe",
                        color: "text-purple-600 bg-purple-50",
                        badge: "",
                    },
                },
                {
                    id: "tpl-services-card-3",
                    type: "service-card",
                    label: "Service Card",
                    fields: {
                        "item-title": "서비스 3",
                        "item-desc": "서비스 설명을 입력하세요.",
                        icon: "Shield",
                        color: "text-green-600 bg-green-50",
                        badge: "",
                    },
                },
            ],
        },
    },
    {
        label: "프라이싱",
        description: "월간/연간 요금 플랜",
        type: "pricing",
        icon: "💰",
        block: {
            id: "tpl-pricing",
            label: "Pricing",
            type: "pricing",
            fields: {
                badge: "PRICING",
                title: "Simple, transparent pricing",
                sub: "Choose the plan that fits your needs",
                "m-starter-cta": "Get Started",
                "m-pro-cta": "Start Free Trial",
                "m-ent-cta": "Contact Sales",
                "a-starter-cta": "Get Started",
                "a-pro-cta": "Start Free Trial",
                "a-ent-cta": "Contact Sales",
            },
            children: [
                { id: "tpl-pricing-monthly", label: "Monthly", type: "pricing-tab", fields: {} },
                { id: "tpl-pricing-annual", label: "Annual", type: "pricing-tab", fields: {} },
            ],
        },
    },
    {
        label: "푸터",
        description: "브랜드 + 링크 그리드",
        type: "footer",
        icon: "🔻",
        block: {
            id: "tpl-footer",
            label: "Footer",
            type: "footer",
            fields: {
                brand: "BRAND",
                desc: "서비스 소개 문구를 입력하세요.",
                copyright: `© ${new Date().getFullYear()} Company. All rights reserved.`,
            },
        },
    },
];
