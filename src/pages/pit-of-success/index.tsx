import type React from "react";
import { createZone } from "../../spike/pit-of-success/createZone";
import {
  getTodoOrder,
  getTodos,
  resetState,
} from "../../spike/pit-of-success/state";
import { TodoListV2 } from "../../spike/pit-of-success/TodoListV2";

// ── createZone config (bind-less) ──

const TodoList = createZone({
  role: "listbox",
  getItems: () => getTodoOrder(),
  fields: {
    completed: {
      type: "boolean" as const,
      resolve: (id: string) => getTodos()[id]?.completed ?? false,
    },
    text: {
      type: "string" as const,
      resolve: (id: string) => getTodos()[id]?.text ?? "",
    },
  },
  triggers: {
    Toggle: { label: "Toggle" },
    Delete: { label: "Delete" },
  },
  zoneTriggers: {
    Reset: { label: "Reset" },
  },
});

const Toolbar = createZone({
  role: "toolbar",
  zoneFields: {
    DRAFT: {
      type: "string" as const,
      resolve: () => "",
      placeholder: "Add a task...",
    },
  },
  zoneTriggers: {
    Add: { label: "Add" },
  },
});

// ── Page ──

const PitOfSuccessPage: React.FC = () => {
  resetState();

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Pit of Success — Projection Spike
      </h1>
      <p style={{ color: "#666", marginBottom: 32 }}>
        Entity Scope Closure: item is the ONLY data access path. Raw entity not
        in scope.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        {/* Left: bind2 (v2) */}
        <Section
          title="bind2 (v2)"
          subtitle="item.field('text'), item.trigger('Delete', '×')"
        >
          <TodoListV2 />
        </Section>

        {/* Right: createZone (final) */}
        <Section
          title="createZone (final)"
          subtitle="item.text, item.Delete('×')"
        >
          <TodoList.Zone>
            {(zone) => (
              <>
                <div style={{ marginBottom: 8, color: "#888", fontSize: 13 }}>
                  {zone.count} items
                </div>
                {zone.items((item) => (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      padding: "4px 0",
                    }}
                  >
                    {item.completed}
                    <span style={{ flex: 1 }}>{item.text}</span>
                    {item.Toggle("\u2713")}
                    {item.Delete("\u00d7")}
                  </div>
                ))}
                <div style={{ marginTop: 12 }}>{zone.Reset("Reset All")}</div>
              </>
            )}
          </TodoList.Zone>
        </Section>
      </div>

      {/* Toolbar demo */}
      <Section title="Zone-level features" subtitle="zone.DRAFT(), zone.Add()">
        <Toolbar.Zone>
          {(zone) => (
            <div style={{ display: "flex", gap: 8 }}>
              {zone.DRAFT({ placeholder: "Add a task..." })}
              {zone.Add("+")}
            </div>
          )}
        </Toolbar.Zone>
      </Section>
    </div>
  );
};

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
        {title}
      </h2>
      <p
        style={{
          fontSize: 12,
          color: "#999",
          fontFamily: "monospace",
          marginBottom: 12,
        }}
      >
        {subtitle}
      </p>
      {children}
    </div>
  );
}

export default PitOfSuccessPage;
