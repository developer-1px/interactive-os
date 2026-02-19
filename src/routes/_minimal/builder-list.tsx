import { createFileRoute } from "@tanstack/react-router";
import { LayoutList } from "lucide-react";
import BuilderListPage from "../../pages/BuilderListPage";

export const Route = createFileRoute("/_minimal/builder-list")({
    component: BuilderListPage,
    staticData: {
        title: "Builder Pages",
        icon: LayoutList,
        location: "global-nav",
        order: 2, // Placed before the Builder
        isAppShell: true,
    },
});
