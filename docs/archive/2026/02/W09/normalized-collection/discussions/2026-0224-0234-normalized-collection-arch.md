# Discussion: Normalized Collection Architecture

> 2026-02-24 02:34 ~ 02:47

## Journey

**🧑 사용자**: headless OS의 컨셉을 명확히 하자. 컴포넌트는 정형화 되어 있고, 데이터 구조도 대개 정형화 되어 있어. 데이터를 View에 맞게 바꿔서 정규화된 데이터로 처리하자.

**🤖 AI**: Hexagonal Architecture의 Port/Adapter 패턴. 도메인은 core, UI가 adapter, transform이 port. Notion/Airtable/TanStack Table/Redux EntityAdapter/ECS 모두 같은 패턴의 변형.

---

**🧑 사용자**: 모든 collection들을 다 정형화해서 CRUD 방식을 통일할 거야. 어떤 데이터를 넣어도 어떤 View에서든 쓸 수 있어야 해.

**🤖 AI**: `NormalizedCollection { entities, order }` 제안. entities = entity map, order = adjacency list (parentId → children). Flat list는 order[""]만, Tree는 order에 parent→children 전부.

---

**🧑 사용자**: 별도 자료구조는 DB건 API 때문이건 있어야 해. UI에 붙여서 쓸 때만 UI에 맞춰서 변형해서 쓰라는 말이야.

**🤖 AI**: 정정 — 도메인은 도메인답게, UI는 UI답게, 경계에 순수 함수 Transform.

---

**🧑 사용자**: 반영해. rules.md에 넣어.

→ **rules.md Project #3 반영 완료.**

---

**🧑 사용자**: 기존 CollectionZone은 어떻게 쓸 수 있어?

**🤖 AI**: `fromEntities`의 `orderAccessor` 반환 타입을 `string[]` → `Record<string, string[]>`로 확장. 기존 flat은 `{ "": [...] }`로 퇴화. ItemOps에 tree-aware CRUD 추가.

**한 줄 요약**: 도메인 데이터를 정규화 포맷(`{ entities, order }`)으로 변환하면, 하나의 CRUD로 모든 View(List/Tree/Kanban/Grid)에서 동일하게 동작한다.

---

## Conclusion

### Why
기존 프레임워크는 "컴포넌트가 데이터를 소유". TreeView는 tree 데이터, ListView는 flat array를 각각 요구. CRUD가 View마다 다름 → N개 뷰 = N배 버그.

### Intent
OS는 데이터 정규화 계층. 정규화된 포맷 하나 → CRUD 통일 → View는 교체 가능한 projection.

### Warrants
1. OS 컴포넌트는 id/role/level/state만 앎 — 도메인 무지
2. 순수 변환 함수(Transform)가 도메인↔UI 경계를 보장
3. 업계 선례: Redux EntityAdapter, CQRS ReadModel, Notion Block Model, TanStack Table, ECS
4. `fromEntities`는 이미 `{ entities, order }` 패턴. 확장만 하면 됨.
5. View = Pure Projection — Tree는 parentId 메타데이터일 뿐
6. CRUD 통일 = DnD/Clipboard/Undo 자동 통일
