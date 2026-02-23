# docs-viewer-features

- Start Date: 2026-02-23
- Scale: Light

## Summary

Docs viewer에 표준 문서 관리 기능을 단계적으로 추가한다. Notion, Obsidian, Confluence 등에서 보편적으로 제공되는 기능 중 ROI가 높은 것부터 구현.

## Motivation

현재 docs-viewer는 폴더 트리 + 마크다운 렌더링 + Recent 섹션을 갖추고 있으나, 긴 문서 탐색(TOC), 자주 쓰는 문서 고정(Favorites), 문서 메타데이터 표시 등 기본 기능이 부족하다.

[리서치 보고서](../../5-backlog/2026-0223-1017-[research]-docs-viewer-standard-features.md)에서 28개 표준 기능을 조사하고 Tier 1(저비용 고효과)을 식별했다.

## Guide-level explanation

- T1: 문서 헤더에 수정일 표시 (mtime 인프라 활용)
- T2: 우측 또는 sidebar에 heading 기반 TOC 표시
- T3: Favorites 섹션 — 문서를 고정하여 sidebar 상단에서 빠르게 접근

## Prior art

- Notion: Favorites sidebar section, page properties
- Obsidian: Starred files, Outline view (TOC)
- Confluence: Page tree + TOC macro + Favourites

## Unresolved questions

- TOC 위치: 우측 사이드바 vs 좌측 sidebar 내 vs 문서 내 상단
- Favorites 저장소: localStorage vs URL hash
