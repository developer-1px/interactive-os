import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_todo/search")({
  component: () => (
    <div className="flex-1 flex items-center justify-center text-slate-500">
      Search Placeholder
    </div>
  ),
});
