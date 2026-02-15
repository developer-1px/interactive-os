# Proposal: 공식 문서 PARA 분리

---

## 구현 전략

### 1. 폴더 구조

```
docs/
├── official/                     ← 공식 문서 (PARA 밖)
│   ├── README.md                 ← 진입점: 전체 목차 + 프로젝트 소개
│   └── kernel/                   ← Kernel 공식 문서
│       ├── 00-overview.md
│       ├── 01-getting-started.md
│       ├── 02-core-concepts.md
│       ├── 03-api-reference.md
│       ├── 04-dispatch-pipeline.md
│       ├── 05-type-system.md
│       ├── 06-middleware.md
│       ├── 07-state-management.md
│       ├── 08-patterns.md
│       └── 09-glossary.md
│
├── 2-area/05-kernel/             ← 원본 위치 (이동 후)
│   ├── README.md                 ← "공식 문서는 docs/official/kernel/로 이동됨"
│   └── kernel-adr-journey.md     ← 내부 히스토리 (잔류)
│
└── (기존 PARA 폴더들 유지)
```

### 2. 실행 순서

| # | 작업 | 명령/도구 |
|---|------|-----------|
| 1 | `docs/official/kernel/` 생성 | `mkdir -p` |
| 2 | Kernel 문서 10개 이동 | `git mv docs/2-area/05-kernel/0*.md docs/official/kernel/` |
| 3 | 각 문서 내 `file:///` 링크를 상대경로로 수정 | sed 또는 수동 편집 |
| 4 | `docs/official/README.md` 작성 | 신규 파일 |
| 5 | `docs/2-area/05-kernel/README.md` 작성 | 이동 안내 |
| 6 | `packages/kernel/README.md` 작성 | 패키지 진입점 |
| 7 | KPI 검증 | `grep -r "file:///" docs/official/` = 0 |

### 3. 링크 수정 규칙

**Before** (현재):
```markdown
[Getting Started](file:///Users/user/Desktop/interactive-os/docs/2-area/05-kernel/01-getting-started.md)
```

**After**:
```markdown
[Getting Started](./01-getting-started.md)
```

모든 Next Steps 링크가 같은 폴더 내 파일을 가리키므로, `./filename.md` 패턴으로 통일.

### 4. 리스크

| 리스크 | 완화 |
|--------|------|
| git mv 후 기존 링크 참조가 깨짐 | `docs/2-area/05-kernel/README.md`에 이동 안내 |
| PARA 시스템에서 05-kernel 문서가 사라짐 | ADR Journey는 잔류, 공식 문서는 `official/`에서 접근 |
| 나중에 사이트로 이전 시 추가 작업 | 상대 링크 사용으로 최소화 |

### 5. 변경 범위

- **이동**: 10개 markdown 파일
- **수정**: 10개 파일 내 링크 (파일당 1~3개)
- **신규**: 3개 파일 (official/README.md, 2-area/05-kernel/README.md, packages/kernel/README.md)
- **삭제**: 없음
- **코드 변경**: 없음
