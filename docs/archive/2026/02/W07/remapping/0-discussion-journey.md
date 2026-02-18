# 리매핑 Discussion Journey

## 발단

**🧑 사용자**: 리매핑

**🤖 AI**: `getCanonicalKey`가 Mac에서 `Meta+Arrow → Home/End`로 변환, OS_MOVE_UP/DOWN 키바인딩에 도달 불가. 설계 원칙을 논의하자.

---

## 1차 전환: Fallback

**🧑 사용자**: 리매핑이 fallback이어야 한다 생각해

**🤖 AI**: 뒤집으면 `Meta+ArrowUp` 먼저 resolve → miss → normalize → 재시도. "구체적 바인딩 우선" = CSS specificity 패턴과 동일.

---

## 2차 전환: 미들웨어

**🧑 사용자**: 키 바인딩도 고민했는데 미들웨어인 거 같아

**🤖 AI**: Mac normalization = 미들웨어. `KeyboardPipeline.use(MacNormalizationMiddleware)`.

**🧑 사용자**: 우리 커널 미들웨어

**🤖 AI**: 키보드 전용 파이프라인이 아니라 커널 미들웨어로 통합.

**🧑 사용자**: 아니 미들웨어를 확장하자

**🤖 AI**: 미들웨어 인터페이스에 `resolve` 훅 추가.

---

## 3차 전환: Keybindings 제거?

**🧑 사용자**: 키바인딩 제거 키 리스너를 활용

**🤖 AI**: Keybindings 시스템 자체를 없애고 미들웨어가 키→커맨드 매핑. 리스너는 이벤트만 넘기는 바보.

**🧑 사용자**: 리스너를 바보로 만들면 우리 구조가 다 바뀔텐데?

**🤖 AI**: Focus/Click 리스너까지 전부 영향 — 아키텍처 전환 수준.

---

## 4차 전환: DOM 경계 발견

**🧑 사용자**: 안할거야 근데 고민은 해보자 focus 미들웨어 expand 미들웨어 우아한 디자인인가?

**🤖 AI**: 키보드 = 순수(문자열) → 미들웨어 적합. Focus/Click = DOM 참조 필요 → 리스너에 남아야. **경계선 = DOM 참조 유무.**

**🧑 사용자**: 그래서 똑똑한 리스너가 지 할일을 다하고 나머지는 fallback으로 미들웨어에게 주는 거

**🤖 AI**: 리스너 = 1차 resolve + DOM 해석. miss → 미들웨어 fallback. 아키텍처 변경 없음.

---

## 5차 전환: 노이즈와 Event

**🧑 사용자**: UNRESOLVED 단 이건 로그 타면 노이즈 문제는?

**🤖 AI**: 3개 선택지 제시. 사용자 1번 선택 → `kernel.resolveFallback()` — dispatch/트랜잭션 안 타는 사이드 채널.

**🧑 사용자**: 마우스 클립보드 동일 패턴

**🤖 AI**: keyboard/mouse/clipboard 모두 "리스너 1차 → miss → resolveFallback" 동일 패턴.

**🧑 사용자**: event를 넘겨

**🤖 AI**: `resolveFallback(nativeEvent)` — 별도 data shape 불필요, `instanceof`로 미들웨어가 자기 관심사 필터링.

---

**한줄요약**: "리매핑 버그 고치자"에서 시작해, 키보드→미들웨어→리스너 역할 분리→DOM 경계→범용 fallback 패턴까지 도달 — 최종 결론은 `kernel.resolveFallback(nativeEvent)`.
