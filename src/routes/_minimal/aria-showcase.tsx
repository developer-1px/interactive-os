import { Accessibility } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import AriaShowcasePage from "../../pages/aria-showcase";

export const Route = createFileRoute("/_minimal/aria-showcase")({
    component: AriaShowcasePage,
    staticData: {
        title: "ARIA Showcase",
        icon: Accessibility,
        location: "global-nav",
        order: 5,
    },
});
