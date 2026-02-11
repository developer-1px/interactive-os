import { createFileRoute } from "@tanstack/react-router";
import { MousePointer2 } from "lucide-react";
import FocusShowcasePage from "../../pages/focus-showcase";

export const Route = createFileRoute("/_minimal/playground/focus")({
  component: FocusShowcasePage,
  staticData: {
    title: "Focus Lab",
    icon: MousePointer2,
    location: "global-nav",
    order: 4,
  },
});
