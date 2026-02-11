import { createFileRoute } from "@tanstack/react-router";
import { Cpu } from "lucide-react";
import KernelLabPage from "../../pages/KernelLabPage";

export const Route = createFileRoute("/_minimal/playground/kernel")({
  component: KernelLabPage,
  staticData: {
    title: "Kernel Lab",
    icon: Cpu,
    location: "global-nav",
    order: 6,
  },
});
