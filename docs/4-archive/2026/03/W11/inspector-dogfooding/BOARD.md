# Project: inspector-dogfooding
> Goal: UnifiedInspector.tsx에서 React 의존성(useState, useEffect, useMemo)을 100% 제거하되, **"OS는 얇은 ZIFT+Command 파이프라인만 제공하고, 앱의 도메인 로직(검색 필터 등)은 전적으로 앱이 주도적으로 통제한다"**는 엄격한 Jurisdiction Boundary(관할 경계)를 유지하며 엔터프라이즈급 UI 제어를 증명한다.

## 🎯 Now (진행 중인 태스크)
(없음)

## 📋 Next (대기 중인 태스크)
- [ ] T5: 거대 React 뷰를 순수 돔 투영기 성격의 다중 컴포넌트로 분할

## ✨ Done (완료된 태스크)
- [x] T1: App 수준의 Store 모델링 및 검색/토글 연동 완료
- [x] T2: App 수준 파생 데이터 연산(FilteredTx) 분리 및 성능 검증 완료
- [x] T3: 명시적 `OS_SCROLL` 커맨드 구축 완료
- [x] T4: 임시 시각적 하이라이트 레이어 (`HighlightOverlay`) 투영 시스템 OS 연동 완료
- [x] T6: Inspector scope 기본 제외 필터 — tsc 0 | 637 tests | build OK
- [x] T7: [data-inspector] 가드 전면 제거 — 5곳 listener guard 삭제 | tsc 0
- [x] T8: data-inspector DOM 속성 제거 + ZiftMonitor onClick 우회 제거 — tsc 0
- [x] T9: SPEC.md 규칙 갱신 + regression 검증 — 628 pass, 0 new fail
