/**
 * APG Table Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/table/
 *
 * W3C APG Table:
 *   - role="table" on container (or native <table>)
 *   - role="row" on each row
 *   - role="rowgroup" on thead/tbody equivalents (optional)
 *   - role="columnheader" on column header cells
 *   - role="rowheader" on row header cells (optional)
 *   - role="cell" on data cells
 *   - aria-label or aria-labelledby on table
 *   - aria-sort on sortable column headers ("ascending" | "descending" | "none")
 *   - No keyboard interaction (table is a static structure, not a widget)
 *   - For interactive tables, use the Grid pattern instead
 *
 * ZIFT Classification: NONE
 *   Table is a static semantic structure. It does not navigate items (Zone),
 *   edit values (Field), or trigger actions (Trigger). No createZone, no bind.
 *   If data is dynamic, use defineApp + commands for state management.
 *
 * OS Pattern:
 *   - defineApp manages sort state via commands (no useState)
 *   - Trigger wraps sortable column header buttons (no onClick)
 *   - CSS reads aria-sort for visual indicators
 *   - Native HTML <table> provides implicit ARIA roles
 */

import { Trigger } from "@os-react/internal";
import { defineApp } from "@os-sdk/app/defineApp";
import { Icon } from "@/components/Icon";

// ─── Data ───

interface Student {
  firstName: string;
  lastName: string;
  company: string;
  address: string;
}

const STUDENTS: Student[] = [
  {
    firstName: "Fred",
    lastName: "Jackson",
    company: "Canary, Inc.",
    address: "123 Broad St.",
  },
  {
    firstName: "Sara",
    lastName: "James",
    company: "Cardinal, Inc.",
    address: "457 First St.",
  },
  {
    firstName: "Ralph",
    lastName: "Jefferson",
    company: "Robin, Inc.",
    address: "456 Main St.",
  },
  {
    firstName: "Nancy",
    lastName: "Jensen",
    company: "Eagle, Inc.",
    address: "2203 Logan Dr.",
  },
];

type SortColumn = "firstName" | "lastName" | "company" | "address";
type SortDirection = "ascending" | "descending";

// ─── App + Commands (defineApp pattern, no useState) ───

interface TableState {
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}

export const TableApp = defineApp<TableState>("apg-table-app", {
  sortColumn: "lastName",
  sortDirection: "ascending",
});

export const RESET_TABLE = TableApp.command("RESET_TABLE", () => ({
  state: {
    sortColumn: "lastName" as SortColumn,
    sortDirection: "ascending" as SortDirection,
  },
}));

export const SORT_BY_COLUMN = TableApp.command(
  "SORT_BY_COLUMN",
  (ctx, payload: { column: SortColumn }) => {
    const { column } = payload;
    const isSameColumn = ctx.state.sortColumn === column;
    const newDirection: SortDirection =
      isSameColumn && ctx.state.sortDirection === "ascending"
        ? "descending"
        : "ascending";
    return {
      state: {
        ...ctx.state,
        sortColumn: column,
        sortDirection: newDirection,
      },
    };
  },
);

// ─── Sort Logic ───

function sortStudents(
  students: Student[],
  column: SortColumn,
  direction: SortDirection,
): Student[] {
  return [...students].sort((a, b) => {
    const aVal = a[column].toLowerCase();
    const bVal = b[column].toLowerCase();
    const cmp = aVal.localeCompare(bVal);
    return direction === "ascending" ? cmp : -cmp;
  });
}

// ─── Column Definitions ───

const COLUMNS: { key: SortColumn; label: string; sortable: boolean }[] = [
  { key: "firstName", label: "First Name", sortable: true },
  { key: "lastName", label: "Last Name", sortable: true },
  { key: "company", label: "Company", sortable: true },
  { key: "address", label: "Address", sortable: false },
];

// ─── Component ───

export function TablePattern() {
  const state = TableApp.useComputed((s) => s);
  const sorted = sortStudents(STUDENTS, state.sortColumn, state.sortDirection);

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold mb-3">Table</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Table Pattern: Semantic data table with sortable columns. The
        table is a static structure (not a widget). Sortable column headers use{" "}
        <code className="text-xs bg-gray-100 px-1 rounded">aria-sort</code> to
        indicate current sort state.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/table/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec
        </a>
        {" | "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/table/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          Example →
        </a>
      </p>

      {/* Caption provides aria-describedby for the table */}
      <p id="table-caption" className="text-sm text-gray-600 mb-3">
        Students currently enrolled in WAI-ARIA 101 for the coming semester.
      </p>

      {/* Native HTML table provides implicit ARIA roles */}
      <table
        aria-label="Students"
        aria-describedby="table-caption"
        className="w-full border-collapse bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm text-sm"
      >
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                scope="col"
                aria-sort={
                  col.sortable && state.sortColumn === col.key
                    ? state.sortDirection
                    : col.sortable
                      ? "none"
                      : undefined
                }
                className="px-4 py-3 text-left font-semibold text-gray-700"
              >
                {col.sortable ? (
                  <Trigger
                    onActivate={SORT_BY_COLUMN({ column: col.key })}
                  >
                    <button
                      type="button"
                      className="
                        inline-flex items-center gap-1.5 w-full
                        text-left font-semibold text-gray-700
                        hover:text-indigo-700 focus:outline-none
                        focus-visible:ring-2 focus-visible:ring-indigo-400
                        focus-visible:ring-offset-1 rounded-sm
                        cursor-pointer
                      "
                    >
                      {col.label}
                      <SortIcon
                        column={col.key}
                        sortColumn={state.sortColumn}
                        sortDirection={state.sortDirection}
                      />
                    </button>
                  </Trigger>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((student, idx) => (
            <tr
              key={`${student.firstName}-${student.lastName}`}
              className={`
                border-b border-gray-100 last:border-b-0
                ${idx % 2 === 1 ? "bg-gray-50/50" : "bg-white"}
              `}
            >
              <td className="px-4 py-3 text-gray-900">{student.firstName}</td>
              <td className="px-4 py-3 text-gray-900">{student.lastName}</td>
              <td className="px-4 py-3 text-gray-600">{student.company}</td>
              <td className="px-4 py-3 text-gray-600">{student.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sort Icon ───

function SortIcon({
  column,
  sortColumn,
  sortDirection,
}: {
  column: SortColumn;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}) {
  if (sortColumn !== column) {
    // Unsorted: neutral indicator (W3C APG uses diamond character)
    return (
      <span
        aria-hidden="true"
        className="text-gray-300 flex-shrink-0 text-xs leading-none"
      >
        &#9670;
      </span>
    );
  }

  // Active sort column
  return (
    <Icon
      name={sortDirection === "ascending" ? "chevron-up" : "chevron-down"}
      size={14}
      className="text-indigo-600 flex-shrink-0"
      aria-hidden="true"
    />
  );
}
