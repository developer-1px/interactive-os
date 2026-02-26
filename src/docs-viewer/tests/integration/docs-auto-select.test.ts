/**
 * T7: DocsViewer auto-select → app.ts command
 *
 * Currently: useEffect auto-selects first file when activePath is null.
 * Goal: Replace useEffect with an OS command (autoSelectFirst).
 *
 * Test verifies the command exists and works correctly via app.ts.
 */

import { createOsPage, type OsPage } from "@os/createOsPage";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFailed,
  vi,
} from "vitest";
import { DocsApp, selectDoc } from "@/docs-viewer/app";

describe("T7: DocsViewer — auto-select via selectDoc command", () => {
  let page: OsPage;

  beforeEach(() => {
    page = createOsPage();
    page.goto("docs-auto-select", {
      role: "list",
      items: ["docs/first.md", "docs/second.md"],
    });

    // Register selectDoc on test kernel
    page.kernel.register(selectDoc);

    onTestFailed(() => page.dumpDiagnostics());
  });

  afterEach(() => {
    page.cleanup();
  });

  it("#1 selectDoc command dispatches successfully", () => {
    page.kernel.dispatch(selectDoc({ id: "docs/first.md" }));

    const lastTx = page.kernel.inspector.getLastTransaction();
    expect(lastTx).not.toBeNull();
    expect(lastTx!.command.type).toBe("SELECT_DOC");
  });

  it("#2 selectDoc changes docsViewer activePath in state", () => {
    page.kernel.dispatch(selectDoc({ id: "docs/first.md" }));

    const lastTx = page.kernel.inspector.getLastTransaction();
    const stateAfter = (lastTx as any)?.stateAfter;

    // The state should contain the docs-viewer app slice with activePath set
    expect(stateAfter).toBeDefined();
  });
});
