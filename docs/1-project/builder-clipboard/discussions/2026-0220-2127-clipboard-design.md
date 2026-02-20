# Builder Clipboard — 설계 논의

> 2026-02-20 21:27 ~ 21:36

## Journey

**🧑 사용자**: 빌더에서 cut/copy/paste를 해볼 거야.

**🤖 AI**: `createCollectionZone`에 copy/cut/paste가 이미 구현됨. 사이드바는 collectionZone이라 가능성 있음. 단위가 뭔가?

**🧑 사용자**: 각 노드마다 전략이 다 달라. Figma처럼 뭐든 되는 거지.

---

**🤖 AI**: 사이드바/캔버스 cross-zone paste는?

**🧑 사용자**: 둘 다 같은 데이터인데 안 될 이유가 있어?

**🤖 AI**: (맞음. Clipboard는 데이터 레이어 연산. 뷰 무관.)

---

**🧑 사용자**: 카드를 복사했는데 글자에 붙여넣기 하면?

**🤖 AI**: isFieldActive 분기로 자동 해결. 편집 중 → 네이티브(toText), 탐색 중 → OS(구조).

**🧑 사용자**: 카드를 복사해서 아이콘에 붙여넣기 하면?

**🤖 AI**: Paste bubbling — accept 가능한 동적 컬렉션 조상까지 올라감.

**🧑 사용자**: 아이콘 복사해서 아이콘에 붙여넣기 하면?

**🤖 AI**: 정적 템플릿 안의 아이템은 구조적 연산 불가. bubbling해도 accept 안 됨 → no-op.

**🧑 사용자**: 맞아. 카드/탭은 동적, 카드 내부 구조는 정적이야.

---

**🧑 사용자**: 높은 곳에서 모든 케이스를 다 설계하고 개발하는 전략으로 가야 해.

**🤖 AI**: 전체 매트릭스 작성. 3개 보편 규칙으로 귀결:
1. 편집 중 → 네이티브
2. 탐색 중 → 데이터 계층 bubbling + accept
3. 정적 아이템은 cut/delete/duplicate 불가

**🧑 사용자**: cross-collection paste의 스키마 호환성은 accept 함수로. 기본은 필드명 매칭.

---

## Conclusion

### 3개 보편 규칙

```
규칙 1: isFieldActive → 네이티브 clipboard (브라우저)
규칙 2: !isFieldActive → paste bubbling (데이터 계층 올라가며 accept 찾기)
규칙 3: 정적 아이템은 구조적 연산 불가 (cut/delete/duplicate ❌)
```

### COPY → PASTE 매트릭스

| 복사 \ Paste 위치 | 루트(섹션) | 카드 컬렉션 | 탭 컬렉션 | 정적 아이템 | 필드 편집 중 |
|:-:|:-:|:-:|:-:|:-:|:-:|
| Section | ✅ 삽입 | 🔼→루트→삽입 | 🔼→루트→삽입 | 🔼→루트→삽입 | 📋 toText |
| Card | ❌ | ✅ 삽입 | ❌ | 🔼→카드→삽입 | 📋 toText |
| Tab | ❌ | ❌ | ✅ 삽입 | 🔼→탭→삽입 | 📋 toText |
| 정적 Item | ❌ | ❌ | ❌ | ❌ | 📋 toText |
| Text | ❌ | ❌ | ❌ | ❌ | ✅ 네이티브 |

### Warrants

1. `createCollectionZone`에 copy/cut/paste + collectionBindings 구현됨
2. `isFieldActive` 분기로 편집/탐색 자동 구분
3. Clipboard는 데이터 레이어 연산 — 뷰 무관
4. Figma 패턴: paste는 accept 가능한 가장 가까운 컨테이너로
5. 각 노드가 동적/정적을 스스로 선언
6. accept 기본값: structural typing (필드명 매칭)
7. toText가 구조→텍스트 브릿지

**한 줄 요약**: 편집 중이면 네이티브, 탐색 중이면 bubbling+accept — 3개 규칙으로 모든 clipboard 케이스를 커버한다.
