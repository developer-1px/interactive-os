import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import PitOfSuccessPage from "../../pages/pit-of-success";

export const Route = createFileRoute("/_minimal/playground/pit-of-success")({
  component: PitOfSuccessPage,
  staticData: {
    title: "Pit of Success",
    icon: FlaskConical,
    location: "global-nav",
    order: 7,
  },
});
