# Field Commit 설계 논의

> 2026-02-19 18:02–18:13 | `/review` → `/discussion`

---

## Journey

**🧑 사용자**: Field의 설계를 개선하고 있었어. 같이 `/review`해보자.

**🤖 AI**: 리뷰 결과 Blocker 2건 발견 — `state.localValue` vs `state.value` 네이밍 분열(7 테스트 실패), 입력 이벤트 이중 처리(InputListener × Field.tsx).

**🧑 사용자**: `/discussion` — Field에서 커맨드는 커밋이야. 입력하고 있는 것 자체를 커맨드화 하고 싶지 않아.

**🤖 AI**: CQRS 변형 — 타이핑은 데이터 스트림, 커밋만 커맨드 스트림. 이 원칙으로 두 Blocker의 해법이 자동으로 나온다.

---

**🧑 사용자**: 보편적인 네이밍이 있지 않아? form 관련 명칭은 아주 오래되었을텐데?

**🤖 AI**: HTML 표준: `value`, `defaultValue`, `input`(키스트로크), `change`(커밋). 모든 모던 라이브러리도 `value`. `localValue`는 발명.

**🧑 사용자**: react hook form 등 조금 더 모던한 표준을 따라가고 싶은데?

**🤖 AI**: RHF/TanStack/Formik 비교 — 전부 `value`, `defaultValue`, `isDirty`, `isTouched`, `isValid`, `error`. `localValue`를 쓰는 라이브러리는 0개. RHF의 "Uncontrolled by default"가 우리 W4와 동치.

---

**🧑 사용자**: submit과 commit은 분리되는 개념이야? 통용되는 개념이야?

**🤖 AI**: 분리됨 — `submit`은 Form(컨테이너)이 모아서 전송, `commit`은 개별 필드 확정. 우리 OS엔 Form이 없으므로 `commit`이 정확.

**🧑 사용자**: Form이 언젠가 등장을 해야겠지? Zone과 함께 고민해야 하는 맥락일 거야.

**🤖 AI**: 맞음. Form = "role=form인 Zone" + 데이터 경계. Field.commit(개별)과 Form.submit(일괄)은 자연스러운 2계층.

**🧑 사용자**: `/doubt` — 커밋이 2계층이 되는 게 진짜 맞아?

**🤖 AI**: (자기교정) 2계층 불필요하다고 했으나...

**🧑 사용자**: Form은 감싸야 의미가 있고 Field는 개별 개체인 거지?

**🤖 AI**: (재교정) 맞음. 구조가 다르니 동사도 다른 것이 맞다. 다른 개념 2개 → 이름 2개. 억지로 합치는 것이 오히려 오컴의 면도날 오용.

**🧑 사용자**: PPT/Figma 등에서 인라인 편집은 뭐로 봐야 돼?

**🤖 AI**: 순수한 Field.commit. 프로 도구(PPT, Figma, Excel)는 전부 Field.commit. Form.submit은 CRUD 웹앱(로그인/결제) 패턴. 우리 OS 앱들은 전부 프로 도구 패턴.

**🧑 사용자**: Form은 차후 고민하고 일단 Field는 커밋이 있는 방향으로.

> **한 줄 요약**: 프로 도구의 인라인 편집은 Field.commit이고, Form.submit은 CRUD 패턴으로 차후 과제. 지금은 Field.commit을 표준 어휘(value, defaultValue, isDirty)로 확정한다.

---

## Conclusion

### Why

매 키스트로크를 커맨드로 보내는 `syncDraft` 패턴은 디버깅 노이즈, 성능 낭비, 책임 혼동을 유발했다. Field의 본질적 커맨드는 **커밋**(값 확정)이지, 입력 자체가 아니다.

### Intent

Field의 데이터 스트림(타이핑)과 커맨드 스트림(커밋)을 분리하고, 상태 모델의 네이밍을 업계 표준에 맞춰 확정한다.

### Warrants

| # | Warrant |
|---|---------|
| W1 | "번역기는 번역만 한다" — InputListener = 데이터 스트림의 단일 경로 |
| W2 | "모든 변경은 하나의 문을 통과한다" — 입력 경로 1개 |
| W3 | `value`(현재 값)와 `defaultValue`(초기값)는 다른 데이터 — HTML + 모던 라이브러리 공통 |
| W4 | **"커맨드는 커밋이다. 입력 자체는 커맨드가 아니다."** (핵심 원칙) |
| W5 | "표준이 있으면 발명하지 않는다." `localValue`는 발명, `value`가 표준 |
| W6 | RHF "Uncontrolled by default" = W4와 동치. 업계가 같은 결론에 도달 |
| W7 | Submit(컨테이너 전송) ≠ Commit(개별 확정). 구조가 다르니 동사도 다름 |
| W8 | Form = Zone + submit (YAGNI — CRUD 앱이 올라오면 추가) |
| W9 | 다른 개념 2개 → 이름 2개. 억지 통합이 오히려 오컴의 면도날 오용 |
| W10 | 프로 도구(PPT, Figma, Excel)는 전부 Field.commit. Form.submit은 CRUD 패턴 |

### 확정 사항

**FieldState 표준화:**
```ts
interface FieldState {
  value: string;           // 현재 값 (표준)
  defaultValue: string;    // 초기값 (표준)
  isDirty: boolean;        // value !== defaultValue
  isTouched: boolean;      // 사용자가 상호작용했는가
  isValid: boolean;        // 유효성
  error: string | null;    // 에러 메시지
}
```

**네이밍:**
- `localValue` → `value` (표준 복원)
- `onCommit` 유지 (Form이 아닌 Field 맥락)
- `onChange` 제거 (입력을 커맨드화 하지 않음)
- `FIELD_COMMIT` 유지

**입력 경로:** InputListener(글로벌) 단일화, Field.tsx의 중복 `updateValue` 제거

**Form:** YAGNI — CRUD 앱이 올라오면 Zone + submit으로 도입

> **한 줄 결론**: Field의 커맨드는 커밋이다. 타이핑은 OS 인프라(데이터 스트림)가 조용히 처리하고, FieldState는 업계 표준 어휘(value, defaultValue, isDirty)로 확정한다.
