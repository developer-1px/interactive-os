/**
 * APG Table Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/table/
 *
 * W3C APG Table:
 *   - Native HTML <table> provides implicit ARIA roles
 *   - aria-sort on sortable column headers ("ascending" | "descending" | "none")
 *   - Table is a static structure — not a widget
 *
 * ZIFT Classification:
 *   Sorting controls use a toolbar Zone with triggers declared in bind().
 *
 * OS Pattern:
 *   - defineApp manages sort state via commands (no useState)
 *   - Trigger prop-getters on sortable column header buttons (no onClick)
 *   - CSS reads aria-sort for visual indicators
 */

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

// ─── App + Commands ───

interface TableState {
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}

export const TableApp = defineApp<TableState>("apg-table-app", {
  sortColumn: "lastName",
  sortDirection: "ascending",
});

const tableZone = TableApp.createZone("table-sort");

export const SORT_BY_COLUMN = tableZone.command(
  "SORT_BY_COLUMN",
  (ctx, payload: { column: SortColumn }) => {
    const { column } = payload;
    const isSameColumn = ctx.state.sortColumn === column;
    const newDirection: SortDirection =
      isSameColumn && ctx.state.sortDirection === "ascending"
        ? "descending"
        : "ascending";
    return {
      state: { ...ctx.state, sortColumn: column, sortDirection: newDirection },
    };
  },
);

// ─── Bind (triggers declared here — one per sortable column) ───

const TableUI = tableZone.bind({
  role: "toolbar",
  options: { navigate: { orientation: "horizontal" } },
  triggers: {
    SortFirstName: () => SORT_BY_COLUMN({ column: "firstName" }),
    SortLastName: () => SORT_BY_COLUMN({ column: "lastName" }),
    SortCompany: () => SORT_BY_COLUMN({ column: "company" }),
  },
});

// ─── Sort Logic ───

function sortStudents(
  students: Student[],
  column: SortColumn,
  direction: SortDirection,
): Student[] {
  return [...students].sort((a, b) => {
    const cmp = a[column].toLowerCase().localeCompare(b[column].toLowerCase());
    return direction === "ascending" ? cmp : -cmp;
  });
}

// ─── Column Definitions ───

type TriggerKey = "SortFirstName" | "SortLastName" | "SortCompany";

const COLUMNS: {
  key: SortColumn;
  label: string;
  sortable: boolean;
  triggerKey?: TriggerKey;
}[] = [
  {
    key: "firstName",
    label: "First Name",
    sortable: true,
    triggerKey: "SortFirstName",
  },
  {
    key: "lastName",
    label: "Last Name",
    sortable: true,
    triggerKey: "SortLastName",
  },
  {
    key: "company",
    label: "Company",
    sortable: true,
    triggerKey: "SortCompany",
  },
  { key: "address", label: "Address", sortable: false },
];

// ─── Component ───

export function TablePattern() {
  const sortColumn = TableApp.useComputed((s) => s.sortColumn);
  const sortDirection = TableApp.useComputed((s) => s.sortDirection);
  const sorted = sortStudents(STUDENTS, sortColumn, sortDirection);

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold mb-3">Table</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Table Pattern: Semantic data table with sortable columns.{" "}
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

      <p id="table-caption" className="text-sm text-gray-600 mb-3">
        Students currently enrolled in WAI-ARIA 101 for the coming semester.
      </p>

      <table
        aria-label="Students"
        aria-describedby="table-caption"
        className="w-full border-collapse bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm text-sm"
      >
        <thead>
          <TableUI.Zone
            className="bg-gray-50 border-b border-gray-200 contents"
          >
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                scope="col"
                aria-sort={
                  col.sortable && sortColumn === col.key
                    ? sortDirection
                    : col.sortable
                      ? "none"
                      : undefined
                }
                className="px-4 py-3 text-left font-semibold text-gray-700"
              >
                {col.sortable && col.triggerKey ? (
                  <TableUI.Item id={`sort-${col.key}`}>
                    <button
                      type="button"
                      {...TableUI.triggers[col.triggerKey]()}
                      className="
                        inline-flex items-center gap-1.5 w-full
                        text-left font-semibold text-gray-700
                        hover:text-indigo-700 focus:outline-none
                        focus-visible:ring-2 focus-visible:ring-indigo-400
                        focus-visible:ring-offset-1 rounded-sm cursor-pointer
                      "
                    >
                      {col.label}
                      <SortIcon
                        column={col.key}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                    </button>
                  </TableUI.Item>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </TableUI.Zone>
        </thead>
        <tbody>
          {sorted.map((student, idx) => (
            <tr
              key={`${student.firstName}-${student.lastName}`}
              className={`border-b border-gray-100 last:border-b-0 ${idx % 2 === 1 ? "bg-gray-50/50" : "bg-white"}`}
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
    return (
      <span
        aria-hidden="true"
        className="text-gray-300 flex-shrink-0 text-xs leading-none"
      >
        &#9670;
      </span>
    );
  }
  return (
    <Icon
      name={sortDirection === "ascending" ? "chevron-up" : "chevron-down"}
      size={14}
      className="text-indigo-600 flex-shrink-0"
      aria-hidden="true"
    />
  );
}
