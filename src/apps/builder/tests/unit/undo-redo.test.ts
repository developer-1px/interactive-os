// @ts-nocheck
/**
 * undo-redo — Unit tests for Builder undo/redo commands.
 *
 * Tests via BuilderApp.create() test instance (headless).
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
    app = BuilderApp.create();
  });

  it("initially canUndo is false", () => {
    expect(app.evaluate(canUndo)).toBe(false);
    expect(app.evaluate(canRedo)).toBe(false);
  });

  it("undo reverts deleteSection", () => {
    expect(app.state.data.blocks).toHaveLength(4);

    app.dispatch(deleteSection({ id: "ncp-news" }));
    expect(app.state.data.blocks).toHaveLength(3);
    expect(app.evaluate(canUndo)).toBe(true);

    app.dispatch(undoCommand());
    expect(app.state.data.blocks).toHaveLength(4);
    expect(app.state.data.blocks.map((s) => s.id)).toContain("ncp-news");
  });

  it("redo restores the undone action", () => {
    app.dispatch(deleteSection({ id: "ncp-news" }));
    app.dispatch(undoCommand());
    expect(app.state.data.blocks).toHaveLength(4);
    expect(app.evaluate(canRedo)).toBe(true);

    app.dispatch(redoCommand());
    expect(app.state.data.blocks).toHaveLength(3);
    expect(app.state.data.blocks.map((s) => s.id)).not.toContain("ncp-news");
  });

  it("undo reverts moveSectionUp", () => {
    const originalOrder = app.state.data.blocks.map((s) => s.id);

    app.dispatch(moveSectionUp({ id: "ncp-news" }));
    expect(app.state.data.blocks[0]!.id).toBe("ncp-news");

    app.dispatch(undoCommand());
    expect(app.state.data.blocks.map((s) => s.id)).toEqual(originalOrder);
  });

  it("undo reverts updateField", () => {
    const original = app.state.data.fields["ncp-hero-title"];

    app.dispatch(updateField({ name: "ncp-hero-title", value: "Changed!" }));
    expect(app.state.data.fields["ncp-hero-title"]).toBe("Changed!");

    app.dispatch(undoCommand());
    expect(app.state.data.fields["ncp-hero-title"]).toBe(original);
  });

  it("multiple undos in sequence", () => {
    app.dispatch(deleteSection({ id: "ncp-news" }));
    app.dispatch(deleteSection({ id: "ncp-services" }));
    expect(app.state.data.blocks).toHaveLength(2);

    app.dispatch(undoCommand()); // undo delete services
    expect(app.state.data.blocks).toHaveLength(3);

    app.dispatch(undoCommand()); // undo delete news
    expect(app.state.data.blocks).toHaveLength(4);
  });

  it("redo is cleared after a new action", () => {
    app.dispatch(deleteSection({ id: "ncp-news" }));
    app.dispatch(undoCommand());
    expect(app.evaluate(canRedo)).toBe(true);

    // New action clears redo stack
    app.dispatch(updateField({ name: "ncp-hero-title", value: "New" }));
    expect(app.evaluate(canRedo)).toBe(false);
  });
});
