# 아카이브 방식에 대한 논의

## Journey

**🧑 사용자**: os-elegance, focus-recovery, todo-v3-migration 프로젝트 종료하고 아카이브 해줘

**🤖 AI**: `/archive` 워크플로우에 따라 tombstone + git branch 방식으로 아카이브 실행. 21개 파일을 tombstone으로 교체, MIGRATION_MAP 갱신 완료.

---

**🧑 사용자**: 아카이브 방식에 대해 논의하자.

**🤖 AI**: (Intent 추론) `os-elegance/1-prd.md`의 tombstone을 Docs Viewer에서 보고 계신 상황. "이 tombstone이 정말 가치가 있는가?"라는 의문. 6줄짜리 "ARCHIVED" 마커가 21개 파일에 남아있는 상태 — 노이즈 제거가 아니라 다른 종류의 노이즈를 만든 건 아닌지? 잠재적 긴장 3가지를 제시:
1. tombstone 자체가 노이즈
2. MIGRATION_MAP이 이미 기록 역할을 하는데 tombstone이 중복
3. `docs/4-archive/` 디렉토리가 이미 있는데 git 브랜치를 쓰는 이유

---

**🧑 사용자**: 우리 순서가 잘못되었어. project → 아카이브 요청인데 그냥 날려버렸어. 그런데 project에도 폴더가 남아 있는 상황이야.

**🤖 AI**: 핵심 지적. `1-project/`는 "활성 프로젝트" 폴더인데, 죽은 프로젝트가 tombstone으로 남아있으면:
1. Docs Viewer 사이드바에 계속 보임 (노이즈)
2. AI가 읽는 컨텍스트 낭비
3. `1-project/`의 의미가 오염됨

빠진 단계: 프로젝트 종료 → **폴더 이동** → 아카이브. 물리적 이동이 빠졌다.

두 가지 선택지 제시:
- A) `docs/4-archive/`로 이동 — 기록은 남지만 `1-project/`는 깨끗
- B) 폴더 완전 삭제 — MIGRATION_MAP + git branch에만 기록

---

**🧑 사용자**: A)로 갔다가 아카이브가 많아지고 노이즈가 되면 브랜치 아카이브로 가야지

**🤖 AI**: 2단계 수명 주기 — 점진적 퇴출 모델. 3-Tier:
```
1-project/ (활성) → 4-archive/ (냉장) → git branch (심층)
```
이 모델에서 tombstone은 사라진다. 물리적 이동이니까.

날짜 프리픽스 질문.

---

**🧑 사용자**: 날짜로

**🤖 AI**: `YYYY-MM-name/` 형식 확정.

---

**🧑 사용자**: 좋아 진행해

**🤖 AI**: 현재 tombstone 정정 + 워크플로우 갱신 실행.

---

한 줄 요약: **아카이브 실행 중 tombstone 모델의 결함을 발견하고, 3-tier 수명 주기(활성→냉장→심층)로 전환했다.**

---

## Conclusion

### Why

아카이브의 목적은 "AI 컨텍스트에서 노이즈 제거"인데, tombstone 방식은 노이즈를 **제거하지 않고 변환할 뿐**이었다. `1-project/`에 죽은 폴더가 남아있으면 폴더 의미론이 깨지고, Docs Viewer에서도 혼란이 생긴다.

### Intent

문서의 접근성을 **단계적으로 낮추는** 수명 주기가 필요하다. 갑자기 삭제하지 않고, 활성 → 냉장 → 심층으로 점진적 퇴출.

### Warrants

- W1. 아카이브의 목적은 AI 컨텍스트에서 노이즈 제거
- W2. MIGRATION_MAP.md가 퇴출 기록의 중앙 레지스트리
- W3. `1-project/`는 활성 프로젝트만 있어야 의미가 유지된다
- W4. tombstone은 노이즈 제거가 아니라 노이즈 변환일 뿐 → 폐지
- W5. 점진적 퇴출(냉장→심층)이 급격한 삭제보다 안전하다
- W6. 물리적 이동 모델에서 tombstone이 불필요하다
- W7. 날짜 프리픽스(`YYYY-MM-name/`)로 시간순 정렬

### 결정된 모델

| 단계 | 위치 | 파일 상태 | 접근 |
|------|------|----------|------|
| 활성 | `docs/1-project/name/` | 원본 | Docs Viewer, AI |
| 냉장 | `docs/4-archive/YYYY-MM-name/` | 원본 그대로 | Docs Viewer |
| 심층 | `archive/legacy-docs` git 브랜치 | 파일시스템에서 삭제 | `git show`로만 |

### 한 줄 요약

**tombstone은 노이즈 변환이지 제거가 아니다 — 물리적 이동의 3-tier 수명 주기가 정답이다.**
