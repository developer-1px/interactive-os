import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Book } from "lucide-react";

export const Route = createFileRoute("/_minimal/docs")({
  component: () => <Outlet />,
  staticData: {
    title: "Documentation",
    icon: Book,
    location: "global-nav-bottom",
    order: 1,
  },
});
