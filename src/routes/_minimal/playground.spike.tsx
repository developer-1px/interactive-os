import { createFileRoute } from "@tanstack/react-router";
import { SpikeDemo } from "../../os-new/spike/SpikeDemo";

export const Route = createFileRoute("/_minimal/playground/spike")({
  component: SpikeDemo,
});
