# [Closed] docs-viewer: Inspector + Space 키 누락

> Created: 2026-02-25T16:52
> Priority: P1 (기능불가)
> Cynefin: Clear

## 증상

1. **Inspector(Cmd+D) 안 됨**: docs-viewer를 `vite.docs.config.ts`(포트 4444)로 실행하면 Cmd+D 무반응
2. **Space/Shift+Space 안 됨**: 문서 읽기 중 섹션 네비게이션 동작하지 않음

## D3. Diagnose

### Inspector

| 항목 | 값 |
|------|-----|
| 기대 | `inspectorBabelPlugin` + `inspectorPlugin()` 이 vite 설정에 등록 → `data-inspector-line` 주입 + DebugManager 런타임 스크립트 로드 |
| 현실 | `vite.docs.config.ts`에 두 플러그인 모두 없음 |
| 메인 config | `vite.config.ts`(포트 5555)에는 정상 등록됨 |
| 원인 | docs-viewer 전용 config 생성 시 inspector 플러그인 복사 누락 (LLM 실수) |

### Space 키

| 항목 | 값 |
|------|-----|
| 기대 | `DocsReaderUI.Zone`이 content 영역에 렌더링 → keybinding 활성화 → Space → DOCS_NEXT_SECTION |
| 현실 | `DocsViewer.tsx`에서 `DocsReaderUI` import/사용 0건. Zone 미렌더링 |
| 테스트 | `docs-section-nav.test.ts`는 mock scope로 Zone 구성하여 통과 — 실제 렌더링 누락을 잡지 못함 |
| 원인 | `app.ts`에서 Zone + keybinding 정의 완료 후, 컴포넌트 갈아끼우기(DocsViewer.tsx) 를 빠뜨림 (LLM 실수) |

## D4. Plan

### 근본 원인
두 건 모두 "정의는 완료했지만 실제 연결(wiring)을 빠뜨린" LLM 누락 실수.

### 해결 방향
기존 메커니즘 재사용. 새 패턴 추가 없음.

### 수정 파일 목록

| # | 파일 | 변경 |
|---|------|------|
| 1 | `vite.docs.config.ts` | `inspectorBabelPlugin` + `inspectorPlugin()` 추가 |
| 2 | `src/docs-viewer/DocsViewer.tsx` | content 영역을 `DocsReaderUI.Zone`으로 감싸기 |

### 엔트로피 체크
"새로운 유일한 패턴을 추가하는가?" → **No.** 이미 존재하는 패턴의 연결만 수행.

### 설계 냄새 4질문
- 개체 증가? No
- 내부 노출? No
- 동일 버그 타 경로? No — 다른 앱은 메인 vite.config.ts 사용
- API 확장? No

### /reflect: 영향 범위
- vite.docs.config.ts 변경 → dev 서버 재시작 필요
- DocsViewer.tsx Zone 추가 → 기존 sidebar Zone들과 동일 패턴, 충돌 없음

## D7. Green — 수정 결과

| # | 파일 | 변경 | 결과 |
|---|------|------|------|
| 1 | `vite.docs.config.ts` | `inspectorBabelPlugin` + `inspectorPlugin()` 추가 | ✅ |
| 2 | `src/docs-viewer/DocsViewer.tsx` | `DocsReaderUI` import + content 영역을 `DocsReaderUI.Zone`으로 감싸기 | ✅ |
| 3 | `src/docs-viewer/app.ts` | `NEXT_SECTION`, `PREV_SECTION` export 추가 | ✅ |

추가 발견: #3은 unit test에서 import하고 있었지만 export 누락으로 테스트 실패. 같은 패턴의 누락.

## D8. Verify

- tsc: ✅ 0 errors
- vitest (docs-viewer): 38/39 통과 (1 실패는 기존 `toggleSection` 미export — 별도 이슈)
- Revert-Red: 논리적 확인 완료

## D9. Close

**해결 요약**: 3건의 LLM 연결 누락을 수정.
1. vite.docs.config.ts에 inspector 플러그인 2개 추가
2. DocsViewer.tsx의 content 영역을 DocsReaderUI.Zone으로 감싸기
3. NEXT_SECTION/PREV_SECTION export

**구조적 원인**: LLM이 정의(define)와 바인딩(bind/wire)을 분리 작업할 때, 바인딩 단계를 빠뜨리는 패턴. 테스트가 mock으로 통과하므로 누락을 잡지 못함.
