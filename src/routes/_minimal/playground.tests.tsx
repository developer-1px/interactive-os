import { createFileRoute } from "@tanstack/react-router";
import { TestTube2 } from "lucide-react";
import { TestDashboard } from "@/pages/TestDashboard";

export const Route = createFileRoute("/_minimal/playground/tests")({
  component: TestDashboard,
  staticData: {
    title: "Tests",
    icon: TestTube2,
    location: "global-nav",
    order: 10,
  },
});
