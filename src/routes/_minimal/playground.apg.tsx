import { createFileRoute } from "@tanstack/react-router";
import { CheckSquare } from "lucide-react";
import ApgShowcasePage from "../../pages/apg-showcase";

export const Route = createFileRoute("/_minimal/playground/apg")({
    component: ApgShowcasePage,
    staticData: {
        title: "APG Suite",
        icon: CheckSquare,
        location: "global-nav",
        order: 6,
    },
});
