# accessor-first-cleanup

## ✅ Done
- [x] T1: select.ts — getItems?.() ?? DOM_ITEMS 패턴 적용
- [x] T2: selectAll.ts — 동일
- [x] T3: tab.ts — 동일
- [x] T4: defineApp.page.ts — mockItems를 fallback으로 문서화 (getItems 있으면 무시)
- [x] T5: goto() — items 옵션 @deprecated 태그 추가 (getItems 우선)
- [x] T6: 2-contexts/index.ts — DOM_ITEMS는 이미 getItems 우선 (L92). 확인 완료
- [x] T7: 전체 테스트 849/849 GREEN

## 💡 Ideas
- [ ] mockItems 완전 제거: getItems가 없는 zone이 사라지면 제거 가능
- [ ] DOM_ITEMS context 자체를 deprecated로 표시
