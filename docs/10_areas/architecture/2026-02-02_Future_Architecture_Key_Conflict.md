# 미래 아키텍처: Key Conflict Resolution & Layered Settings

## 1. 현재의 한계와 해결책: Key Conflict
User 님의 질문: *"키 충돌은 어떻게 해소할 건데?"*

### 현황 (Implicit Priority)
현재 `todo_keys.ts`에 정의된 순서 혹은 `Map` 세팅 순서에 따라 **"Last Writer Wins"** (나중에 정의된 게 덮어씀) 또는 **"First Match"**가 적용됩니다. 이는 개발자의 주의력에 의존하는 방식입니다.

### 미래 해결책: 가중치 기반 매칭 (Weighted Matcher)
VS Code와 유사한 **"가중치(Weight) 시스템"**을 도입해야 합니다.

1.  **Context Weight**: 조건(`when`)이 구체적일수록 높은 점수를 점수.
    - `when: true` (Global) -> **1점**
    - `when: focus == 'editor'` -> **10점**
    - `when: focus == 'editor' && lang == 'ts'` -> **100점**
2.  **User Priority**: 시스템 기본값보다 사용자 설정이 우선.
    - System Default -> **Base Priority**
    - User Override -> **High Priority**

**실행 로직:**
```typescript
// 충돌 시 로직
const candidates = keybindings.filter(k => k.key === 'Enter' && eval(k.when));
const winner = candidates.sort((a, b) => b.weight - a.weight)[0];
dispatch(winner.command);
```

## 2. 향후 아키텍처 로드맵 (The "Layered Onion")

User 님의 질문: *"앞으로 어떤 아키텍처를 가져갈 건데?"*

저희가 지향하는 최종 아키텍처는 **"3-Tier Layered Configuration"**입니다. 로직 코드(TS)는 엔진 역할을 하고, 설정(JSON)이 이를 감싸는 구조입니다.

### Tier 1: System Core (Code-as-Config)
- **Role**: 개발자가 정의하는 불변의 기본값.
- **Format**: TypeScript (`todo_keys.ts`)
- **Reason**: AI와 개발자에게 Type Safety 제공, 컴파일 타임 검증.

### Tier 2: Workspace/Extension (File Config)
- **Role**: 프로젝트별 설정이나 플러그인.
- **Format**: `.vscode/settings.json` (유사)
- **Reason**: 협업 팀 간의 약속 공유.

### Tier 3: User Settings (Runtime Config)
- **Role**: 최종 사용자의 커스터마이징.
- **Format**: `User/keybindings.json`
- **Reason**: 사용자의 손맛 존중. 가장 높은 우선순위.

## 3. 실행 계획
현재까지 완료된 **Phase 3**는 **Tier 1 (System Core)**를 탄탄하게 다지는 작업이었습니다.
다음 단계(Next Phase)는 다음과 같습니다.

1.  **Config Service 구현**: `todo_keys.ts` 뿐만 아니라 외부 JSON 파일을 읽어와 병합(Merge)하는 서비스 레이어 구축.
2.  **Context Key Engine**: 단순 문자열 비교를 넘어, `context.matches('a && b')`를 고속으로 계산하는 전용 엔진 도입.
3.  **Conflict Inspector**: 현재처럼 충돌을 숨기는 게 아니라, UI 상에서 "이 키는 A와 B가 충돌 중입니다"라고 보여주는 진단 도구 개발.

이것이 **"AI-Native하면서도 User-Friendly한"** 차세대 인터랙티브 OS의 청사진입니다.
