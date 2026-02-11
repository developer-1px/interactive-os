import { createFileRoute } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { RadixPlayground } from "../../pages/playground/RadixPlayground";

export const Route = createFileRoute("/_minimal/playground/radix")({
    component: RadixPlayground,
    staticData: {
        title: "Radix Playground",
        icon: Layers,
        location: "global-nav",
        order: 7,
    },
});
