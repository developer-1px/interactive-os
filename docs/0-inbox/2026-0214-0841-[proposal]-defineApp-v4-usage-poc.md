# defineApp v4 — Usage-Only PoC (전체 DX 확인용)

| 항목 | 내용 |
|------|------|
| 원문 | poc 1개만 더. 그러면 구현하지 말고 usage만 보여줘 내가 확인해보게 |
| 내(AI)가 추정한 의도 | 4-tier API의 개발자 경험(DX)을 직접 눈으로 확인한 뒤 채택/폐기를 판단하겠다 |
| 일자 | 2026-02-14 |
| 상태 | 🔍 사용자 확인 대기 |

---

## 1. 개요

`defineApp-v4.ts`의 구현을 재사용하되, **usage만으로 전체 DX를 확인**할 수 있는 PoC 파일을 작성했다.

- 📄 **파일**: `src/os/poc/usage-v4-full.ts`
- ✅ **tsc --strict**: 0 errors

## 2. 커버하는 시나리오

| 시나리오 | 도메인 | 검증 포인트 |
|----------|--------|-------------|
| A. 복수 Zone | Todo | 5개 Zone(`list`, `sidebar`, `draft`, `edit`, `toolbar`) 정의 |
| B. Zone 이벤트 풀바인딩 | Todo list | `onCheck`, `onAction`, `onDelete`, `onCopy`, `onCut`, `onPaste`, `onMoveUp/Down`, `onUndo/Redo` |
| C. Field 바인딩 | Todo draft/edit | `onChange`, `onSubmit`, `onCancel` |
| D. Flat KV 도메인 | Builder | 단일 Zone, `updateField`, `selectElement` |
| E. setState escape | Builder | `builderUpdateField` — 커맨드 파이프라인 외 직접 상태 변경 |
| F. 테스트 dispatch | 양쪽 | `app.dispatch(command(payload))` Redux 패턴 |
| G. React 렌더링 | 양쪽 | `useComputed`, Zone/Item/Field JSX (주석) |
| H. v3 vs v4 비교표 | — | ASCII 테이블로 제거된 boilerplate 시각화 |

## 3. 핵심 DX 차이 (제거된 것)

```
❌ (ctx: { state: AppState }) → ctx 타입 자동 추론
❌ [] deps 배열 → 제거
❌ curried (ctx) => (payload) => → flat (ctx, payload) =>
❌ commands: { ... } 반환 → define 시 자동 수집
❌ (define) => { ... } 콜백 래퍼 → 모듈 레벨 선언
```

## 4. 해법 유형

🟡 **Constrained** — 4-tier 구조는 결정됐지만, production 구현 시 해결할 gap이 있다:
- `as unknown as` 타입 캐스팅 (인프라 내부)
- `TestInstance.dispatch`의 handler 연결
- `deps`(context injection) 제거의 향후 확장 경로

## 5. 인식 한계

- 이 분석은 **타입 체킹**과 **코드 형태**에 기반한다. 런타임 동작은 검증되지 않았다.
- React 렌더링 코드는 주석 처리됨 — JSX의 실제 prop 전달은 미검증.
- `produce` (immer) 통합은 작동하지만, handler 내부의 state 변경이 실제 kernel에 반영되는지는 미검증.

## 6. 열린 질문

1. 이 usage가 DX로 만족스러운가? 불편하거나 어색한 부분은?
2. `createZone` → `bind` 분리가 자연스러운가, 아니면 하나로 합치고 싶은가?
3. `toolbarZone`처럼 Zone 이벤트 없이 keybindings만 쓰는 경우의 API는?
4. 채택 시 `/project`로 전환할까?

---

> **한줄요약**: Todo(5 Zone, 풀바인딩) + Builder(Flat KV)를 커버하는 usage-only PoC가 `tsc --strict` 통과 — 사용자 DX 확인 대기 중.
