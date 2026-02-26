// @ts-nocheck
/**
 * undo-redo — Unit tests for Builder undo/redo commands.
 *
 * Tests via BuilderApp.create() test instance (headless).
 *
 * Top-level blocks (GreenEye preset):
 *   ge-hero, ge-tab-nav, ge-related-services, ge-section-footer, ge-footer
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  BuilderApp,
  canRedo,
  canUndo,
  deleteSection,
  moveSectionUp,
  redoCommand,
  undoCommand,
  updateField,
} from "../../app";

describe("builder undo/redo", () => {
  let app: ReturnType<typeof BuilderApp.create>;

  beforeEach(() => {
    app = BuilderApp.create({ withOS: true, history: true });
  });

  it("initially canUndo is false", () => {
    expect(app.evaluate(canUndo)).toBe(false);
    expect(app.evaluate(canRedo)).toBe(false);
  });

  it("undo reverts deleteSection", () => {
    expect(app.state.data.blocks).toHaveLength(5);

    app.dispatch(deleteSection({ id: "ge-tab-nav" }));
    expect(app.state.data.blocks).toHaveLength(4);
    expect(app.evaluate(canUndo)).toBe(true);

    app.dispatch(undoCommand());
    expect(app.state.data.blocks).toHaveLength(5);
    expect(app.state.data.blocks.map((s) => s.id)).toContain("ge-tab-nav");
  });

  it("redo restores the undone action", () => {
    app.dispatch(deleteSection({ id: "ge-tab-nav" }));
    app.dispatch(undoCommand());
    expect(app.state.data.blocks).toHaveLength(5);
    expect(app.evaluate(canRedo)).toBe(true);

    app.dispatch(redoCommand());
    expect(app.state.data.blocks).toHaveLength(4);
    expect(app.state.data.blocks.map((s) => s.id)).not.toContain("ge-tab-nav");
  });

  it("undo reverts moveSectionUp", () => {
    const originalOrder = app.state.data.blocks.map((s) => s.id);

    app.dispatch(moveSectionUp({ id: "ge-tab-nav" }));
    expect(app.state.data.blocks[0]!.id).toBe("ge-tab-nav");

    app.dispatch(undoCommand());
    expect(app.state.data.blocks.map((s) => s.id)).toEqual(originalOrder);
  });

  it("undo reverts updateField", () => {
    const hero = app.state.data.blocks.find((b) => b.id === "ge-hero")!;
    const original = hero.fields["service-name"];

    app.dispatch(
      updateField({
        sectionId: "ge-hero",
        field: "service-name",
        value: "Changed!",
      }),
    );
    expect(
      app.state.data.blocks.find((b) => b.id === "ge-hero")!.fields[
        "service-name"
      ],
    ).toBe("Changed!");

    app.dispatch(undoCommand());
    expect(
      app.state.data.blocks.find((b) => b.id === "ge-hero")!.fields[
        "service-name"
      ],
    ).toBe(original);
  });

  it("multiple undos in sequence", () => {
    app.dispatch(deleteSection({ id: "ge-tab-nav" }));
    app.dispatch(deleteSection({ id: "ge-related-services" }));
    expect(app.state.data.blocks).toHaveLength(3);

    app.dispatch(undoCommand()); // undo delete related-services
    expect(app.state.data.blocks).toHaveLength(4);

    app.dispatch(undoCommand()); // undo delete tab-nav
    expect(app.state.data.blocks).toHaveLength(5);
  });

  it("redo is cleared after a new action", () => {
    app.dispatch(deleteSection({ id: "ge-tab-nav" }));
    app.dispatch(undoCommand());
    expect(app.evaluate(canRedo)).toBe(true);

    // New action clears redo stack
    app.dispatch(
      updateField({
        sectionId: "ge-hero",
        field: "service-name",
        value: "New",
      }),
    );
    expect(app.evaluate(canRedo)).toBe(false);
  });
});
