import { Layout } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import BuilderPage from "../../pages/BuilderPage";

export const Route = createFileRoute("/_minimal/builder")({
    component: BuilderPage,
    staticData: {
        title: "Web Builder",
        icon: Layout,
        location: "global-nav",
        order: 3,
    },
});
