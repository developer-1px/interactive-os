import { Sidebar } from "@apps/todo/widgets/Sidebar";
import { TodoPanel } from "@apps/todo/widgets/TodoPanel";
import { Zone } from "@os/6-components/primitives/Zone";

export default function TodoPage() {

  return (
    <Zone id="main" role="application" className="h-full flex">
      {/* 1. Category Navigation */}
      <Sidebar />

      {/* 2. Main Work Area */}
      <TodoPanel />
    </Zone>
  );
}
