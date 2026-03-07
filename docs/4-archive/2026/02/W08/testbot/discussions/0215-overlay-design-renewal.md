# 0215 — TestBot Overlay 디자인 리뉴얼

> **한 줄 요약**: TestBot Overlay는 macOS Native 도구답게 보여야 하며, 화려한 장식보다 정보 적시성과 시인성이 본질이다. Key HUD는 중복이므로 제거.

---

## Conclusion

### Why
TestBot Overlay의 시각적 품질을 개선하기 위해 디자인 리뉴얼을 검토했다.

### Intent
"macOS처럼 정제되고 도구다운 미학"을 유지하면서, 불필요한 시각적 요소를 줄여 TestBot을 더 효율적인 테스트 러너로 만든다.

### Warrants (누적)
1. **W1**: "Premium"은 장식이 아니라 **익숙함과 정교함**에서 온다 (Apple Design Philosophy).
2. **W2**: Overlay는 콘텐츠를 가리지 않고 정보를 전달하는 보조 수단이므로, 시스템 폰트와 절제된 컬러가 적합하다.
3. **W3**: 검정 커서 + 흰색 스트로크는 모든 배경에서 시인성이 보장되는 검증된 UX.
4. **W4**: Key HUD는 KeyCastr(스크린캐스트 도구)에서 차용한 것이며, 테스트 러너에서 보편적이지 않다.
5. **W5**: 키 입력 정보는 Bubble + SuiteDetails 두 곳에서 충분히 확인 가능하므로, Key HUD는 완전한 중복이다.
6. **W6**: 버블 트레이는 가로(`row`) 배치가 커서 옆에 자연스럽게 따라붙는 레이아웃이다.

### 실행된 변경사항
| 파일 | 변경 내용 |
|------|----------|
| `CursorOverlay.css` | macOS Native 복구 (System font, Black cursor, Blue spotlight `multiply`) |
| `StampOverlay.css` | System font, 2px 테두리, 단순 pop 애니메이션 |
| `CursorOverlay.tsx` | `KeyPressHUD` 컴포넌트 제거, `KeyPress` import 제거 |
| `BotCursor.ts` | `pressKey()` 인터페이스 제거 |
| `cursor.ts` | `pressKey()` 구현 및 `addCursorKey` import 제거 |
| `createActions.ts` | `cursor.pressKey()` 호출 2곳 제거 (press, type) |

### 미래 과제 (Panel 리뉴얼)
> 이번 scope 밖. 필요 시 별도 Discussion으로.
- Panel UI 이중 헤더 문제
- Inspector 디자인 언어와 Panel 팔레트 통일
- Dead code 정리 (`addCursorKey`, `removeCursorKey`, `KeyPress` 타입)

---

## Journey

**🧑**: 테스트 봇 디자인 리뉴얼 → Overlay 먼저 하자.
**🤖**: "Premium Indigo" 디자인 시도 (보라색 커서, JetBrains Mono, 두꺼운 테두리)
**🧑**: 왜 이렇게 촌스럽게 변했어? MAC스럽고 좋았는데?
**🤖**: ❗ 방향 수정 → macOS Native로 즉시 복구
**🧑**: Key HUD 보편적인 거 맞아? 필요해?
**🤖**: 코드 추적 → 3중 중복 확인 → 제거 권장
**🧑**: 제거해. 버블 왜 세로야?
**🤖**: Key HUD 완전 제거 + 버블 `row` 복구 + tsc 통과 확인
