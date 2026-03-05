# /divide — Builder Paste ID Collision

> **날짜**: 2026-02-20 00:53  
> **상태**: 분석 완료, 실행 판단 대기

## 문제 정의

섹션을 paste하면 사이드바에서 복사된 개체를 클릭했을 때 `aria-current`, `data-focus`가 **원본과 복사본에 동시에** 적용된다.

## 근본 원인

4개의 NCP 블록 컴포넌트가 내부 item/field의 DOM ID를 **하드코딩**하고 있다. `id` prop은 `Builder.Section`의 최상위 DOM ID에만 쓰이고, 그 아래 모든 `Builder.Item`, `Builder.Group`, `Builder.Icon`, `Field` 등은 **고정 문자열 ID**를 사용한다.

예: Hero 섹션을 paste하면:
- 원본: `<Builder.Item id="ncp-hero-title">` (DOM id = "ncp-hero-title")
- 복사본: `<Builder.Item id="ncp-hero-title">` (DOM id = "ncp-hero-title") ← **충돌!**

Focus 시스템은 `document.getElementById(focusId)`로 요소를 찾으므로, 같은 ID가 2개 이상 있으면 항상 첫 번째만 선택되고, `aria-current`/`data-focus` 동기화가 깨진다.

## 분해 결과

### 파일별 영향도 (4개 NCP 블록)

| 파일 | 하드코딩 ID 수 | 도메인 |
|------|--------------|--------|
| `NCPHeroBlock.tsx` | ~15 (hero-*, nav-*) | **Complicated** |
| `NCPNewsBlock.tsx` | ~15 (card-*, ncp-news-*) | Clear |
| `NCPServicesBlock.tsx` | ~15 (service-*, tab-*, ncp-services-*) | Clear |
| `NCPFooterBlock.tsx` | ~20 (footer-*) | Clear |

### 해법: `id` prop을 prefix로 사용

**원칙**: 모든 block 내부 ID가 `{sectionId}-{localId}` 형식이어야 한다.

```
현재 (하드코딩)
  NCPHeroBlock({ id: "ncp-hero" })
    → Builder.Item id="ncp-hero-title"     // 하드코딩
    → Builder.Item id="ncp-hero-cta"       // 하드코딩

수정 후 (id prefix)
  NCPHeroBlock({ id: "abc123" })         // paste된 섹션
    → Builder.Item id="abc123-title"      // id prop 기반
    → Builder.Item id="abc123-cta"        // id prop 기반
```

### 구현 패턴

각 블록에 `fid` 헬퍼를 추가:

```tsx
function NCPHeroBlock({ id }: { id: string }) {
  const fid = (localId: string) => `${id}-${localId}`;
  
  // 기존: id="ncp-hero-title"
  // 수정: id={fid("title")}
  
  // Field name도 동일하게:
  // 기존: name="ncp-hero-title", useField("ncp-hero-title")
  // 수정: name={fid("title")}, useField(fid("title"))
}
```

### INITIAL_STATE field key도 일관성 있게

이미 이전 수정에서 item-level field key를 `ncp-news-item-*`, `ncp-services-item-*`로 변경했음. 이 패턴을 유지하되, `fid()` 도입 시 local part만 변경:

```
INITIAL_STATE key:  "ncp-hero-title"
fid("title"):      "ncp-hero" + "-" + "title" = "ncp-hero-title" ✅ (동일)
paste 시:           "abc123" + "-" + "title" = "abc123-title"     ✅ (충돌 없음)
```

### 도메인별 실행 판단

| 항목 | 도메인 | 이유 | 판단 |
|------|--------|------|------|
| `fid()` 헬퍼 도입 | **Clear** | 기계적 치환. `id` prop → prefix. | 즉시 실행 |
| Field name → `fid()` | **Clear** | Field key는 이미 sectionId-prefix 규칙. | 즉시 실행 |
| `useField(key)` → `useField(fid(key))` | **Clear** | 동일한 치환. | 즉시 실행 |
| `createFieldCommit` → fid 기반 | **Clear** | 동일한 치환. | 즉시 실행 |
| INITIAL_STATE key 호환성 | **Complicated** | 기존 키와 새 키가 달라지는 부분 확인 필요 | 분석 후 실행 |
| Footer의 `footer-*` prefix | **Complicated** | section id가 `ncp-footer`인데 field key는 `footer-*`로 시작 — 불일치 | 트레이드오프 기록 |

### Footer 특이 사항

Footer block의 field key가 `footer-brand`, `footer-desc` 등 `ncp-footer-` prefix가 아닌 `footer-` prefix를 사용한다. `pasteSection`의 `key.startsWith(oldId + "-")` 로직에서 `oldId = "ncp-footer"`이므로 `ncp-footer-` prefix를 찾는데, 실제 key는 `footer-brand`라서 **복사가 안 됨**. 

→ Footer의 field key도 `ncp-footer-brand`, `ncp-footer-desc`로 변경 필요.

## 남은 작업

1. **[Clear] 4개 블록에 `fid()` 도입** — 모든 내부 ID를 `${id}-${localId}`로
2. **[Clear] INITIAL_STATE key 정합성** — Hero: 이미 OK (`ncp-hero-*`), Footer: 수정 필요 (`footer-*` → `ncp-footer-*`)
3. **[Clear] `useField` / `createFieldCommit` 호출부 변경** — `fid()` 사용

## 결론

전부 **Clear** 도메인이다. 기계적 치환이며 단위 테스트로 증명 가능.  
4개 블록 × ~15 ID = ~60곳 수정이지만 패턴은 동일하다.
