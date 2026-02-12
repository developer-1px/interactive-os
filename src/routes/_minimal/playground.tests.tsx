import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import TestDashboard from "../../pages/TestDashboard";

export const Route = createFileRoute("/_minimal/playground/tests")({
  component: TestDashboard,
  staticData: {
    title: "Test Dashboard",
    icon: FlaskConical,
    location: "global-nav",
    order: 8,
  },
});
