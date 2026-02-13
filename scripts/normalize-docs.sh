#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# normalize-docs.sh
# docs/ 내 파일명의 underscore(_)를 hyphen(-)으로 치환하고,
# PascalCase를 kebab-case로 변환하는 스크립트.
#
# Usage:
#   ./scripts/normalize-docs.sh              # dry-run (변경 미리보기)
#   ./scripts/normalize-docs.sh --execute    # 실제 실행 (git mv)
# ============================================================================

MODE="dry-run"
if [[ "${1:-}" == "--execute" ]]; then
  MODE="execute"
fi

ROOT_DIR="$(git rev-parse --show-toplevel)"
DOCS_DIR="$ROOT_DIR/docs"

# PascalCase → kebab-case 변환 함수
# "DispatchToZone" → "dispatch-to-zone"
# "DevLog" → "devlog"
to_kebab() {
  echo "$1" \
    | sed -E 's/([a-z0-9])([A-Z])/\1-\2/g' \
    | sed -E 's/([A-Z]+)([A-Z][a-z])/\1-\2/g' \
    | tr '[:upper:]' '[:lower:]'
}

# 카운터
count=0
skipped=0

echo "=== normalize-docs.sh ($MODE) ==="
echo ""

# docs/ 하위에서 _를 포함하는 파일 검색
# 4-archive/ 제외, MIGRATION_MAP 제외
while IFS= read -r filepath; do
  dir=$(dirname "$filepath")
  filename=$(basename "$filepath")

  # Step 1: _ → - 치환
  newname="${filename//_/-}"

  # Step 2: PascalCase → kebab-case (날짜 접두사 이후 부분만)
  # 날짜 패턴: 2026-02-12-... 또는 2026-0212-...
  if [[ "$newname" =~ ^([0-9]{4}-[0-9]{2,4}-?[0-9]{0,4}-)(.+)$ ]]; then
    prefix="${BASH_REMATCH[1]}"
    rest="${BASH_REMATCH[2]}"
    rest_kebab=$(to_kebab "$rest")
    newname="${prefix}${rest_kebab}"
  elif [[ "$newname" =~ ^(ADR-[0-9]{3}-)(.+)$ ]]; then
    # ADR 패턴: ADR-001-Implementation_Verification → adr-001-implementation-verification
    prefix="${BASH_REMATCH[1]}"
    rest="${BASH_REMATCH[2]}"
    rest_kebab=$(to_kebab "$rest")
    newname="${prefix}${rest_kebab}"
    # ADR 전체를 소문자로
    newname=$(echo "$newname" | tr '[:upper:]' '[:lower:]')
  else
    # 비날짜 파일: 전체 kebab-case
    newname=$(to_kebab "$newname")
  fi

  # 이미 같으면 스킵
  if [[ "$filename" == "$newname" ]]; then
    ((skipped++)) || true
    continue
  fi

  newpath="$dir/$newname"
  ((count++)) || true

  if [[ "$MODE" == "dry-run" ]]; then
    echo "[$count] $filepath"
    echo "    → $newpath"
    echo ""
  else
    if git -C "$ROOT_DIR" mv "$filepath" "$newpath" 2>/dev/null; then
      echo "✅ $filepath → $newpath"
    else
      mv "$filepath" "$newpath"
      echo "✅ (untracked) $filepath → $newpath"
    fi
  fi

done < <(find "$DOCS_DIR" -name '*_*' -type f \
  -not -path '*/4-archive/*' \
  -not -name 'MIGRATION_MAP*' \
  | sort)

echo ""
echo "=== 결과 ==="
echo "변환 대상: $count 개"
echo "스킵 (이미 정규화): $skipped 개"
if [[ "$MODE" == "dry-run" ]]; then
  echo ""
  echo "실제 실행하려면: ./scripts/normalize-docs.sh --execute"
fi
