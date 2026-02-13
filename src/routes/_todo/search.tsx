import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_todo/search")({
  component: () => (
    <div className="flex-1 flex items-center justify-center text-slate-500">
      Search Placeholder
    </div>
  ),
  staticData: {
    title: "Search",
    icon: Search,
    location: "global-nav-bottom",
    order: 0,
  },
});
