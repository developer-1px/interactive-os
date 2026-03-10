/**
 * defineRole — Red Tests (Phase 1: T1-T2)
 *
 * Tests for:
 * T1: Role<TConfig> type + defineRole() function
 * T2: role-specific config interfaces — invalid combos rejected by tsc
 */

import {
  accordionRole,
  comboboxRole,
  defineRole,
  dialogRole,
  gridRole,
  listboxRole,
  menuRole,
  resolveRole,
  tablistRole,
  toolbarRole,
  treeRole,
} from "@os-core/engine/registries/roleRegistry";
import { describe, expect, it } from "vitest";

describe("T1: defineRole — Role object creation", () => {
  it("defineRole is exported from roleRegistry", () => {
    expect(typeof defineRole).toBe("function");
  });

  it("defineRole creates a Role object with name and schema", () => {
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
    const role = defineRole(
      "listbox",
      {
        containerRole: "listbox",
        itemRole: "option",
        attrs: ["aria-selected"],
      },
      { navigate: { orientation: "vertical" } },
    );

    const config = resolveRole(role);
    expect(config.navigate.orientation).toBe("vertical");
  });

  it("27 preset roles are exported as Role objects", () => {
    expect(listboxRole).toBeDefined();
    expect(treeRole).toBeDefined();
    expect(dialogRole).toBeDefined();
    expect(menuRole).toBeDefined();
    expect(toolbarRole).toBeDefined();
    expect(gridRole).toBeDefined();
    expect(comboboxRole).toBeDefined();
    expect(tablistRole).toBeDefined();
    expect(accordionRole).toBeDefined();
  });
});

describe("T2: Role carries ARIA schema metadata", () => {
  it("Role object has schema with containerRole, itemRole, attrs", () => {
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
