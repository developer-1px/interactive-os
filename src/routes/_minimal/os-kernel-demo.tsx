import { createFileRoute } from "@tanstack/react-router";
import { OSKernelDemo } from "../../os-new/spike/OSKernelDemo";

export const Route = createFileRoute("/_minimal/os-kernel-demo")({
  component: OSKernelDemo,
});
