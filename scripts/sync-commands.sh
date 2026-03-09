#!/usr/bin/env bash
# sync-commands.sh
# .claude/commands/ → .agent/workflows/ 단방향 동기화
#
# 동작:
#   1. .claude/commands/*.md 를 .agent/workflows/ 에 복사
#   2. 변경된 파일만 덮어쓰기 (diff 기반)
#   3. .agent/workflows/ 에만 있고 .claude/commands/ 에 없는 파일 제거
#
# 사용법:
#   ./scripts/sync-commands.sh          # 실행 (변경분만 적용)
#   ./scripts/sync-commands.sh --dry    # dry-run (변경 목록만 출력)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/.claude/commands"
DST="$ROOT/.agent/workflows"

DRY=false
[[ "${1:-}" == "--dry" ]] && DRY=true

added=0
updated=0
unchanged=0
removed=0

# 보호 대상: workflows 전용 파일 (commands에 원본이 없는 파일)
PROTECTED_FILES=()

# .claude/commands/*.md 순회 (flat only)
for src_file in "$SRC"/*.md; do
  [[ -f "$src_file" ]] || continue
  filename="$(basename "$src_file")"
  dst_file="$DST/$filename"

  if [[ -f "$dst_file" ]]; then
    if diff -q "$src_file" "$dst_file" > /dev/null 2>&1; then
      ((unchanged++))
      continue
    fi
    label="UPDATE"
    ((updated++))
  else
    label="ADD"
    ((added++))
  fi

  echo "  $label  $filename"

  if [[ "$DRY" == false ]]; then
    cp "$src_file" "$dst_file"
  fi
done

# .agent/workflows/ 에만 있고 .claude/commands/ 에 없는 파일 제거
for dst_file in "$DST"/*.md; do
  [[ -f "$dst_file" ]] || continue
  filename="$(basename "$dst_file")"

  # 보호 대상은 건너뛴다
  for protected in "${PROTECTED_FILES[@]+"${PROTECTED_FILES[@]}"}"; do
    if [[ "$filename" == "$protected" ]]; then
      continue 2
    fi
  done

  if [[ ! -f "$SRC/$filename" ]]; then
    echo "  REMOVE  $filename"
    if [[ "$DRY" == false ]]; then
      rm "$dst_file"
    fi
    ((removed++))
  fi
done

echo ""
echo "--- sync summary ---"
echo "  added:     $added"
echo "  updated:   $updated"
echo "  removed:   $removed"
echo "  unchanged: $unchanged"

if [[ "$DRY" == true ]]; then
  echo ""
  echo "  (dry-run: no files written)"
fi
