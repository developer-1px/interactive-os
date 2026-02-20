# Discussion: 블록 추가 UI + 프리셋 시스템

> 2026-02-21 02:47 ~ 02:50

## Journey

**🧑 사용자**: 이게 빌더에 뭘 갖춰야 할까 내가 놓친거?

**🤖 AI**: 현재 빌더는 편집/탐색이 탄탄하지만, "생성" 경로가 없다. 10가지 후보 제시 → "블록 추가 UI"와 "템플릿"이 핵심 결핍.

---

**🧑 사용자**: 블록추가네 템플릿이랑

**🤖 AI**: 3가지 UI 방식(사이드바 버튼 / 캔버스 인라인 / 커맨드 팔레트) 분석. 기존 `paste + deepClone` 파이프라인 재사용 가능. `Block` 자체가 템플릿 = 새 개념 0개.

---

**🧑 사용자**: 프리셋도 필요해 미리 갖춰진

**🤖 AI**: 2-레벨 확정: Page Preset (`Block[]`) + Block Preset (`Block`). `INITIAL_STATE.data.blocks`가 이미 첫 번째 Page Preset.

---

**한 줄 요약**: Block이 곧 템플릿이다 — Page Preset = Block[], Block Preset = Block, 기존 paste+deepClone으로 삽입.

---

## Conclusion

### Why
빌더가 "편집"은 되지만 "생성"이 안 된다. 새 블록을 추가하거나, 빈 캔버스에서 페이지를 시작할 방법이 없다.

### Intent
블록 추가 UI + 2-레벨 프리셋 시스템으로 "생성" 경로를 완성한다.

### Warrants
- W1. 편집/탐색은 탄탄하지만 "생성" 경로가 없다
- W2. `Block` 자체가 템플릿이다 — 새 추상 개념 불필요 (오컴)
- W3. 기존 `paste + deepClone` 파이프라인으로 블록 추가 = paste(template)
- W4. 사이드바 + 버튼이 가장 자연스러운 블록 추가 진입점
- W5. Page Preset = `Block[]`, Block Preset = `Block` — 기존 타입으로 완전 표현
- W6. `INITIAL_STATE.data.blocks`가 이미 첫 번째 Page Preset

### 설계

```
presets/
  pages.ts   — PagePreset = { label, description, blocks: Block[] }
  blocks.ts  — BlockPreset = { label, icon, block: Block }
```

| 진입점 | 동작 |
|--------|------|
| 최초 진입 / 빈 캔버스 | Page Preset 선택 화면 |
| 사이드바 + 버튼 | Block Preset 목록 → 선택 → paste(deepClone) |
| 빌더 툴바 | "새 페이지" → Page Preset 선택 |

### 한 줄 요약
Block이 곧 템플릿이다 — 추가 추상 없이 기존 paste 메커니즘으로 생성 경로를 연다.
