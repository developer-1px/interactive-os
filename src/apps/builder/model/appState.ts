export type PropertyType =
    | "text"
    | "image"
    | "icon"
    | "link"
    | "button"
    | "section"
    | null;

export interface SectionEntry {
    id: string;
    label: string;
    /** Component type for rendering */
    type: "hero" | "news" | "services" | "footer";
    /** Co-located field data — each section owns its fields */
    fields: Record<string, string>;
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
        /** Ordered section list — each section owns its fields */
        sections: SectionEntry[];
    };
    ui: {
        /** 현재 선택된 요소의 builder ID */
        selectedId: string | null;
        /** 선택된 요소의 프로퍼티 타입 */
        selectedType: PropertyType;
        /** 사이드바 섹션 클립보드 */
        clipboard: { items: SectionEntry[]; isCut: boolean } | null;
    };
    history: {
        past: HistoryEntry[];
        future: HistoryEntry[];
    };
}

export const INITIAL_STATE: BuilderState = {
    data: {
        sections: [
            {
                id: "ncp-hero",
                label: "Hero",
                type: "hero",
                fields: {
                    title: "AI 시대를 위한\n가장 완벽한 플랫폼",
                    sub: "네이버클라우드의 기술력으로 완성된\n하이퍼스케일 AI 스튜디오를 경험하세요.",
                    brand: "NAVER CLOUD",
                    cta: "무료로 시작하기",
                    "portal-title": "Global Scale",
                    "portal-subtitle": "Hyper-connected infrastructure",
                },
            },
            {
                id: "ncp-news",
                label: "News",
                type: "news",
                fields: {
                    title: "네이버클라우드의\n새로운 소식",
                    "item-1-title": "Cloud DB for Cache\nRedis 호환성 강화",
                    "item-1-desc":
                        "Valkey 기반의 인메모리 캐시 서비스를 이제 클라우드에서 만나보세요.",
                    "item-1-date": "2024.03.15",
                    "item-2-title": "하이퍼클로바X\n기업용 솔루션 공개",
                    "item-2-date": "2024.03.10",
                    "item-3-title": "AI RUSH 2024\n개발자 컨퍼런스",
                    "item-3-date": "2024.03.01",
                },
            },
            {
                id: "ncp-services",
                label: "Services",
                type: "services",
                fields: {
                    category: "Service Category",
                    title: "비즈니스에 최적화된\n클라우드 서비스",
                    "item-title-0": "Server",
                    "item-desc-0":
                        "고성능 클라우드 서버 인프라를 \n몇 번의 클릭으로 구축하세요.",
                    "item-title-1": "Cloud DB for Cache",
                    "item-desc-1": "Valkey 기반의 완전 관리형 \n인메모리 캐시 서비스.",
                    "item-title-2": "CLOVA Speech",
                    "item-desc-2": "비즈니스 환경에 특화된 \n최고 수준의 음성 인식 기술.",
                    "item-title-3": "Data Stream",
                    "item-desc-3":
                        "대용량 데이터의 실시간 수집과 \n처리를 위한 파이프라인.",
                    "item-title-4": "Global CDN",
                    "item-desc-4": "전 세계 사용자에게 빠르고 \n안정적인 콘텐츠 전송.",
                    "item-title-5": "Kubernetes",
                    "item-desc-5": "컨테이너화된 애플리케이션의 \n자동화된 배포 및 관리.",
                },
            },
            {
                id: "ncp-footer",
                label: "Footer",
                type: "footer",
                fields: {
                    brand: "NAVER CLOUD",
                    desc: "네이버클라우드는 기업의 비즈니스 혁신을 위한\n최적의 클라우드 서비스를 제공합니다.",
                    copyright: `© ${new Date().getFullYear()} NAVER Cloud Corp. All rights reserved.`,
                },
            },
        ],
    },
    ui: {
        selectedId: null,
        selectedType: null,
        clipboard: null,
    },
    history: {
        past: [],
        future: [],
    },
};
