import { describe, expect, it } from "vitest";
import type { Block } from "../../model/appState";
import { findBlockInfo } from "../../model/appState";

const BLOCKS: Block[] = [
  {
    id: "hero",
    label: "Hero",
    type: "hero",
    fields: { title: "Hello" },
  },
  {
    id: "services",
    label: "Services",
    type: "services",
    fields: {},
    children: [
      {
        id: "card-1",
        label: "Card 1",
        type: "service-card",
        fields: {},
      },
      {
        id: "tabs",
        label: "Tabs",
        type: "tabs",
        fields: {},
        children: [
          {
            id: "tab-1",
            label: "Tab 1",
            type: "tab",
            fields: {},
          },
        ],
      },
    ],
  },
];

describe("findBlockInfo", () => {
  it("finds root block → depth 0", () => {
    const info = findBlockInfo(BLOCKS, "hero");
    expect(info).toEqual({ type: "hero", depth: 0 });
  });

  it("finds child block → depth 1", () => {
    const info = findBlockInfo(BLOCKS, "card-1");
    expect(info).toEqual({ type: "service-card", depth: 1 });
  });

  it("finds grandchild block → depth 2", () => {
    const info = findBlockInfo(BLOCKS, "tab-1");
    expect(info).toEqual({ type: "tab", depth: 2 });
  });

  it("returns null for non-existent id", () => {
    expect(findBlockInfo(BLOCKS, "nope")).toBeNull();
  });

  it("returns null for empty blocks", () => {
    expect(findBlockInfo([], "hero")).toBeNull();
  });

  it("returns depth 3 for deeply nested", () => {
    const deep: Block[] = [
      {
        id: "l0",
        label: "",
        type: "a",
        fields: {},
        children: [
          {
            id: "l1",
            label: "",
            type: "b",
            fields: {},
            children: [
              {
                id: "l2",
                label: "",
                type: "c",
                fields: {},
                children: [{ id: "l3", label: "", type: "d", fields: {} }],
              },
            ],
          },
        ],
      },
    ];
    expect(findBlockInfo(deep, "l3")).toEqual({ type: "d", depth: 3 });
  });
});
