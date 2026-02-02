# 분석: 키바인딩, 왜 JSON이 아니라 TypeScript인가?

## 1. 질문의 핵심
User 님의 제안:
> *"정말 설정만 따로 JSON으로 완전히 독립적으로 분리하고 오버라이드를 시킬 수도 있잖아?"*
> *"AI가 코딩할 때도 그게 낫지 않아?"*

매우 합리적인 지적입니다. 실제로 **VS Code**는 기본 키바인딩은 코드(TypeScript)에 있고, 사용자 설정은 `keybindings.json`으로 완전히 분리하여 오버라이드합니다.

## 2. 왜 지금은 TypeScript(`todo_keys.ts`)를 쓰는가?

저희가 JSON 대신 **TypeScript 파일(`Code-as-Config`)**을 선택한 이유는 역설적으로 **"AI와 개발자를 위해서"**입니다.

### A. Type Safety (타입 안전성) = AI의 가이드레일
AI는 코드를 작성할 때 실수를 합니다.
- **JSON 방식**:
  ```json
  { "key": "Enter", "command": "ADD_TDOO" } // 오타! 하지만 JSON은 모름.
  ```
  AI나 사람이 `ADD_TODO`를 `ADD_TDOO`로 적어도, 실행해보기 전까진 에러를 잡을 수 없습니다.

- **TypeScript 방식**:
  ```typescript
  export const TODO_KEYMAP: KeybindingItem[] = [
      { key: 'Enter', command: 'ADD_TODO' } // 컴파일 에러! "ADD_TODO"만이 유효함.
  ]
  ```
  `command` 필드가 Union Type(`'ADD_TODO' | 'DELETE_TODO' ...`)으로 정의되어 있으므로, AI가 오타를 내면 **즉시 빨간 밑줄(Linter/Compiler)**이 그어집니다. 이는 AI가 스스로 오류를 수정할 수 있는 **강력한 힌트**가 됩니다.

### B. Expression Power (표현력)
JSON은 데이터 포맷이므로 함수나 빌더 패턴을 쓸 수 없습니다.
- **JSON**: `"when": "activeZone == 'sidebar' && !isEditing"` (문자열 파싱 필요, 오타 검증 불가)
- **TS**: `when: Rule.and(Zones.Sidebar, Expect('isEditing').toBe(false))` (컴파일 타임 검증 가능)

AI 입장에서도 단순 문자열보다는, 구조화된 함수 호출(Builder Pattern)이 문맥을 이해하고 생성하기에 더 명확할 때가 많습니다.

## 3. 이상적인 하이브리드 모델 (VS Code 방식)
User 님이 말씀하신 구조가 사실 **가장 완성된 형태**입니다.

1.  **System Defaults (TypeScript)**:
    - 개발자가 정의.
    - 타입 체크와 빌드 타임 검증이 중요.
    - `src/lib/todo_keys.ts` (현재 구현)

2.  **User Overrides (JSON)**:
    - 런타임에 사용자가 수정.
    - 타입 체크 불가능(혹은 Schema Validation 필요).
    - `user_settings.json` (향후 구현 과제)

## 4. 결론
> **"기본값은 튼튼하게(TS), 사용자 설정은 유연하게(JSON)"**

지금 단계에서 `todo_keys.ts`를 TS로 유지하는 것은 **시스템의 무결성(Integrity)**을 지키기 위함입니다. 특히 AI가 코드를 생성/수정할 때, TypeScript 컴파일러가 "너 커맨드 ID 틀렸어"라고 알려주는 것은 매우 소중한 안전장치입니다.

만약 나중에 "사용자 커스텀 키바인딩" 기능을 넣는다면, 그때는 User 님 말씀대로 **JSON 설정 파일 로더**를 추가하여 기존 TS 설정을 오버라이드하도록 구현하는 것이 정석입니다.
