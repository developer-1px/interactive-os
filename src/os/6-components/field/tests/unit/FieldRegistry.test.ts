import { describe, expect, test } from "vitest";
import { FieldRegistry } from "../../FieldRegistry";

describe("FieldRegistry", () => {
  test("should register and unregister fields", () => {
    const id = "test-field";
    FieldRegistry.register(id, { name: id });

    expect(FieldRegistry.getField(id)).toBeDefined();
    expect(FieldRegistry.getValue(id)).toBe("");

    FieldRegistry.unregister(id);
    expect(FieldRegistry.getField(id)).toBeUndefined();
  });

  test("should update value", () => {
    const id = "test-field-value";
    FieldRegistry.register(id, { name: id });

    FieldRegistry.updateValue(id, "Hello");
    expect(FieldRegistry.getValue(id)).toBe("Hello");
    expect(FieldRegistry.getField(id)?.state.isDirty).toBe(true);
  });

  test("should handle error state", () => {
    const id = "test-field-error";
    FieldRegistry.register(id, { name: id });

    FieldRegistry.setError(id, "Invalid input");
    const field = FieldRegistry.getField(id);
    expect(field?.state.error).toBe("Invalid input");
    expect(field?.state.isValid).toBe(false);

    FieldRegistry.setError(id, null);
    expect(FieldRegistry.getField(id)?.state.error).toBeNull();
    expect(FieldRegistry.getField(id)?.state.isValid).toBe(true);
  });

  test("should reset field", () => {
    const id = "test-field-reset";
    FieldRegistry.register(id, { name: id, defaultValue: "Default" });

    // Initial state (if we implemented defaultValue handling properly in register)
    // My implementation sets value to config.defaultValue || ""
    expect(FieldRegistry.getValue(id)).toBe("Default");

    FieldRegistry.updateValue(id, "Changed");
    FieldRegistry.setError(id, "Error");
    expect(FieldRegistry.getValue(id)).toBe("Changed");
    expect(FieldRegistry.getField(id)?.state.isValid).toBe(false);

    FieldRegistry.reset(id);
    expect(FieldRegistry.getValue(id)).toBe("Default"); // Reset restores to defaultValue
    expect(FieldRegistry.getField(id)?.state.error).toBeNull();
    expect(FieldRegistry.getField(id)?.state.isValid).toBe(true);
    expect(FieldRegistry.getField(id)?.state.isDirty).toBe(false);
  });
});
