import { createFileRoute } from "@tanstack/react-router";
import ApgShowcasePage from "../../pages/apg-showcase";

export const Route = createFileRoute("/_minimal/playground/apg/$pattern")({
    component: ApgShowcasePage,
});
