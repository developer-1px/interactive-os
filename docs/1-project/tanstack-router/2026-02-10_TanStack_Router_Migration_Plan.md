# 2026-02-10 TanStack Router Migration Plan

## 1. 개요 (Overview)
SPA의 라우팅 관리 효율성을 높이고, 글로벌 네비게이션(사이드바)의 메뉴 구성을 자동화하기 위해 **TanStack Router**로 마이그레이션을 진행하기로 결정했습니다. 기존의 수동적인 `react-router-dom` 설정을 제거하고, 파일 기반 라우팅 시스템을 도입합니다.

## 2. 분석 (Analysis)

### 현재 문제점
- **이중 관리**: 새로운 페이지를 추가할 때마다 `App.tsx`의 `<Routes>`와 `GlobalNav.tsx`의 배열을 모두 수정해야 합니다.
- **Type Safety 부재**: 문자열 기반의 경로 이동은 오타로 인한 링크 깨짐을 유발할 수 있습니다.
- **확장성 저하**: 앱이 커질수록 라우트 정의가 비대해지고 관리가 어려워집니다.

### 해결 방안: TanStack Router
- **File-based Routing**: `src/routes` 폴더 구조에 따라 라우트가 자동 생성됩니다.
- **Smart Metadata**: 라우트 파일 내에 `staticData`를 정의하여 아이콘, 라벨, 정렬 순서 등의 메타데이터를 함께 관리할 수 있습니다.
- **Auto-generated Menu**: 런타임에 라우터에서 메타데이터를 조회하여 Global Navigation을 자동으로 렌더링합니다.

## 3. 제안 (Proposal)

### 마이그레이션 단계
1.  **패키지 설치**: `@tanstack/react-router`, `@tanstack/router-plugin` 설치 및 `vite.config.ts` 수정.
2.  **구조 변경**: `src/pages`의 컴포넌트들을 `src/routes`로 이동 및 리팩토링 (`createFileRoute` 사용).
3.  **루트 설정**: `src/routes/__root.tsx`를 생성하여 기존 `App.tsx`의 레이아웃(GlobalNav 포함)을 이관.
4.  **네비게이션 연동**: `GlobalNav` 컴포넌트가 라우터의 `staticData`를 읽어 메뉴를 동적으로 생성하도록 수정.
5.  **검증**: 기존 `react-router-dom` 제거 확인 및 전체 기능 테스트.

이 작업은 기존 구조에 큰 변화를 주므로, 단계적으로 진행하며 각 단계마다 빌드 상태를 확인할 예정입니다.
