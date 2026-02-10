import { Settings } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import SettingsPage from "../../pages/SettingsPage";

export const Route = createFileRoute("/_todo/settings")({
    component: SettingsPage,
    staticData: {
        title: "Settings",
        icon: Settings,
        location: "global-nav-bottom",
        order: 2,
    },
});
