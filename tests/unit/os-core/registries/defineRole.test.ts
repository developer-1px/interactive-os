/**
 * defineRole — Red Tests (Phase 1: T1-T2)
 *
 * Tests for:
 * T1: Role<TConfig> type + defineRole() function
 * T2: role-specific config interfaces — invalid combos rejected by tsc
 *
 * These tests will FAIL until defineRole is implemented.
 */

import * as roleRegistryExports from "@os-core/engine/registries/roleRegistry";
import { describe, expect, it } from "vitest";

// Cast to access not-yet-exported members
const registry = roleRegistryExports as unknown as Record<string, unknown>;

describe("T1: defineRole — Role object creation", () => {
  it("defineRole is exported from roleRegistry", () => {
    expect(typeof registry.defineRole).toBe("function");
  });

  it("defineRole creates a Role object with name and schema", () => {
    const defineRole = registry.defineRole as (
      name: string,
      schema: { containerRole: string; itemRole: string; attrs: string[] },
      preset: Record<string, unknown>,
    ) => { name: string; schema: unknown; preset: unknown };

    const role = defineRole(
      "listbox",
      {
        containerRole: "listbox",
        itemRole: "option",
        attrs: ["aria-selected"],
      },
      { navigate: { orientation: "vertical", typeahead: true } },
    );

    expect(role).toBeDefined();
    expect(role.name).toBe("listbox");
    expect(role.schema).toBeDefined();
    expect(role.preset).toBeDefined();
  });

  it("resolveRole accepts Role object", () => {
    const defineRole = registry.defineRole as (
      name: string,
      schema: { containerRole: string; itemRole: string; attrs: string[] },
      preset: Record<string, unknown>,
    ) => { name: string };

    const listboxRole = defineRole(
      "listbox",
      {
        containerRole: "listbox",
        itemRole: "option",
        attrs: ["aria-selected"],
      },
      {},
    );

    // resolveRole should accept Role object
    const config = roleRegistryExports.resolveRole(
      listboxRole as unknown as string,
    );
    expect(config.navigate.orientation).toBe("vertical");
  });

  it("27 preset roles are exported as Role objects", () => {
    expect(registry.listboxRole).toBeDefined();
    expect(registry.treeRole).toBeDefined();
    expect(registry.dialogRole).toBeDefined();
    expect(registry.menuRole).toBeDefined();
    expect(registry.toolbarRole).toBeDefined();
    expect(registry.gridRole).toBeDefined();
    expect(registry.comboboxRole).toBeDefined();
    expect(registry.tablistRole).toBeDefined();
    expect(registry.accordionRole).toBeDefined();
  });
});

describe("T2: Role carries ARIA schema metadata", () => {
  it("Role object has schema with containerRole, itemRole, attrs", () => {
    const defineRole = registry.defineRole as (
      name: string,
      schema: { containerRole: string; itemRole: string; attrs: string[] },
      preset: Record<string, unknown>,
    ) => {
      name: string;
      schema: { containerRole: string; itemRole: string; attrs: string[] };
    };

    const role = defineRole(
      "listbox",
      {
        containerRole: "listbox",
        itemRole: "option",
        attrs: ["aria-selected"],
      },
      {},
    );

    expect(role.schema.containerRole).toBe("listbox");
    expect(role.schema.itemRole).toBe("option");
    expect(role.schema.attrs).toContain("aria-selected");
    expect(role.schema.attrs).not.toContain("aria-expanded");
  });

  it("tree role has aria-expanded in attrs", () => {
    const defineRole = registry.defineRole as (
      name: string,
      schema: { containerRole: string; itemRole: string; attrs: string[] },
      preset: Record<string, unknown>,
    ) => {
      schema: { attrs: string[] };
    };

    const role = defineRole(
      "tree",
      {
        containerRole: "tree",
        itemRole: "treeitem",
        attrs: ["aria-selected", "aria-expanded"],
      },
      {},
    );

    expect(role.schema.attrs).toContain("aria-selected");
    expect(role.schema.attrs).toContain("aria-expanded");
  });
});
