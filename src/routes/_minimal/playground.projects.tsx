import { createFileRoute } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";
import { ProjectsPage } from "@/pages/ProjectsPage";

export const Route = createFileRoute("/_minimal/playground/projects")({
    component: ProjectsPage,
    staticData: {
        title: "Projects",
        icon: FolderOpen,
        location: "global-nav",
        order: 9,
    },
});
