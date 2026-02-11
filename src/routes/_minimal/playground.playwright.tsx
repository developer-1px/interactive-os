import { createFileRoute } from "@tanstack/react-router";
import PlaywrightRunnerPage from "../../pages/PlaywrightRunnerPage";

export const Route = createFileRoute("/_minimal/playground/playwright")({
  component: PlaywrightRunnerPage,
});
