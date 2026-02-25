# 세션 회고: TOBE 파이프라인 Full E2E + UI

## Journey

**🧑 사용자**: i18n 데이터 모델만으로 파이프라인 검증했더니 DT·UI 없음. "DT를 못 만드는 기획이면 빠꾸"

**🤖 AI**: 수평 분해(T1=모델, T2=UI)가 원인. FE는 수직 분해(입력→커맨드→상태→화면)여야 함.

---

**🧑 사용자**: Stories부터 다시. UX까지 고려. 파이프라인 한 바퀴 돌 수 있어야 함.

**🤖 AI**: INVEST S = 파이프라인 1사이클. DT Gate 추가. UX Flow 필수. Stories 재작성.

---

**🤖 AI**: 2차 파이프라인 — US-001(언어전환), DT 7행, 🟢 3 PASS.

**🧑 사용자**: UI도 붙여봐.

**🤖 AI**: locale.ts(OS 커맨드) + LocaleSwitcher.tsx + field:locale 패턴 + useLocalizedSectionFields → Hero 블록 locale-aware.

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | TOBE 파이프라인은 stories(UX Flow+DT Gate) → spec(수직분해+DT) → red(DT→테스트) → green(UI 바인딩까지) 전 구간이 연결되어야 한다 |
| **📊 Data** | 1차: 순수함수 8줄, DT 없음, UI 없음 / 2차: DT 7행, 🟢 3 PASS, LocaleSwitcher UI + locale-aware Hero |
| **🔗 Warrant** | FE의 산출물은 화면이다. Zone 없는 태스크는 FE 기획이 아니다 |
| **📚 Backing** | Vertical Slice Architecture, INVEST, OS 파이프라인 5-Phase |
| **⚖️ Qualifier** | 🟢 Clear |
| **⚡ Rebuttal** | field:locale 키 패턴은 편법. 실제 프로덕션 전 Record<locale, string> 마이그레이션 필요 |
| **❓ Open Gap** | 나머지 블록(NCPFeatureCards 등) locale-aware 처리 |

## 워크플로우 개선 사항 (이번 세션 반영)
- `/stories`: DT Gate + INVEST S=파이프라인 1사이클 + UX Flow 필수
- `/spec`: Zone 체크 가드레일 (수직 분해 강제)
- `/green`: Zone 태스크 UI 바인딩 체크 추가
