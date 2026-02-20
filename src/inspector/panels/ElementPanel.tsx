/**
 * ElementPanel — Inspector tab showing detailed info about the
 * currently inspected DOM element.
 *
 * Sections:
 *   1. DOM: file source, tag, display, dimensions, box model
 *   2. OS Context: Zone/Item metadata
 *   3. Component Props: React Fiber memoizedProps tree
 */

import {
  type InspectedElementState,
  useInspectedElementStore,
} from "@inspector/stores/InspectedElementStore";
import {
  Code,
  Crosshair,
  Layers,
  Layout,
  MousePointer2,
  Package,
} from "lucide-react";
import React, { useState } from "react";

// ─── Styles ───

const S = {
  panel: {
    width: "100%",
    height: "100%",
    overflow: "auto",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: "11px",
    color: "#333",
    background: "#fff",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: "12px",
    color: "#999",
    fontSize: "12px",
    padding: "24px",
    textAlign: "center" as const,
  },
  kbd: {
    background: "#f3f3f3",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "2px 6px",
    fontSize: "10px",
    fontFamily: "monospace",
    color: "#666",
  },
  section: {
    borderBottom: "1px solid #f0f0f0",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    fontSize: "10px",
    fontWeight: 600,
    color: "#888",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    background: "#fafafa",
    borderBottom: "1px solid #f0f0f0",
    cursor: "pointer",
    userSelect: "none" as const,
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 12px",
    minHeight: "24px",
    borderBottom: "1px solid #f8f8f8",
  },
  label: {
    color: "#888",
    fontSize: "10px",
    minWidth: "80px",
    flexShrink: 0,
  },
  value: {
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    fontSize: "10px",
    color: "#333",
    textAlign: "right" as const,
    wordBreak: "break-all" as const,
    flex: 1,
  },
  badge: (bg: string, fg: string) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: 600,
    background: bg,
    color: fg,
  }),
  propKey: {
    color: "#7C3AED",
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    fontSize: "10px",
  },
  propValue: {
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    fontSize: "10px",
    color: "#333",
    maxWidth: "160px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  funcValue: {
    color: "#2563EB",
    fontStyle: "italic" as const,
  },
  stringValue: {
    color: "#059669",
  },
  numberValue: {
    color: "#D97706",
  },
  boolValue: {
    color: "#DC2626",
  },
  componentHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    background: "#f8f5ff",
    borderBottom: "1px solid #f0eaff",
    fontSize: "11px",
    fontWeight: 600,
    color: "#6D28D9",
  },
  breadcrumb: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "2px",
    padding: "6px 12px",
    fontSize: "10px",
    color: "#999",
    lineHeight: "18px",
  },
  breadcrumbItem: {
    color: "#666",
  },
  breadcrumbSep: {
    color: "#ccc",
    margin: "0 2px",
  },
  breadcrumbLast: {
    color: "#EC4899",
    fontWeight: 600,
  },
} as const;

// ─── OS Type Color Map ───

const OS_COLORS: Record<string, { bg: string; fg: string }> = {
  Zone: { bg: "#EFF6FF", fg: "#2563EB" },
  Item: { bg: "#ECFDF5", fg: "#059669" },
  Field: { bg: "#F5F3FF", fg: "#7C3AED" },
  Trigger: { bg: "#FFFBEB", fg: "#D97706" },
};

// ─── Sub-Components ───

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={S.row}>
      <span style={S.label}>{label}</span>
      <span style={S.value as any}>{children}</span>
    </div>
  );
}

function PropValue({ value }: { value: unknown }) {
  if (typeof value === "string") {
    if (value.startsWith("ƒ ")) {
      return <span style={{ ...S.propValue, ...S.funcValue }}>{value}</span>;
    }
    return <span style={{ ...S.propValue, ...S.stringValue }}>"{value}"</span>;
  }
  if (typeof value === "number") {
    return <span style={{ ...S.propValue, ...S.numberValue }}>{value}</span>;
  }
  if (typeof value === "boolean") {
    return (
      <span style={{ ...S.propValue, ...S.boolValue }}>
        {value ? "true" : "false"}
      </span>
    );
  }
  if (value === null || value === undefined) {
    return (
      <span style={{ ...S.propValue, color: "#999" }}>
        {value === null ? "null" : "undefined"}
      </span>
    );
  }
  if (typeof value === "object") {
    try {
      const str = JSON.stringify(value);
      if (str.length > 60)
        return <span style={S.propValue}>{str.slice(0, 57)}…</span>;
      return <span style={S.propValue}>{str}</span>;
    } catch {
      return <span style={S.propValue}>[Object]</span>;
    }
  }
  return <span style={S.propValue}>{String(value)}</span>;
}

function BoxModelDiagram({
  boxModel,
}: {
  boxModel: NonNullable<InspectedElementState["boxModel"]>;
}) {
  const { marginTop, marginRight, marginBottom, marginLeft } = boxModel;
  const { paddingTop, paddingRight, paddingBottom, paddingLeft } = boxModel;
  const contentW = Math.round(
    boxModel.width -
      paddingLeft -
      paddingRight -
      boxModel.borderLeft -
      boxModel.borderRight,
  );
  const contentH = Math.round(
    boxModel.height -
      paddingTop -
      paddingBottom -
      boxModel.borderTop -
      boxModel.borderBottom,
  );

  const cellStyle = (bg: string): React.CSSProperties => ({
    textAlign: "center",
    fontSize: "9px",
    fontFamily: "monospace",
    padding: "2px",
    color: "#555",
    background: bg,
    minWidth: "20px",
  });

  return (
    <div style={{ padding: "8px 12px" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          fontSize: "9px",
          fontFamily: "monospace",
        }}
      >
        <tbody>
          {/* Margin Top */}
          <tr>
            <td colSpan={3} style={cellStyle("rgba(245, 158, 11, 0.15)")}>
              {marginTop > 0 ? marginTop : "—"}
            </td>
          </tr>
          {/* Middle row: ML | Padding | MR */}
          <tr>
            <td style={cellStyle("rgba(245, 158, 11, 0.15)")}>
              {marginLeft > 0 ? marginLeft : "—"}
            </td>
            <td style={{ padding: 0 }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                }}
              >
                <tbody>
                  <tr>
                    <td
                      colSpan={3}
                      style={cellStyle("rgba(16, 185, 129, 0.15)")}
                    >
                      {paddingTop > 0 ? paddingTop : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td style={cellStyle("rgba(16, 185, 129, 0.15)")}>
                      {paddingLeft > 0 ? paddingLeft : "—"}
                    </td>
                    <td
                      style={{
                        ...cellStyle("rgba(59, 130, 246, 0.15)"),
                        fontWeight: 600,
                        color: "#333",
                      }}
                    >
                      {contentW}×{contentH}
                    </td>
                    <td style={cellStyle("rgba(16, 185, 129, 0.15)")}>
                      {paddingRight > 0 ? paddingRight : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={3}
                      style={cellStyle("rgba(16, 185, 129, 0.15)")}
                    >
                      {paddingBottom > 0 ? paddingBottom : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td style={cellStyle("rgba(245, 158, 11, 0.15)")}>
              {marginRight > 0 ? marginRight : "—"}
            </td>
          </tr>
          {/* Margin Bottom */}
          <tr>
            <td colSpan={3} style={cellStyle("rgba(245, 158, 11, 0.15)")}>
              {marginBottom > 0 ? marginBottom : "—"}
            </td>
          </tr>
        </tbody>
      </table>
      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          marginTop: "6px",
          fontSize: "9px",
          color: "#999",
        }}
      >
        <span>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              background: "rgba(245, 158, 11, 0.3)",
              marginRight: 3,
              verticalAlign: "middle",
            }}
          />
          margin
        </span>
        <span>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              background: "rgba(16, 185, 129, 0.3)",
              marginRight: 3,
              verticalAlign: "middle",
            }}
          />
          padding
        </span>
        <span>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              background: "rgba(59, 130, 246, 0.3)",
              marginRight: 3,
              verticalAlign: "middle",
            }}
          />
          content
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───

export function ElementPanel() {
  const {
    element,
    isInspectorActive,
    source,
    componentStack,
    osComponentType,
    boxModel,
    osContext,
    fiberProps,
    tagName,
    primitiveName,
  } = useInspectedElementStore();

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({ dom: true, os: true, props: true, stack: false });

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Empty state
  if (!element) {
    return (
      <div style={S.emptyState}>
        <Crosshair size={32} strokeWidth={1} style={{ opacity: 0.4 }} />
        <div>
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>
            No element selected
          </div>
          <div style={{ fontSize: "11px", color: "#aaa" }}>
            Press <span style={S.kbd}>⌘D</span> to activate the inspector, then
            hover or click an element.
          </div>
        </div>
        {!isInspectorActive && (
          <div
            style={{
              marginTop: 8,
              padding: "6px 12px",
              background: "#f8f8f8",
              borderRadius: "6px",
              fontSize: "10px",
              color: "#bbb",
            }}
          >
            Inspector is inactive
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={S.panel as any}>
      {/* ── Section 1: DOM (Compact) ── */}
      <div style={S.section}>
        <div style={S.sectionHeader} onClick={() => toggleSection("dom")}>
          <Layout size={12} strokeWidth={1.5} />
          DOM
          <span style={{ marginLeft: "auto", fontSize: "9px", color: "#ccc" }}>
            {expandedSections["dom"] ? "▾" : "▸"}
          </span>
        </div>
        {expandedSections["dom"] && (
          <div>
            {/* Row 1: Identity (Tag + File) */}
            <div style={S.row}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  overflow: "hidden",
                }}
              >
                <span style={{ color: "#6B7280", fontWeight: 600 }}>
                  &lt;{tagName}&gt;
                </span>
                {primitiveName && (
                  <span
                    style={{
                      padding: "0 4px",
                      background: "#f3f3f3",
                      borderRadius: "3px",
                      fontSize: "9px",
                      color: "#666",
                      height: "16px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {primitiveName}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginLeft: "auto",
                  fontSize: "10px",
                }}
              >
                {source ? (
                  <>
                    <span style={{ color: "#2563EB", fontFamily: "monospace" }}>
                      {source.fileName}:{source.lineNumber}
                    </span>
                    {source.loc !== undefined && source.loc > 200 && (
                      <span style={{ color: "#EF4444", fontWeight: 700 }}>
                        ⚠️
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ color: "#ccc" }}>—</span>
                )}
              </div>
            </div>

            {/* Row 2: Layout Metrics (Display | Size | Radius | Gap) */}
            <div
              style={{ ...(S.row as any), borderBottom: "none", color: "#666" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                }}
              >
                {/* Display */}
                {boxModel ? (
                  <span style={{ ...S.badge("#FEF3C7", "#92400E") }}>
                    {boxModel.display}
                  </span>
                ) : (
                  <span style={{ color: "#ccc", fontSize: "9px" }}>—</span>
                )}

                <span style={{ color: "#e5e5e5" }}>|</span>

                {/* Size */}
                <span style={{ fontFamily: "monospace" }}>
                  {boxModel
                    ? `${Math.round(boxModel.width)}×${Math.round(boxModel.height)}`
                    : "—"}
                </span>

                <span style={{ color: "#e5e5e5" }}>|</span>

                {/* Radius */}
                {boxModel?.borderRadius && boxModel.borderRadius !== "0px" ? (
                  <span style={{ color: "#EC4899" }}>
                    R: {boxModel.borderRadius}
                  </span>
                ) : (
                  <span style={{ color: "#ccc" }}>R: —</span>
                )}

                <span style={{ color: "#e5e5e5" }}>|</span>

                {/* Gap */}
                {boxModel && (boxModel.rowGap > 0 || boxModel.colGap > 0) ? (
                  <span>
                    Gap:{" "}
                    {boxModel.rowGap === boxModel.colGap
                      ? boxModel.rowGap
                      : `${boxModel.rowGap}/${boxModel.colGap}`}
                  </span>
                ) : (
                  <span style={{ color: "#ccc" }}>Gap: —</span>
                )}
              </div>
            </div>

            <BoxModelDiagram
              boxModel={
                boxModel || {
                  width: 0,
                  height: 0,
                  display: "none",
                  marginTop: 0,
                  marginRight: 0,
                  marginBottom: 0,
                  marginLeft: 0,
                  paddingTop: 0,
                  paddingRight: 0,
                  paddingBottom: 0,
                  paddingLeft: 0,
                  borderTop: 0,
                  borderRight: 0,
                  borderBottom: 0,
                  borderLeft: 0,
                  rowGap: 0,
                  colGap: 0,
                  borderRadius: "0",
                }
              }
            />
          </div>
        )}
      </div>

      {/* ── Section 2: OS Context ── */}
      <div style={S.section}>
        <div style={S.sectionHeader} onClick={() => toggleSection("os")}>
          <MousePointer2 size={12} strokeWidth={1.5} />
          OS Context
          <span style={{ marginLeft: "auto", fontSize: "9px", color: "#ccc" }}>
            {expandedSections["os"] ? "▾" : "▸"}
          </span>
        </div>
        {expandedSections["os"] && (
          <div>
            <Row label="Type">
              {osComponentType ? (
                <span
                  style={S.badge(
                    OS_COLORS[osComponentType]?.bg ?? "#f3f3f3",
                    OS_COLORS[osComponentType]?.fg ?? "#666",
                  )}
                >
                  {osComponentType}
                </span>
              ) : (
                <span style={{ color: "#ccc" }}>—</span>
              )}
            </Row>
            <Row label="Zone ID">
              {osContext?.zoneId ? (
                <span style={{ color: "#2563EB", fontWeight: 500 }}>
                  {osContext.zoneId}
                </span>
              ) : (
                <span style={{ color: "#ccc" }}>—</span>
              )}
            </Row>
            <Row label="Item ID">
              {osContext?.itemId ? (
                <span style={{ color: "#059669", fontWeight: 500 }}>
                  {osContext.itemId}
                </span>
              ) : (
                <span style={{ color: "#ccc" }}>—</span>
              )}
            </Row>
          </div>
        )}
      </div>

      {/* ── Section 3: Component Stack (Moved Up) ── */}
      <div style={S.section}>
        <div style={S.sectionHeader} onClick={() => toggleSection("stack")}>
          <Layers size={12} strokeWidth={1.5} />
          Component Stack
          <span
            style={{
              marginLeft: "4px",
              fontSize: "9px",
              color: "#bbb",
            }}
          >
            ({componentStack.length})
          </span>
          <span style={{ marginLeft: "auto", fontSize: "9px", color: "#ccc" }}>
            {expandedSections["stack"] ? "▾" : "▸"}
          </span>
        </div>
        {expandedSections["stack"] ? (
          <div style={{ padding: "4px 0" }}>
            {componentStack.length > 0 ? (
              componentStack.map((name, i) => (
                <div
                  key={name + i}
                  style={{
                    padding: "3px 12px",
                    paddingLeft: `${12 + i * 8}px`,
                    fontSize: "10px",
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    color: i === componentStack.length - 1 ? "#EC4899" : "#666",
                    fontWeight: i === componentStack.length - 1 ? 600 : 400,
                  }}
                >
                  {i > 0 && (
                    <span style={{ color: "#ddd", marginRight: "4px" }}>└</span>
                  )}
                  {name}
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: "8px 12px",
                  color: "#ccc",
                  fontSize: "10px",
                  fontStyle: "italic",
                }}
              >
                Stack unavailable
              </div>
            )}
          </div>
        ) : (
          <div style={S.breadcrumb}>
            {componentStack.length > 0 ? (
              componentStack.slice(-4).map((name, i, arr) => (
                <React.Fragment key={name + i}>
                  <span
                    style={
                      i === arr.length - 1 ? S.breadcrumbLast : S.breadcrumbItem
                    }
                  >
                    {name}
                  </span>
                  {i < arr.length - 1 && <span style={S.breadcrumbSep}>›</span>}
                </React.Fragment>
              ))
            ) : (
              <span style={{ color: "#ccc" }}>—</span>
            )}
          </div>
        )}
      </div>

      {/* ── Section 4: Component Props (Moved Down) ── */}
      <div style={S.section}>
        <div style={S.sectionHeader} onClick={() => toggleSection("props")}>
          <Package size={12} strokeWidth={1.5} />
          Component Props
          <span style={{ marginLeft: "auto", fontSize: "9px", color: "#ccc" }}>
            {expandedSections["props"] ? "▾" : "▸"}
          </span>
        </div>
        {expandedSections["props"] &&
          (fiberProps.length > 0 ? (
            fiberProps.map((entry, idx) => (
              <div key={entry.componentName + idx}>
                <div style={S.componentHeader}>
                  <Code size={11} strokeWidth={1.5} />
                  {entry.componentName}
                </div>
                {Object.entries(entry.props).map(([key, val]) => (
                  <div key={key} style={S.row}>
                    <span style={S.propKey}>{key}</span>
                    <PropValue value={val} />
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div
              style={{
                padding: "8px 12px",
                color: "#ccc",
                fontSize: "10px",
                fontStyle: "italic",
              }}
            >
              No React props found
            </div>
          ))}
      </div>
    </div>
  );
}
