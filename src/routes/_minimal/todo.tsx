import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import TodoPage from "../../pages/TodoPage";

export const Route = createFileRoute("/_minimal/todo")({
  component: TodoPage,
  staticData: {
    title: "Todo",
    icon: Package,
    location: "global-nav",
    order: 1,
  },
});
