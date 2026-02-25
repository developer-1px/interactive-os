# 결정 테이블 템플릿 — 9열 파이프라인 계약

> `/red` Step 1에서 생성하는 결정 테이블의 표준 포맷.
> 이 템플릿의 모든 행 1개 = 테스트 `it()` 1개 = 앱 바인딩 1개.

---

## 구조

### 9열 정의

| # | 열 | 채우는 시점 | 역할 |
|---|-----|----------|------|
| 0 | **Zone** | 헤더 | 어떤 Zone (테이블 단위로 분리) |
| **S** | **Status** | 항상 | 구현 상태. 이모지 1자. 아래 Status 규칙 참조 |
| 1 | **Given** | 전체 | 초기 상태. `page.goto()` + 셋업으로 재현 가능해야 함 |
| 2 | **When** | 전체 | 물리적 입력. `page.keyboard.press()` 또는 `page.click()` |
| 3 | **Intent** | 분기①  | OS가 번역한 의도. 같은 When이 다른 의도가 되는 경우를 분리 |
| 4 | **Condition** | 분기② | 같은 Intent에서 갈라지는 App 조건. 빠진 갈래를 여기서 발견 |
| 5 | **Command** | 출력 | 실행되는 커맨드 |
| 6 | **Effect** | 출력 | 부수효과 (dispatch, overlay, toast, scroll 등) |
| 7 | **Then** | 검증 | 기대 상태 변화. `expect()` 대상 |

### Status 이모지 규칙

| 이모지 | 상태 | 전환 조건 |
|--------|------|----------|
| `⬜` | spec | 행 최초 작성 시 기본값. 테스트/구현 없음 |
| `🔴` | fail | `/red` D6 완료. Red 테스트 작성됨, 미구현 |
| `🟢` | pass | `/green` D7 완료. 테스트 통과 |
| `🚧` | wip | 개발 중. 세션 시작 시 표시, 완료 시 `🟢`로 |
| `⚠️` | issue | 알려진 버그. `/issue` 등록됨 |

> **LLM 친화성**: 이모지는 Unicode 문자. tokenizer가 그대로 처리. `🟢`/`🔴`는 training data에서 pass/fail 신호로 수백만 번 등장 — 텍스트 레이블보다 semantic이 더 명확.

### 분기 열의 역할

```
Zone + Given + When → Intent(분기①) → Condition(분기②) → Command + Effect + Then
                      [OS가 결정]       [App이 결정]        [파생 — 자동 결정]
```

- **Intent**: OS 레벨 분기. `isEditing`, `isFieldActive`, `isComposing`이 입력을 다른 의도로 번역.
- **Condition**: App 레벨 분기. `level`, `hasChildren`, `selection`, `isDynamic` 등.
- 이 **2열만이 행 수를 결정**한다. 나머지 열은 행당 정보 밀도를 올릴 뿐.

---

## 작성 순서

### Step A: Zone × When 열거

> "이 앱의 각 Zone에서 사용자가 물리적으로 할 수 있는 모든 입력은?"

```markdown
## Zone: {zone-name} (role: {role})

입력 목록: Enter, Escape, Space, ArrowDown, ArrowUp, Backspace, Delete,
          Meta+C, Meta+X, Meta+V, Meta+D, Meta+Z, Meta+Shift+Z,
          Shift+ArrowDown, Shift+ArrowUp, Meta+ArrowUp, Meta+ArrowDown,
          Home, End, Meta+A, Tab,
          Click, Shift+Click, Meta+Click,
          \, F2, a-z/0-9 (typing entry)
```

### Step B: When별로 Intent 열거 (분기①)

> "같은 입력인데 OS 상태에 따라 다른 의도가 되는 경우는?"

OS 분기 축:
- `isEditing` (편집 중 → field_commit/field_cancel vs activate/dismiss)
- `isFieldActive` (Field이 키를 소유 → field_cursor vs navigate)
- `isComposing` (IME 조합 중 → 대부분 무시)

```markdown
### When: Enter

| Intent | OS 조건 | 언제? |
|--------|--------|------|
| activate | !isEditing | 네비게이팅 중 Enter |
| field_commit | isEditing | 편집 중 Enter |
```

### Step C: Intent별로 Condition 열거 (분기②)

> "같은 의도인데 App 조건에 따라 다른 커맨드가 되는 경우는?"
> **MECE 확인**: 조건들이 전체를 빈틈 없이 커버하는가? 빠진 갈래는 없는가?

```markdown
Intent=activate 아래의 Condition:
- level=section, hasChildren=true  → drillToFirstChild
- level=section, hasChildren=false → drillToFirstChild (grandchild fallback)
- level=group, hasChildren=true    → drillToFirstChild
- level=group, hasChildren=false   → no-op
- level=item                       → startFieldEdit

✅ level 3값 × hasChildren 2값 = 6조합 중 5행. level=item은 hasChildren 무관. MECE.
```

### Step D: 풀 테이블 작성

모든 When에 대해 Step B + C를 채우고, Command / Effect / Then을 기입.

---

## 템플릿

```markdown
# 결정 테이블: {feature-name}

## Zone: {zone-name} (role: {role})

### When: {key}

| # | S | Given | When | Intent | Condition | Command | Effect | Then |
|---|---|-------|------|--------|-----------|---------|--------|------|
| 1 | ⬜ | {초기 상태} | {입력} | {의도} | {App 조건} | {커맨드} | {부수효과} | {기대 결과} |
| 2 | ⬜ | ... | ... | ... | ... | ... | ... | ... |

> MECE: Intent={의도} 아래 Condition {N}개. {축} 전체 커버 확인.

### When: {next-key}
...

## 경계 케이스 🔴

| # | 설명 | 관련 행 |
|---|------|--------|
| 1 | {경계값, 전환 직후, 부정 시나리오} | #{행번호} |

## 합계

| When | Intent 수 | 행 수 |
|------|----------|------|
| Enter | 2 | 6 |
| Escape | 2 | 5 |
| ... | ... | ... |
| **Total** | | **N** |
```

---

## 컷 전략 (조합 폭발 방지)

| 전략 | 원리 | 효과 |
|------|------|------|
| **Zone 분할** | 각 Zone은 독립 테이블 | N Zone = N개 작은 표 |
| **Intent 컷** | OS 조건이 Intent를 결정 → Intent별로 관련 App 조건만 | 72 → 6~10행/입력 |
| **대칭 축약** | ArrowUp = ArrowDown의 역방향 → 한쪽만 쓰고 "대칭" 표기 | ~20% 절감 |
| **no-op 생략** | 해당 입력이 이 Zone에서 무동작이면 행 제외 | 빈 셀 제거 |

---

## 검증 체크리스트

- [ ] Zone별 테이블로 분리되어 있는가?
- [ ] 모든 When(입력)이 열거되어 있는가?
- [ ] 각 When에 대해 Intent가 exhaustive한가? (isEditing 분기 빠뜨리지 않았는가)
- [ ] 각 Intent 아래 Condition이 MECE한가? (빠진 갈래 없는가)
- [ ] 행 수 = 테스트 `it()` 수가 일치하는가?
- [ ] 경계 케이스(🔴)가 식별되어 있는가?
- [ ] 대칭 입력은 명시적으로 표기되어 있는가?
