# Project: inspector-dogfooding
> Goal: UnifiedInspector.tsx에서 React 의존성(useState, useEffect, useMemo)을 100% 제거하되, **"OS는 얇은 ZIFT+Command 파이프라인만 제공하고, 앱의 도메인 로직(검색 필터 등)은 전적으로 앱이 주도적으로 통제한다"**는 엄격한 Jurisdiction Boundary(관할 경계)를 유지하며 엔터프라이즈급 UI 제어를 증명한다.

## 🎯 Now (진행 중인 태스크)
- [x] T1: App 수준의 Store 모델링 및 검색/토글 연동 완료 - InspectorApp 도입 및 Field/Item ZIFT 바인딩 적용. 테스트 100% 통과.
- [x] T2: App 수준 파생 데이터 연산(FilteredTx) 분리 및 성능 검증 완료 - `selectFilteredTransactions` 함수를 OS에서 분리하여 App 도메인에 위치시키고, `UnifiedInspector`는 이를 구독.
- [x] T3: 명시적 `OS_SCROLL` 커맨드 구축 완료 - DOM 조작 로직을 App state 기반 명령(scrollTick)으로 제어. 조건부 스크롤 성공적으로 분리.
- [ ] T4: 임시 시각적 하이라이트 레이어 (`HighlightOverlay`) 투영 시스템 OS 연동
- [ ] T5: 거대 React 뷰를 순수 돔 투영기 성격의 다중 컴포넌트로 분할

## 📋 Next (대기 중인 태스크)
- (태스크 진행에 따라 세분화)

## ✨ Done (완료된 태스크)
- (없음)
