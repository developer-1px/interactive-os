/**
 * ZIFT Field Generalization — Red Tests (Phase 1)
 *
 * @spec docs/1-project/zift-field-generalization/spec.md
 *
 * Tests for:
 * T1: FieldType 확장 (boolean, number)
 * T2: resolveFieldKey 확장 (boolean/number keymaps)
 * T3: resolveItemKey 정리 (switch/checkbox/slider → Field 이동)
 * T4: computeItem 내부 추출 (computeFieldAttrs)
 * T5: fieldKeyOwnership 확장 (boolean/number passthrough)
 *
 * 🔴 These tests should FAIL because the implementation does not yet exist.
 */

import { isKeyDelegatedToOS } from "@os/2-resolve/fieldKeyOwnership";
import { resolveFieldKey } from "@os/2-resolve/resolveFieldKey";
import { FieldRegistry } from "@os/core/engine/registries/fieldRegistry";
import { beforeEach, describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════
// T1: FieldType 확장 — boolean/number 등록 가능
// ═══════════════════════════════════════════════════════════════

describe("T1: FieldType 확장", () => {
  beforeEach(() => {
    const fields = FieldRegistry.get().fields;
    for (const id of fields.keys()) {
      FieldRegistry.unregister(id);
    }
  });

  it("boolean FieldType 등록 가능", () => {
    // boolean fieldType으로 등록 시 tsc 에러 없이 컴파일되어야 함
    FieldRegistry.register("dark-mode", {
      name: "dark-mode",
      fieldType: "boolean" as any, // 🔴 현재 타입에 "boolean"이 없어서 as any
    });
    const entry = FieldRegistry.get().fields.get("dark-mode");
    expect(entry).toBeDefined();
    expect(entry!.config.fieldType).toBe("boolean");
  });

  it("number FieldType 등록 가능", () => {
    FieldRegistry.register("volume", {
      name: "volume",
      fieldType: "number" as any, // 🔴 현재 타입에 "number"가 없어서 as any
    });
    const entry = FieldRegistry.get().fields.get("volume");
    expect(entry).toBeDefined();
    expect(entry!.config.fieldType).toBe("number");
  });

  it("기존 string FieldType 하위호환", () => {
    FieldRegistry.register("title", {
      name: "title",
      fieldType: "inline",
    });
    const entry = FieldRegistry.get().fields.get("title");
    expect(entry).toBeDefined();
    expect(entry!.config.fieldType).toBe("inline");
  });
});

// ═══════════════════════════════════════════════════════════════
// T2: resolveFieldKey 확장 — boolean/number keymaps
// ═══════════════════════════════════════════════════════════════

describe("T2: resolveFieldKey — boolean keymap", () => {
  beforeEach(() => {
    const fields = FieldRegistry.get().fields;
    for (const id of fields.keys()) {
      FieldRegistry.unregister(id);
    }
    FieldRegistry.register("dark-mode", {
      name: "dark-mode",
      fieldType: "boolean" as any,
    });
  });

  it("Space → OS_CHECK", () => {
    const result = resolveFieldKey("dark-mode", "Space");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("OS_CHECK");
  });

  it("Enter → OS_CHECK", () => {
    const result = resolveFieldKey("dark-mode", "Enter");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("OS_CHECK");
  });

  it("ArrowDown → null (no meaning for boolean)", () => {
    const result = resolveFieldKey("dark-mode", "ArrowDown");
    expect(result).toBeNull();
  });
});

describe("T2: resolveFieldKey — number keymap", () => {
  beforeEach(() => {
    const fields = FieldRegistry.get().fields;
    for (const id of fields.keys()) {
      FieldRegistry.unregister(id);
    }
    FieldRegistry.register("volume", {
      name: "volume",
      fieldType: "number" as any,
    });
  });

  it("ArrowRight → OS_VALUE_CHANGE increment", () => {
    const result = resolveFieldKey("volume", "ArrowRight");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("OS_VALUE_CHANGE");
  });

  it("ArrowLeft → OS_VALUE_CHANGE decrement", () => {
    const result = resolveFieldKey("volume", "ArrowLeft");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("OS_VALUE_CHANGE");
  });

  it("ArrowUp → OS_VALUE_CHANGE increment", () => {
    const result = resolveFieldKey("volume", "ArrowUp");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("OS_VALUE_CHANGE");
  });

  it("ArrowDown → OS_VALUE_CHANGE decrement", () => {
    const result = resolveFieldKey("volume", "ArrowDown");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("OS_VALUE_CHANGE");
  });

  it("Home → OS_VALUE_CHANGE setMin", () => {
    const result = resolveFieldKey("volume", "Home");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("OS_VALUE_CHANGE");
  });

  it("End → OS_VALUE_CHANGE setMax", () => {
    const result = resolveFieldKey("volume", "End");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("OS_VALUE_CHANGE");
  });

  it("PageUp → OS_VALUE_CHANGE incrementLarge", () => {
    const result = resolveFieldKey("volume", "PageUp");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("OS_VALUE_CHANGE");
  });

  it("PageDown → OS_VALUE_CHANGE decrementLarge", () => {
    const result = resolveFieldKey("volume", "PageDown");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("OS_VALUE_CHANGE");
  });

  it("Space → null (no meaning for number)", () => {
    const result = resolveFieldKey("volume", "Space");
    expect(result).toBeNull();
  });
});

// T3 (resolveItemKey 정리) — Phase 2 완료.
// checkbox/switch/slider → Field layer 이동 (Layer 1b: activeFieldType).

// ═══════════════════════════════════════════════════════════════
// T5: fieldKeyOwnership — boolean/number passthrough
// isKeyDelegatedToOS: true=Zone으로 통과(Field 비소유), false=Field가 흡수(소유)
// ═══════════════════════════════════════════════════════════════

describe("T5: fieldKeyOwnership — boolean/number passthrough", () => {
  it("boolean Field: Escape → Zone passthrough (delegated)", () => {
    // 🔴 현재 'boolean' FieldType이 ZONE_PASSTHROUGH_KEYS에 없음
    const delegated = isKeyDelegatedToOS("Escape", "boolean" as any);
    expect(delegated).toBe(true); // Escape는 Zone으로 통과
  });

  it("boolean Field: Space → Field 소유 (not delegated)", () => {
    const delegated = isKeyDelegatedToOS("Space", "boolean" as any);
    expect(delegated).toBe(false); // Space는 Field가 흡수 (토글)
  });

  it("boolean Field: Enter → Field 소유", () => {
    const delegated = isKeyDelegatedToOS("Enter", "boolean" as any);
    expect(delegated).toBe(false); // Enter도 Field가 흡수 (토글)
  });

  it("number Field: Escape → Zone passthrough", () => {
    const delegated = isKeyDelegatedToOS("Escape", "number" as any);
    expect(delegated).toBe(true);
  });

  it("number Field: Tab → Zone passthrough", () => {
    const delegated = isKeyDelegatedToOS("Tab", "number" as any);
    expect(delegated).toBe(true);
  });

  it("number Field: ArrowRight → Field 소유 (값 조정)", () => {
    const delegated = isKeyDelegatedToOS("ArrowRight", "number" as any);
    expect(delegated).toBe(false); // Arrow는 값 조정이므로 Field가 흡수
  });

  it("number Field: Home → Field 소유 (setMin)", () => {
    const delegated = isKeyDelegatedToOS("Home", "number" as any);
    expect(delegated).toBe(false); // Home은 setMin이므로 Field가 흡수
  });
});

// ═══════════════════════════════════════════════════════════════
// T9: FieldType 확장 — enum/enum[] 등록 가능
// ═══════════════════════════════════════════════════════════════

describe("T9: FieldType 확장 — enum/enum[]", () => {
  beforeEach(() => {
    const fields = FieldRegistry.get().fields;
    for (const id of fields.keys()) {
      FieldRegistry.unregister(id);
    }
  });

  it("enum FieldType 등록 가능", () => {
    FieldRegistry.register("priority", {
      name: "priority",
      fieldType: "enum",
    });
    const entry = FieldRegistry.get().fields.get("priority");
    expect(entry).toBeDefined();
    expect(entry!.config.fieldType).toBe("enum");
  });

  it("enum[] FieldType 등록 가능", () => {
    FieldRegistry.register("tags", {
      name: "tags",
      fieldType: "enum[]",
    });
    const entry = FieldRegistry.get().fields.get("tags");
    expect(entry).toBeDefined();
    expect(entry!.config.fieldType).toBe("enum[]");
  });
});

// ═══════════════════════════════════════════════════════════════
// T10: resolveFieldKey — enum/enum[] keymap (빈 keymap)
// ═══════════════════════════════════════════════════════════════

describe("T10: resolveFieldKey — enum keymap", () => {
  beforeEach(() => {
    const fields = FieldRegistry.get().fields;
    for (const id of fields.keys()) {
      FieldRegistry.unregister(id);
    }
    FieldRegistry.register("priority", {
      name: "priority",
      fieldType: "enum",
    });
  });

  it("Space → null (Zone+Item handles selection)", () => {
    const result = resolveFieldKey("priority", "Space");
    expect(result).toBeNull();
  });

  it("ArrowDown → null (Zone handles navigation)", () => {
    const result = resolveFieldKey("priority", "ArrowDown");
    expect(result).toBeNull();
  });

  it("Enter → null (Zone handles activation)", () => {
    const result = resolveFieldKey("priority", "Enter");
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// T11: fieldKeyOwnership — enum/enum[] passthrough
// enum은 모든 키가 Zone으로 pass-through
// ═══════════════════════════════════════════════════════════════

describe("T11: fieldKeyOwnership — enum/enum[] passthrough", () => {
  it("enum: ArrowDown → Zone passthrough", () => {
    expect(isKeyDelegatedToOS("ArrowDown", "enum")).toBe(true);
  });

  it("enum: Space → Zone passthrough", () => {
    expect(isKeyDelegatedToOS("Space", "enum")).toBe(true);
  });

  it("enum: Enter → Zone passthrough", () => {
    expect(isKeyDelegatedToOS("Enter", "enum")).toBe(true);
  });

  it("enum: Tab → Zone passthrough", () => {
    expect(isKeyDelegatedToOS("Tab", "enum")).toBe(true);
  });

  it("enum[]: Shift+ArrowDown → Zone passthrough (multi-select)", () => {
    expect(isKeyDelegatedToOS("Shift+ArrowDown", "enum[]")).toBe(true);
  });

  it("enum[]: Space → Zone passthrough (toggle selection)", () => {
    expect(isKeyDelegatedToOS("Space", "enum[]")).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// T12: FieldValue 일반화 — value: string → FieldValue
// ═══════════════════════════════════════════════════════════════

describe("T12: FieldValue 일반화", () => {
  beforeEach(() => {
    const fields = FieldRegistry.get().fields;
    for (const id of fields.keys()) {
      FieldRegistry.unregister(id);
    }
  });

  it("boolean 값 저장 가능", () => {
    FieldRegistry.register("dark-mode", {
      name: "dark-mode",
      fieldType: "boolean",
      defaultValue: false,
    });
    const entry = FieldRegistry.get().fields.get("dark-mode");
    expect(entry!.state.value).toBe(false);
    expect(entry!.state.defaultValue).toBe(false);
  });

  it("number 값 저장 가능", () => {
    FieldRegistry.register("volume", {
      name: "volume",
      fieldType: "number",
      defaultValue: 50,
    });
    const entry = FieldRegistry.get().fields.get("volume");
    expect(entry!.state.value).toBe(50);
  });

  it("string[] 값 저장 가능 (enum[])", () => {
    FieldRegistry.register("tags", {
      name: "tags",
      fieldType: "enum[]",
      defaultValue: ["tag1", "tag2"],
    });
    const entry = FieldRegistry.get().fields.get("tags");
    expect(entry!.state.value).toEqual(["tag1", "tag2"]);
  });

  it("boolean updateValue 가능", () => {
    FieldRegistry.register("dark-mode", {
      name: "dark-mode",
      fieldType: "boolean",
      defaultValue: false,
    });
    FieldRegistry.updateValue("dark-mode", true);
    expect(FieldRegistry.getValue("dark-mode")).toBe(true);
  });

  it("number updateValue 가능", () => {
    FieldRegistry.register("volume", {
      name: "volume",
      fieldType: "number",
      defaultValue: 0,
    });
    FieldRegistry.updateValue("volume", 75);
    expect(FieldRegistry.getValue("volume")).toBe(75);
  });

  it("기존 string 하위호환", () => {
    FieldRegistry.register("title", {
      name: "title",
      fieldType: "inline",
      defaultValue: "Hello",
    });
    expect(FieldRegistry.getValue("title")).toBe("Hello");
    FieldRegistry.updateValue("title", "World");
    expect(FieldRegistry.getValue("title")).toBe("World");
  });
});

// ═══════════════════════════════════════════════════════════════
// T14: readonly FieldType
// ═══════════════════════════════════════════════════════════════

describe("T14: readonly FieldType", () => {
  beforeEach(() => {
    const fields = FieldRegistry.get().fields;
    for (const id of fields.keys()) {
      FieldRegistry.unregister(id);
    }
  });

  it("readonly FieldType 등록 가능", () => {
    FieldRegistry.register("progress", {
      name: "progress",
      fieldType: "readonly",
      defaultValue: 42,
    });
    const entry = FieldRegistry.get().fields.get("progress");
    expect(entry!.config.fieldType).toBe("readonly");
    expect(entry!.state.value).toBe(42);
  });

  it("readonly: ArrowDown → Zone passthrough", () => {
    expect(isKeyDelegatedToOS("ArrowDown", "readonly")).toBe(true);
  });

  it("readonly: Space → Zone passthrough", () => {
    expect(isKeyDelegatedToOS("Space", "readonly")).toBe(true);
  });

  it("readonly: resolveFieldKey returns null for all keys", () => {
    FieldRegistry.register("progress", {
      name: "progress",
      fieldType: "readonly",
    });
    expect(resolveFieldKey("progress", "Space")).toBeNull();
    expect(resolveFieldKey("progress", "Enter")).toBeNull();
    expect(resolveFieldKey("progress", "ArrowDown")).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// T15: FieldConfig.options (enum 선택지)
// ═══════════════════════════════════════════════════════════════

describe("T15: FieldConfig.options", () => {
  beforeEach(() => {
    const fields = FieldRegistry.get().fields;
    for (const id of fields.keys()) {
      FieldRegistry.unregister(id);
    }
  });

  it("enum Field에 options 설정 가능", () => {
    FieldRegistry.register("priority", {
      name: "priority",
      fieldType: "enum",
      options: ["low", "medium", "high"],
      defaultValue: "medium",
    });
    const entry = FieldRegistry.get().fields.get("priority");
    expect(entry!.config.options).toEqual(["low", "medium", "high"]);
    expect(entry!.state.value).toBe("medium");
  });

  it("enum[] Field에 options 설정 가능", () => {
    FieldRegistry.register("tags", {
      name: "tags",
      fieldType: "enum[]",
      options: ["frontend", "backend", "devops"],
      defaultValue: ["frontend"],
    });
    const entry = FieldRegistry.get().fields.get("tags");
    expect(entry!.config.options).toEqual(["frontend", "backend", "devops"]);
    expect(entry!.state.value).toEqual(["frontend"]);
  });
});
