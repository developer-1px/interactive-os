import { createFileRoute } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import LayerShowcasePage from "../../pages/layer-showcase";

export const Route = createFileRoute("/_minimal/playground/layers")({
  component: LayerShowcasePage,
  staticData: {
    title: "Layers",
    icon: Layers,
    location: "global-nav",
    order: 7,
  },
});
