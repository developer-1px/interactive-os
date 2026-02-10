import { Book } from "lucide-react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_minimal/docs")({
    component: () => <Outlet />,
    staticData: {
        title: "Documentation",
        icon: Book,
        location: "global-nav-bottom",
        order: 1,
    },
});
