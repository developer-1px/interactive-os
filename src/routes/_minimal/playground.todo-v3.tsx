import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import TodoPageV3 from "../../pages/TodoPageV3";

export const Route = createFileRoute("/_minimal/playground/todo-v3")({
  component: TodoPageV3,
  staticData: {
    title: "Todo v3 (defineApp)",
    icon: Package,
    location: "global-nav",
    order: 7,
  },
});
