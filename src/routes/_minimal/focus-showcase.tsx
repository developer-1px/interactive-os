import { MousePointer2 } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import FocusShowcasePage from "../../pages/focus-showcase";

export const Route = createFileRoute("/_minimal/focus-showcase")({
    component: FocusShowcasePage,
    staticData: {
        title: "Focus Lab",
        icon: MousePointer2,
        location: "global-nav",
        order: 4,
    },
});
