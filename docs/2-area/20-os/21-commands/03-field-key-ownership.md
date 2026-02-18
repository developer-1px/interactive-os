# Field Key Ownership — 키보드 소유권 위임 모델

> Area: 20-os/21-commands
> Source: src/os/1-listeners/KeyboardListener.tsx, src/os/keymaps/fieldKeyOwnership.ts
> Last synced: 2026-02-18
> Origin: 4-archive/2026-02/field-key-ownership (프로젝트 완료 후 환류)

## 개요

편집 중 필드(contentEditable)가 기본적으로 모든 키를 소유한다.
필요한 navigation 키만 OS에 **위임(delegate)**한다.

```
이전: "편집 중이면 OS가 물러난다" (consumption — OS가 opt-in)
현재: "편집 중 필드가 기본 소유. 명시적으로 OS에 위임한 키만 OS가 처리" (delegation — allowlist)
```

## 필드 유형 (4 MECE Presets)

| 유형 | 예시 | ↑↓ | Tab | Bksp∅ |
|------|------|----|-----|-------|
| **`inline`** | 검색바, Draft, 이름변경 | OS | OS | Field |
| **`tokens`** | 칩/태그 입력 | OS | OS | OS |
| **`block`** | 댓글, 설명 | Field | OS | Field |
| **`editor`** | 코드 에디터 | Field | Field | Field |

## 완전 소유권 매트릭스

| 키 | `inline` | `tokens` | `block` | `editor` |
|----|----------|----------|---------|----------|
| 문자, Space | Field | Field | Field | Field |
| ArrowLeft/Right | Field | Field | Field | Field |
| ArrowUp/Down | **OS** | **OS** | Field | Field |
| Home/End | Field | Field | Field | Field |
| Tab/Shift+Tab | **OS** | **OS** | **OS** | Field |
| Backspace (빈 필드) | Field | **OS** | Field | Field |
| Backspace (내용 있음) | Field | Field | Field | Field |
| Enter | OS (commit) | OS (commit) | Field (newline) | Field |
| Escape | OS (cancel) | OS (cancel) | OS (cancel) | OS (cancel) |
| Meta+Z/Shift+Z | Native | Native | Native | Native |
| Meta+A/C/X/V | Native | Native | Native | Native |

## 구현

| 파일 | 역할 |
|------|------|
| `src/os/keymaps/fieldKeyOwnership.ts` | `FIELD_DELEGATES_TO_OS` — 프리셋별 OS 위임 키 allowlist |
| `src/os/1-listeners/KeyboardListener.tsx` | `resolveIsEditingForKey()` — per-key 위임 판단 |
| `src/os/registries/FieldRegistry.ts` | `FieldConfig.fieldType` — 기본값: `"inline"` |

## 설계 결정 (ADR)

### Delegation > Consumption
위임 모델이 소비 모델보다 우수한 이유:
- **문자 입력 안전성**: Space, 숫자 등은 절대 OS navigation에 잡히지 않음
- **명시적 allowlist**: OS에 넘길 키만 나열 → 의도 명확
- **기본값 안전**: 새 키 추가 시 필드가 기본 소유 → 예기치 않은 키 삼킴 방지

### 참조
- W3C APG: Tab은 항상 컨트롤 간 이동
- W3C APG: ArrowUp/Down은 multi-line에서 커서, single-line에서 컨트롤
- macOS/Windows: 네이티브 OS도 동일 패턴
