#!/usr/bin/env bash
# sync-workflows.sh
# .agent/workflows/ → .claude/commands/ 단방향 동기화
#
# 동작:
#   1. .agent/workflows/**/*.md 를 flat 하게 .claude/commands/ 에 복사
#   2. `// turbo`, `// turbo-all` 디렉티브 라인 제거
#   3. 변경된 파일만 덮어쓰기 (diff 기반)
#
# 사용법:
#   ./scripts/sync-workflows.sh          # 실행 (변경분만 적용)
#   ./scripts/sync-workflows.sh --dry    # dry-run (변경 목록만 출력)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/.agent/workflows"
DST="$ROOT/.claude/commands"

DRY=false
[[ "${1:-}" == "--dry" ]] && DRY=true

added=0
updated=0
unchanged=0
skipped_names=()

# 임시 디렉토리
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# .agent/workflows/**/*.md 순회 (하위 폴더 포함, flat 변환)
while IFS= read -r src_file; do
  filename="$(basename "$src_file")"
  dst_file="$DST/$filename"
  cleaned="$tmp/$filename"

  # // turbo, // turbo-all 라인 제거 + 연속 빈 줄 정리
  sed '/^\/\/ turbo.*$/d' "$src_file" \
    | sed '/./,/^$/!d' \
    > "$cleaned"

  # 이미 존재하면 diff 비교
  if [[ -f "$dst_file" ]]; then
    if diff -q "$cleaned" "$dst_file" > /dev/null 2>&1; then
      ((unchanged++))
      continue
    fi
    label="UPDATE"
    ((updated++))
  else
    label="ADD"
    ((added++))
  fi

  rel_src="${src_file#"$ROOT"/}"
  echo "  $label  $filename  ← $rel_src"

  if [[ "$DRY" == false ]]; then
    cp "$cleaned" "$dst_file"
  fi
done < <(find "$SRC" -name '*.md' -type f | sort)

echo ""
echo "--- sync summary ---"
echo "  added:     $added"
echo "  updated:   $updated"
echo "  unchanged: $unchanged"

if [[ "$DRY" == true ]]; then
  echo ""
  echo "  (dry-run: no files written)"
fi
