import { createFileRoute } from "@tanstack/react-router";
import OsTestSuitePage from "../../pages/os-test-suite";

export const Route = createFileRoute("/_minimal/playground/os-test/$pattern")({
  component: OsTestSuitePage,
});
