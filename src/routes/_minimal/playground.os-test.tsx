import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import OsTestSuitePage from "../../pages/os-test-suite";

export const Route = createFileRoute("/_minimal/playground/os-test")({
  component: OsTestSuitePage,
  staticData: {
    title: "OS Test Suite",
    icon: FlaskConical,
    location: "global-nav",
    order: 8,
  },
});
