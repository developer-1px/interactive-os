# Product Vision — Interactive OS

> 웹 앱에 운영체제의 질서를 부여하는 인프라 레이어.

## Vision

**앱은 의도를 선언하고, OS가 실행을 보장한다.**
포커스, 네비게이션, 접근성, 클립보드 — 개별 앱이 각자 구현하는 게 아니라, OS가 보장한다.

## Target Group

- **Primary**: Interactive OS 위에 앱을 만드는 개발자
  - defineApp + bind만으로 접근성과 키보드 인터랙션이 자동으로 따라오는 환경을 원하는 사람

- **Secondary**: 접근성과 키보드 인터랙션을 체계적으로 구현하고 싶은 웹 개발자
  - WAI-ARIA 패턴을 직접 구현하는 대신 OS가 해결해주길 원하는 사람

## Needs

1. **포커스 관리** — Zone 기반 포커스 스코프, 자동 복원, 계층 전환
2. **키보드 네비게이션** — 1D(리스트), 2D(그리드), spatial, corner 모드 자동 제공
3. **접근성** — ARIA role, state, property 자동 주입. 앱은 role만 선언
4. **클립보드** — 구조적 복사/붙여넣기. OS가 중재
5. **인라인 편집** — Field 컴포넌트 기반. Enter/Escape/F2 패턴 통일
6. **앱 정의** — defineApp + createZone + bind로 앱을 선언적으로 구축
7. **관찰 가능** — 모든 상태 변경, 커맨드 실행이 Inspector에서 추적 가능

## Product

### ZIFT 모델

| Primitive | 역할 |
|-----------|------|
| **Zone** | 포커스 스코프. role(listbox, grid, tree, toolbar, textbox)에 따라 동작이 달라짐 |
| **Item** | Zone 안의 개별 요소. 포커스, 선택, 활성화의 단위 |
| **Field** | 편집 가능한 텍스트 영역. contentEditable + commit/cancel 프로토콜 |
| **Trigger** | 클릭/Enter로 커맨드를 실행하는 버튼/체크박스 |

### 5-Phase 파이프라인

```
Input → Signal → Command → State → View
  1-listeners  →  keymaps  →  3-commands  →  kernel  →  6-components
```

### defineApp 앱 구축 API

```
defineApp(name, initialState, options)
  ├── createZone(name) → zone.command() + zone.bind()
  ├── condition(name, predicate) → When Guard
  ├── selector(name, fn) → 파생 데이터
  ├── createTrigger(command) → 선언적 UI 바인딩
  └── useComputed(selector) → React 구독
```

### Collection Zone Facade

```
createCollectionZone(app, zoneName, config)
  → add, remove, duplicate, moveUp, moveDown, copy, cut, paste
  → collectionBindings() → keybindings 자동 연결
```

## Business Goals

1. **접근성은 기능이 아니라 인프라** — 앱이 "추가"하는 것이 아니라 OS가 "보장"하는 것
2. **학습 비용 0** — 이전 앱에서 배운 패턴이 다음 앱에서도 동일하게 동작
3. **플랫폼** — 하나의 앱이 아니라, 어떤 앱이든 이 OS 위에서 동작
4. **자기 증명** — 이 OS 위에서 이 OS를 만든다. 구축이 곧 증명

## Non-Goals

- ❌ 브라우저 OS 에뮬레이션 (윈도우 매니저, 파일 시스템 등)
- ❌ 범용 UI 컴포넌트 라이브러리 (Radix, shadcn 대체)
- ❌ 서버 사이드 프레임워크
- ❌ 모바일 네이티브 지원

## Now / Next / Later

### 🔴 Now — 코어 안정화

- defineQuery 실전 적용
- Focus 이중 경로 통합 (4-effects vs Component)
- Collection Zone v2 facade

### 🟡 Next — 패턴 확장

- Dialog/Modal 패턴 (focus trap, return focus)
- Drag & Drop (키보드 기반)
- Combobox/Autocomplete 패턴
- 멀티 앱 라우팅

### 🔵 Later — 생태계

- 문서 사이트 (showcase + API reference)
- 써드파티 앱 SDK
- 플러그인 시스템
- 퍼포먼스 벤치마크 자동화

---

_Format: [Product Vision Board](https://www.romanpichler.com/tools/product-vision-board/) (Roman Pichler) + [Now/Next/Later Roadmap](https://www.prodpad.com/blog/invented-now-next-later-roadmap/) (Janna Bastow)_
