# Builder MVP — defineApp 개밥먹기 2차

> Created: 2026-02-16
> Phase: Execution
> Track: Light

---

## WHY

Todo 앱에서 검증된 `defineApp` 패턴(v5: `createZone` + `bind`)이 **CMS/Web Builder** 도메인에서도 자연스럽게 작동하는지 직접 증명한다.

Todo는 **엔티티(id → object) + CRUD** 구조였다. Builder는 **flat key-value + 2D spatial navigation + 패널 동기화** 구조다. 같은 OS 프리미티브가 도메인이 달라도 통하는지, 어디서 마찰이 생기는지 개밥먹기로 발견한다.

### 이전 시도와의 차이

- `2026-02-builder-os-panel-binding`: defineApp 적용 + 패널 바인딩 (PRD만 작성, 실행 안 됨)
- `2026-02-builder-focus-navigation`: 포커스 네비게이션 복원 (완료)
- **이번**: 위 두 프로젝트의 성과 위에서, **Todo의 createZone + bind 패턴**을 builder에 본격 적용하여 MVP를 완성한다.

## Goals

1. **Todo 패턴 확장 검증**: Todo에서 쓰는 `createZone` + `zone.bind` + `zone.command` 3단 구조가 Builder에도 적합한지 증명
2. **키보드 + 인라인 편집 워크플로우**: Builder 캔버스에서 키보드만으로 요소 선택 → 인라인 편집 → 저장 완주
3. **캔버스 ↔ 패널 양방향 동기화**: 같은 커맨드로 캔버스/패널 편집이 통합되는지 검증
4. **기본 기능 E2E 커버리지**: 포커스 이동뿐 아니라 편집·수정·동기화의 핵심 시나리오를 E2E로 증명
5. **개밥먹기 보고서**: 패턴 적합성, 마찰점, defineApp API 개선 제안 도출

## Scope

### In Scope

1. **Builder app.ts v5 전환**: 현재 `createWidget` → `createZone` + `bind` 패턴으로 마이그레이션
2. **캔버스 인라인 편집**: F2로 편집 진입, 텍스트 수정, Enter로 저장 / Escape로 취소
3. **패널 양방향 동기화**: 패널에서 수정 → 캔버스 반영, 캔버스에서 수정 → 패널 반영
4. **Spatial navigation**: Arrow 키로 요소 간 2D 이동 (이미 작동, 유지 검증)
5. **Unit 테스트**: `BuilderApp.create()`로 모든 상태 변경 증명
6. **E2E 테스트**: 편집 저장/취소, 양방향 동기화, 다른 블록 편집, 크로스 블록 연속성
7. **개밥먹기 보고서**: 발견한 패턴/마찰/제안

### Out of Scope

- 블록 추가/삭제/정렬 (드래그 & 드롭)
- Undo/Redo
- 이미지 업로드, 미디어 편집
- UI/UX 대폭 변경
- 새 블록 타입 추가
