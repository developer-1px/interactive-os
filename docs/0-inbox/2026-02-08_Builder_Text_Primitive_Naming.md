# Builder Text Primitive 네이밍 검토: Label vs Field vs Text

## 1. 개요 (Overview)

Builder 블록에서 텍스트를 렌더링할 때 사용할 Primitive의 네이밍을 결정해야 한다.

### 핵심 요구사항
- **하나의 컴포넌트**로 Preview(읽기 전용)와 Builder(편집 가능) 두 모드를 지원
- 블록 코드를 두 벌로 만들지 않음
- 컨텍스트에 따라 편집 가능 여부가 결정됨
- 디자인 → 코드 변환 시 개발자가 직관적으로 사용할 수 있어야 함

### 후보
| 후보 | 기본 인상 | HTML 연관 |
|------|----------|----------|
| `Field` | 입력/편집 가능한 곳 | `<input>`, `<textarea>` |
| `Label` | 읽기 전용 텍스트 | `<label for="...">` |
| `Text` | 중립적 텍스트 | `<span>`, `<p>` |

---

## 2. Red Team / Blue Team 분석

---

### 🔴 Red Team: `Field` 반대 논거

**"Field는 편집을 전제한 이름이다"**

1. **시맨틱 부조화**: Preview 모드에서 `<Field>`가 렌더링되지만 편집이 안 된다. `Field`라는 이름이 "여기에 입력하세요"를 암시하는데 실제로는 읽기 전용. 개발자 경험에서 인지 부조화 발생.

2. **남용 문제**: 모든 텍스트를 `Field`로 감싸면, "UPDATED" 배지, "Service Category" 라벨, 날짜 텍스트까지 Field가 됨. Field의 의미가 희석되어 "편집 가능한 곳"과 "그냥 텍스트"의 구분이 사라짐.

3. **개발자 혼동**: React 생태계에서 `Field`는 Formik, React Hook Form 등에서 form input을 의미. 새 개발자가 코드를 볼 때 form과 관련된 컴포넌트로 오해할 수 있음.

4. **readonly 인자 의존**: Field의 문제를 해결하려면 `readonly` prop이 필수가 되고, 대부분의 사용처에서 `readonly`가 붙는다면 이름 자체가 잘못된 것.

---

### 🔵 Blue Team: `Field` 옹호 논거

**"Field는 이미 존재하고, 데이터가 바인딩된 곳이라는 의미다"**

1. **이미 동작하는 코드**: `Field` 컴포넌트가 이미 존재하고 Builder에서 작동 중. 새 primitive를 만드는 비용 대비 context 분기를 추가하는 것이 훨씬 적은 작업.

2. **"Field = 데이터가 사는 곳"**: Field를 "입력 필드"가 아닌 "데이터 필드"로 해석하면 합리적. 데이터베이스의 field, JSON의 field처럼 — 편집 가능 여부와 무관하게 "이 자리에 특정 데이터가 바인딩되어 있다"는 의미.

3. **readonly는 자연스러운 패턴**: `<input readonly>`, `<textarea readonly>` — HTML에서도 Field + readonly는 확립된 패턴.

4. **명시성**: `<Field name="title">`을 보면 "이건 title이라는 데이터에 바인딩된 텍스트구나"가 즉시 전달됨. 빌더에서 편집 가능성이 있다는 힌트로도 기능함.

---

### 🔴 Red Team: `Label` 반대 논거

**"Label은 다른 요소를 설명하는 것이다"**

1. **HTML `<label>` 혼동**: HTML에서 `<label>`은 form control에 연결되는 요소. `<label for="email">이메일</label>`. OS.Label이 이것과 다른 의미라면 개발자가 혼란.

2. **시맨틱 제약**: Label의 본래 의미는 "다른 것을 설명/식별하는 텍스트". 하지만 Builder에서의 제목, 본문, 배지는 독립적인 콘텐츠이지 다른 요소를 설명하는 게 아님. "AI 시대를 위한 가장 완벽한 플랫폼"은 label이 아니라 heading.

3. **편집 가능한 Label?**: Builder 모드에서 `<Label>` 안의 텍스트를 편집할 수 있다는 것은 의미상 매우 이상함. Label은 고정된 식별자여야 하는데 편집 가능하다니?

4. **역할 과부하**: Label이 heading, paragraph, badge, caption 등 모든 텍스트 역할을 맡으면 Label이라는 이름을 쓰는 의미가 없어짐.

---

### 🔵 Blue Team: `Label` 옹호 논거

**"OS Primitive 체계에서 Label은 '표시되는 텍스트'다"**

1. **기본이 읽기**: Label의 기본 인상이 "표시되는 텍스트"이므로, 사용처의 대다수(Preview)와 기본 동작이 일치. 특수한 경우(Builder)에만 편집이 활성화되는 구조에 적합.

2. **OS 체계 독립성**: 이것은 HTML primitive가 아니라 OS primitive. `OS.Zone`이 HTML `<section>`과 다르듯, `OS.Label`도 HTML `<label>`과 다른 개념으로 정의할 수 있음.

3. **자연스러운 마커**: 디자인 변환 시 `<Label>제목</Label>`은 직관적. "이건 텍스트 콘텐츠야"라는 의미가 명확하고, Field보다 편집에 대한 부담이 없음.

4. **Primitive 격상**: Label을 새 Primitive로 격상한다고 이미 결정했으므로, 이 용도에 맞춰 정의하는 것이 체계적.

---

### ⚪ 제3의 선택지: `Text`

**중립적 대안 검토**

| 장점 | 단점 |
|------|------|
| 가장 중립적 — 편집도 읽기도 암시 안 함 | 너무 generic하여 의미 전달력 약함 |
| HTML과 충돌 없음 | React Native의 `<Text>`와 혼동 가능 |
| Figma도 텍스트 요소를 "Text"로 명명 | "편집 가능성이 있다"는 힌트가 전혀 없음 |
| 어디에든 자연스럽게 읽힘 | 기존 네이밍 체계(Zone, Item, Field)와 톤이 다름 |

---

## 3. 판정 매트릭스

| 기준 (가중치) | Field | Label | Text |
|-------------|-------|-------|------|
| Preview에서 자연스러운가 (25%) | ⚠️ 어색 | ✅ 자연스러움 | ✅ 자연스러움 |
| Builder에서 자연스러운가 (25%) | ✅ 자연스러움 | ⚠️ 편집 가능한 Label? | ✅ 자연스러움 |
| 디자인→코드 변환 직관성 (20%) | ⚠️ 모든 텍스트가 Field? | ✅ 텍스트=Label 직관적 | ✅ 텍스트=Text 직관적 |
| 기존 코드 호환 (15%) | ✅ 이미 존재 | ⚠️ 신규 구현 필요 | ⚠️ 신규 구현 필요 |
| 시맨틱 정확성 (15%) | ⚠️ form input 연상 | ⚠️ HTML label 혼동 | ✅ 충돌 없음 |

---

## 4. 결론 (Conclusion)

### 세 후보 모두 결정적 우위가 없다

- **`Field`**: Builder 관점에서는 맞지만, Preview에서 부자연스럽고 모든 텍스트를 Field로 만들면 의미 희석
- **`Label`**: Preview 관점에서는 맞지만, "편집 가능한 Label"이 시맨틱으로 모순
- **`Text`**: 가장 중립적이지만 "편집 가능성 힌트"가 전혀 없음

### 추가 고려 방향

> **"이름이 아니라 계층 설계의 문제일 수 있다"**

한 가지 다른 프레이밍: **마커와 동작을 분리**하는 것.

```tsx
// 마커: "이 텍스트는 데이터에 바인딩됨"
<OS.Text name="title" as="h1">{title}</OS.Text>

// 동작: Builder context가 OS.Text를 편집 가능하게 만듦
// Preview context에서는 OS.Text가 순수 렌더링
```

`OS.Text`라면:
- Preview: "텍스트" → ✅ 자연스러움
- Builder: "편집 가능한 텍스트" → ✅ 자연스러움
- `name` prop이 데이터 바인딩 힌트 역할
- OS 체계와 톤 일치: Zone / Item / Text

이 경우 `Field`는 실제 form input (검색창, 로그인 폼 등)에만 사용하고, `Text`는 컨텐츠 텍스트에 사용하는 깔끔한 분리가 가능.
