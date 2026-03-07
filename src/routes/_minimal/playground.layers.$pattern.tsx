import { createFileRoute } from "@tanstack/react-router";
import LayerShowcasePage from "../../pages/layer-showcase";

export const Route = createFileRoute("/_minimal/playground/layers/$pattern")({
  component: LayerShowcasePage,
});
