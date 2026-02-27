import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import TestBotPoc from "../../pages/testbot-poc/TestBotPoc";

export const Route = createFileRoute("/_minimal/playground/testbot")({
    component: TestBotPoc,
    staticData: {
        title: "TestBot POC",
        icon: Bot,
        location: "global-nav",
        order: 15,
    },
});
