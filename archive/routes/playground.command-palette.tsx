import { createFileRoute } from "@tanstack/react-router";
import { Terminal } from "lucide-react";
import CommandPalettePage from "../../pages/CommandPalettePage";

export const Route = createFileRoute("/_minimal/playground/command-palette")({
  component: CommandPalettePage,
  staticData: {
    title: "Command Palette",
    icon: Terminal,
    location: "global-nav",
    order: 8,
  },
});
