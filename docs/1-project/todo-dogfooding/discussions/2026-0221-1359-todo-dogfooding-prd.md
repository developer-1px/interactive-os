# Discussion: Todo 개밥먹기 PRD 확장

> 2026-02-21 13:57 ~ 13:59

## Journey

**🧑 사용자**: todo 개밥먹기를 위해서 prd를 더 추가해보면 좋을게 뭐가 있을까?

**🤖 AI**: 현재 Todo가 커버하는 OS 패턴(CRUD, Clipboard, Undo/Redo, Field, MultiSelect)을 분석하고, 아직 검증하지 않는 8개 영역을 제시:
1. Dialog / Modal
2. Drag & Drop
3. Context Menu
4. Combobox / Search
5. Bulk Action Bar
6. Toast / Notification
7. Date Picker
8. Export/Import

**🧑 사용자**: 생각하지 말고 그냥 다 진행하자. 당연한 기능을 OS로만 가지고 만들 수 있느냐가 interactive os의 증명이다. todo쯤은 데이터 스키마만 있으면 만들 수 있어야 한다.

---

## Conclusion

**Why**: Todo는 OS의 벤치마크 앱인데, 현재는 기본 CRUD + 키보드 패턴만 증명한다. 실제 SaaS 앱이 필요로 하는 "당연한 기능들"(Dialog, Context Menu, Toast, DnD, Search 등)을 OS primitive만으로 만들 수 있음을 증명해야 OS의 가치가 성립한다.

**Intent**: "데이터 스키마만 있으면 앱이 된다"를 Todo로 증명. OS가 인터랙션을 보장하므로, 앱 개발자는 데이터 구조만 선언하면 된다.

**Warrants**:
- W1. Todo는 OS의 정답지 — 모든 패턴의 레퍼런스 구현 (VISION.md)
- W2. 기존 CRUD/Clipboard/Undo/Field/MultiSelect는 이미 검증 완료
- W3. "당연한 기능"이 빠져 있으면 OS의 증명이 불완전
- W4. OS에는 Dialog/ARIA 스펙이 이미 존재 — Todo에서 연결만 하면 됨
- W5. 기준은 "앱을 더 좋게"가 아니라 "OS의 빈 구멍을 메우기"

**한 줄 요약**: Todo가 "진짜 앱"이 되어야 OS가 "진짜 플랫폼"임이 증명된다.
