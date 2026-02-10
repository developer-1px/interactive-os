import { Cpu } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import KernelLabPage from "../../pages/KernelLabPage";

export const Route = createFileRoute("/_minimal/kernel-lab")({
    component: KernelLabPage,
    staticData: {
        title: "Kernel Lab",
        icon: Cpu,
        location: "global-nav",
        order: 6,
    },
});
