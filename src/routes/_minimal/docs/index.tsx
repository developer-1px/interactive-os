import { createFileRoute } from "@tanstack/react-router";
import { DocsViewer } from "../../../docs-viewer/DocsViewer";

export const Route = createFileRoute("/_minimal/docs/")({
  component: DocsViewer,
});
