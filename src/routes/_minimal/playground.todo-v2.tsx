import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import TodoPageV2 from "../../pages/TodoPageV2";

export const Route = createFileRoute("/_minimal/playground/todo-v2")({
    component: TodoPageV2,
    staticData: {
        title: "Todo v2 (Module)",
        icon: Package,
        location: "global-nav",
        order: 6,
    },
});
