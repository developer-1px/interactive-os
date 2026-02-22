/**
 * L2. Keybinding Resolution — Unit Tests
 *
 * 순수 데이터 매핑. DOM 불필요.
 * osDefaults import로 바인딩 등록 후, resolve()로 매핑 검증.
 *
 * KeyBinding stores pre-built BaseCommand objects.
 * We test by comparing command.type strings.
 */

import { describe, expect, it } from "vitest";
import { Keybindings } from "../../keybindings";

// Side-effect import: registers all OS default keybindings
import "../../osDefaults";

describe("Keybinding Resolution", () => {
  // ─── Navigating Context ───────────────────────────────────

  describe("when navigating (isEditing: false)", () => {
    const ctx = { isEditing: false };

    it("Space → OS_SELECT", () => {
      const result = Keybindings.resolve("Space", ctx);
      expect(result).not.toBeNull();
      expect((result?.command as any)?.type).toBe("OS_SELECT");
    });

    it("Enter → OS_ACTIVATE", () => {
      const result = Keybindings.resolve("Enter", ctx);
      expect(result).not.toBeNull();
      expect((result?.command as any)?.type).toBe("OS_ACTIVATE");
    });

    it("Escape → OS_ESCAPE", () => {
      const result = Keybindings.resolve("Escape", ctx);
      expect(result).not.toBeNull();
      expect((result?.command as any)?.type).toBe("OS_ESCAPE");
    });

    it("Backspace → OS_DELETE", () => {
      const result = Keybindings.resolve("Backspace", ctx);
      expect(result).not.toBeNull();
      expect((result?.command as any)?.type).toBe("OS_DELETE");
    });

    it("Delete → OS_DELETE", () => {
      const result = Keybindings.resolve("Delete", ctx);
      expect(result).not.toBeNull();
      expect((result?.command as any)?.type).toBe("OS_DELETE");
    });

    it("Meta+ArrowUp → OS_MOVE_UP", () => {
      const result = Keybindings.resolve("Meta+ArrowUp", ctx);
      expect(result).not.toBeNull();
      expect((result?.command as any)?.type).toBe("OS_MOVE_UP");
    });

    it("Meta+ArrowDown → OS_MOVE_DOWN", () => {
      const result = Keybindings.resolve("Meta+ArrowDown", ctx);
      expect(result).not.toBeNull();
      expect((result?.command as any)?.type).toBe("OS_MOVE_DOWN");
    });

    // Clipboard: Meta+C/X/V are NOT registered as keybindings
    // to preserve native browser clipboard behavior.
    it("Meta+C → null (native clipboard preserved)", () => {
      const result = Keybindings.resolve("Meta+C", ctx);
      expect(result).toBeNull();
    });

    it("Meta+X → null (native clipboard preserved)", () => {
      const result = Keybindings.resolve("Meta+X", ctx);
      expect(result).toBeNull();
    });

    it("Meta+V → null (native clipboard preserved)", () => {
      const result = Keybindings.resolve("Meta+V", ctx);
      expect(result).toBeNull();
    });

    it("ArrowDown → OS_NAVIGATE", () => {
      const result = Keybindings.resolve("ArrowDown", ctx);
      expect(result).not.toBeNull();
      expect((result?.command as any)?.type).toBe("OS_NAVIGATE");
    });

    it("F2 → OS_ACTIVATE", () => {
      // F2 triggers onAction (standard OS pattern — app decides whether to enter edit mode)
      const result = Keybindings.resolve("F2", ctx);
      expect(result).not.toBeNull();
      expect((result?.command as any)?.type).toBe("OS_ACTIVATE");
    });
  });

  // ─── Editing Context ──────────────────────────────────────

  describe("when editing (isEditing: true)", () => {
    const ctx = { isEditing: true };

    it("Enter → OS_FIELD_COMMIT (not OS_ACTIVATE)", () => {
      const result = Keybindings.resolve("Enter", ctx);
      expect(result).not.toBeNull();
      expect((result?.command as any)?.type).toBe("OS_FIELD_COMMIT");
      expect((result?.command as any)?.type).not.toBe("OS_ACTIVATE");
    });

    it("Escape → OS_FIELD_CANCEL (not OS_ESCAPE)", () => {
      const result = Keybindings.resolve("Escape", ctx);
      expect(result).not.toBeNull();
      expect((result?.command as any)?.type).toBe("OS_FIELD_CANCEL");
      expect((result?.command as any)?.type).not.toBe("OS_ESCAPE");
    });

    it("Space does NOT resolve to OS_SELECT", () => {
      const result = Keybindings.resolve("Space", ctx);
      // Should be null since Space only has navigating binding
      if (result) {
        expect((result.command as any).type).not.toBe("OS_SELECT");
      }
    });

    it("Backspace does NOT resolve to OS_DELETE", () => {
      const result = Keybindings.resolve("Backspace", ctx);
      if (result) {
        expect((result.command as any).type).not.toBe("OS_DELETE");
      }
    });
  });
});
