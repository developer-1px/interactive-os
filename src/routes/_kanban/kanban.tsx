import { createFileRoute } from "@tanstack/react-router";
import { Columns } from "lucide-react";
import KanbanPage from "../../pages/KanbanPage";

export const Route = createFileRoute("/_kanban/kanban")({
  component: KanbanPage,
  staticData: {
    title: "Kanban",
    icon: Columns,
    location: "global-nav",
    order: 2,
  },
});
