# Discussion: forceDeselect 후 키보드 무반응

## Journey

**🧑 사용자**: deselect가 되면 키보드 이동시 이동이 되면 안되는데 ArrowUp이 다시 포커스를 잡고 있어.

**🤖 AI**: `OS_NAVIGATE`의 `entry` 설정이 `focusedItemId=null`일 때 첫 아이템으로 진입시킨다. 이건 "아직 진입 안 함"에는 맞지만, "명시적 해제"에는 맞지 않다.

---

**🧑 사용자**: 표준은 뭐야 되는게 맞아?

**🤖 AI**: APG에는 "전부 해제" 개념 없음. 빌더 도구(Figma, Photoshop)에서는 ESC 후 Arrow 무반응이 표준. 해법: `forceDeselect`가 `activeZoneId=null`도 같이 해야 한다.

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | `forceDeselect` = `focusedItemId=null` + `activeZoneId=null`. zone 비활성화까지 해야 ESC 후 Arrow 무반응 |
| **📊 Data** | Inspector: ESC → focusedItemId=null, ArrowUp → focusedItemId 다시 잡힘. activeZoneId가 여전히 "canvas" |
| **🔗 Warrant** | activeZoneId=canvas → 키보드 이벤트가 canvas로 라우팅 → entry 로직이 null→첫아이템 |
| **📚 Backing** | Figma: ESC 후 Arrow 무반응. 다시 클릭해야 선택 복귀 |
| **⚖️ Qualifier** | Clear |
| **⚡ Rebuttal** | activeZoneId=null이면 Tab으로 재진입해야 하는데, 빌더에서 Tab은 다른 용도일 수 있음 |
| **❓ Open Gap** | 재진입 경로: 클릭만? Tab도? |
