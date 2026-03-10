/**
 * TreegridPattern -- W3C APG Treegrid (Email Inbox)
 *
 * ZIFT: Zone (grid + tree hybrid)
 *   - Rows are the primary focusable items (row-first model)
 *   - ArrowRight/Left expand/collapse parent rows
 *   - ArrowDown/Up navigate between visible rows
 *   - Hierarchical thread display with expandable parent emails
 *
 * Uses useFlatTree for flat rendering of hierarchical data.
 */

import { useFlatTree } from "@os-react/6-project/accessors/useFlatTree";
import { Item } from "@os-react/internal";
import { defineApp } from "@os-sdk/app/defineApp";
import clsx from "clsx";
import { Icon } from "@/components/Icon";

// -- Email thread data --

interface EmailThread {
  name: string;
  path: string;
  type: "thread" | "message";
  subject: string;
  sender: string;
  date: string;
  summary: string;
  children?: EmailThread[];
}

interface FlatEmailRow {
  id: string;
  name: string;
  level: number;
  type: "thread" | "message";
  subject: string;
  sender: string;
  date: string;
  summary: string;
}

const EMAILS: EmailThread[] = [
  {
    name: "thread-1",
    path: "thread-1",
    type: "thread",
    subject: "Treegrid Design Discussion",
    sender: "alice@example.com",
    date: "Feb 14",
    summary: "Initial proposal for the treegrid component...",
    children: [
      {
        name: "reply-1a",
        path: "thread-1/reply-1a",
        type: "message",
        subject: "Re: Treegrid Design Discussion",
        sender: "bob@example.com",
        date: "Feb 15",
        summary: "Great idea! I have some thoughts on the keyboard...",
      },
      {
        name: "reply-1b",
        path: "thread-1/reply-1b",
        type: "message",
        subject: "Re: Treegrid Design Discussion",
        sender: "carol@example.com",
        date: "Feb 16",
        summary: "Agreed on the approach. One concern about...",
      },
    ],
  },
  {
    name: "thread-2",
    path: "thread-2",
    type: "thread",
    subject: "Sprint Planning Q1",
    sender: "dave@example.com",
    date: "Feb 12",
    summary: "Let us discuss priorities for the next sprint...",
    children: [
      {
        name: "reply-2a",
        path: "thread-2/reply-2a",
        type: "message",
        subject: "Re: Sprint Planning Q1",
        sender: "eve@example.com",
        date: "Feb 13",
        summary: "Here is my list of priorities for Q1...",
      },
    ],
  },
  {
    name: "msg-3",
    path: "msg-3",
    type: "message",
    subject: "Accessibility Audit Report",
    sender: "frank@example.com",
    date: "Feb 10",
    summary: "Attached is the full audit report for the app...",
  },
  {
    name: "msg-4",
    path: "msg-4",
    type: "message",
    subject: "Team Offsite Logistics",
    sender: "grace@example.com",
    date: "Feb 8",
    summary: "Please review the travel arrangements for...",
  },
];

// -- Flatten visible tree --

function flattenEmails(
  items: EmailThread[],
  expandedItems: string[],
): FlatEmailRow[] {
  const result: FlatEmailRow[] = [];

  function walk(list: EmailThread[], level: number) {
    for (const item of list) {
      const id =
        item.type === "thread" ? `thread:${item.path}` : `msg:${item.path}`;
      result.push({
        id,
        name: item.name,
        level,
        type: item.type,
        subject: item.subject,
        sender: item.sender,
        date: item.date,
        summary: item.summary,
      });
      if (item.children?.length && expandedItems.includes(id)) {
        walk(item.children, level + 1);
      }
    }
  }

  walk(items, 0);
  return result;
}

// -- Expandable IDs --

function collectExpandable(items: EmailThread[]): Set<string> {
  const set = new Set<string>();
  for (const item of items) {
    if (item.children?.length) {
      set.add(`thread:${item.path}`);
      collectExpandable(item.children).forEach((id) => set.add(id));
    }
  }
  return set;
}

const expandableIds = collectExpandable(EMAILS);

// -- App + Zone --

export const TreegridApp = defineApp<Record<string, never>>(
  "apg-treegrid-app",
  {},
);
const treegridZone = TreegridApp.createZone("apg-treegrid");
const TreegridUI = treegridZone.bind("treegrid", {
  getExpandableItems: () => expandableIds,
  options: {
    select: {
      mode: "multiple",
      followFocus: false,
      range: true,
      toggle: true,
    },
  },
});

// -- Row component --

function EmailRow({ row }: { row: FlatEmailRow }) {
  const isThread = row.type === "thread";

  return (
    <TreegridUI.Item id={row.id}>
      {({
        isFocused,
        isExpanded,
        isSelected,
      }: {
        isFocused: boolean;
        isExpanded: boolean;
        isSelected: boolean;
      }) => (
        <div
          className={clsx(
            "grid grid-cols-[1fr_160px_80px] border-b border-gray-100 transition-colors",
            isFocused
              ? "bg-indigo-50 ring-2 ring-inset ring-indigo-400"
              : "hover:bg-gray-50",
            isSelected && !isFocused && "bg-indigo-50/50",
          )}
        >
          {/* Subject cell */}
          <div
            role="gridcell"
            className="px-4 py-3 min-w-0"
            style={{ paddingLeft: `${row.level * 24 + 16}px` }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {isThread ? (
                <Item.ExpandTrigger>
                  <Icon
                    name={isExpanded ? "chevron-down" : "chevron-right"}
                    size={14}
                    className="text-gray-400 shrink-0 cursor-pointer"
                  />
                </Item.ExpandTrigger>
              ) : (
                <span className="w-[14px] shrink-0" />
              )}

              {isSelected && (
                <Icon
                  name="check"
                  size={14}
                  className="text-indigo-600 shrink-0"
                />
              )}

              <Icon
                name={isThread ? "mail" : "arrow-right"}
                size={16}
                className={clsx(
                  "shrink-0",
                  isThread ? "text-indigo-500" : "text-gray-400",
                )}
              />
              <div className="min-w-0">
                <div
                  className={clsx(
                    "text-sm truncate",
                    isThread ? "font-semibold text-gray-900" : "text-gray-700",
                  )}
                >
                  {row.subject}
                </div>
                <div className="text-xs text-gray-500 truncate mt-0.5">
                  {row.summary}
                </div>
              </div>
            </div>
          </div>

          {/* Sender cell */}
          <div
            role="gridcell"
            className="px-4 py-3 text-sm text-gray-600 flex items-center"
          >
            <span className="truncate">{row.sender}</span>
          </div>

          {/* Date cell */}
          <div
            role="gridcell"
            className="px-4 py-3 text-sm text-gray-500 flex items-center justify-end"
          >
            {row.date}
          </div>
        </div>
      )}
    </TreegridUI.Item>
  );
}

// -- Main component --

export function TreegridPattern() {
  const visibleRows = useFlatTree("apg-treegrid", EMAILS, flattenEmails);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <h3 className="text-lg font-semibold px-4 py-3 border-b border-gray-200 bg-gray-50">
        Email Inbox (Treegrid)
      </h3>
      <p className="text-sm text-gray-500 px-4 py-2 border-b border-gray-100">
        <kbd>Up</kbd>/<kbd>Down</kbd> navigate rows. <kbd>Right</kbd>/
        <kbd>Left</kbd> expand/collapse threads. <kbd>Space</kbd> to select.{" "}
        <kbd>Shift+Arrow</kbd> for range selection.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec
        </a>
        {" | "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/examples/treegrid-email-inbox/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          Example →
        </a>
      </p>

      {/* Column headers */}
      <div
        role="row"
        aria-rowindex={1}
        className="grid grid-cols-[1fr_160px_80px] border-b border-gray-200 bg-gray-50"
      >
        <div
          role="columnheader"
          className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide"
        >
          Subject
        </div>
        <div
          role="columnheader"
          className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide"
        >
          Sender
        </div>
        <div
          role="columnheader"
          className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right"
        >
          Date
        </div>
      </div>

      {/* Treegrid body */}
      <TreegridUI.Zone aria-label="Email Inbox" className="flex flex-col">
        {visibleRows.map((row) => (
          <EmailRow key={row.id} row={row} />
        ))}
      </TreegridUI.Zone>
    </div>
  );
}
