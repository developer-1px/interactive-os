import { createFileRoute } from "@tanstack/react-router";
import { User } from "lucide-react";

export const Route = createFileRoute("/_todo/profile")({
  component: () => (
    <div className="flex-1 flex items-center justify-center text-slate-500">
      Profile Placeholder
    </div>
  ),
  staticData: {
    title: "Profile",
    icon: User,
    location: "global-nav-bottom",
    order: 3,
  },
});
