/**
 * TodoListV2 — Spike component using bind2 pit-of-success pattern.
 *
 * Demonstrates:
 *   - zone.items((item) => JSX) — entity scope closure
 *   - item.field("completed") → <input type="checkbox" checked aria-checked />
 *   - item.field("text") → <span>{value}</span>
 *   - item.when("isCompleted") → boolean
 *   - item.trigger("Delete") → <button data-trigger-id="Delete" />
 *
 * NOTE: No raw entity access. `todo.text`, `todo.completed` are NOT in scope.
 */

import type { Bind2Config } from "./bind2";
import { bind2 } from "./bind2";
import { getTodoOrder, getTodos } from "./state";

const todoBindConfig: Bind2Config = {
  role: "listbox",
  fields: {
    completed: {
      type: "boolean",
      resolve: (id) => getTodos()[id]?.completed ?? false,
    },
    text: {
      type: "string",
      resolve: (id) => getTodos()[id]?.text ?? "",
    },
  },
  conditions: {
    isCompleted: {
      resolve: (id) => getTodos()[id]?.completed ?? false,
    },
  },
  triggers: {
    Delete: { label: "Delete" },
    Toggle: { label: "Toggle" },
  },
  getItems: () => getTodoOrder(),
};

const { Zone, items } = bind2(todoBindConfig);

export const TodoListV2: React.FC = () => {
  return (
    <Zone>
      {items((item) => (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {item.field("completed")}
          <span
            style={{
              textDecoration: item.when("isCompleted")
                ? "line-through"
                : "none",
            }}
          >
            {item.field("text")}
          </span>
          {item.trigger("Toggle", "✓")}
          {item.trigger("Delete", "×")}
        </div>
      ))}
    </Zone>
  );
};
