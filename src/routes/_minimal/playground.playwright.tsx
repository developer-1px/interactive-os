import { createFileRoute } from "@tanstack/react-router";
import { Play } from "lucide-react";
import PlaywrightRunnerPage from "../../pages/PlaywrightRunnerPage";

export const Route = createFileRoute("/_minimal/playground/playwright")({
  component: PlaywrightRunnerPage,
  staticData: {
    title: "Playwright",
    icon: Play,
    location: "global-nav",
    order: 8,
  },
});
